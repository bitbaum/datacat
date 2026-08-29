const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

class WebSocketService {
  constructor() {
    this.io = null;
    this.authenticatedSockets = new Map(); // socketId -> user
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;

          if (!token) {
            socket.emit('auth-error', { message: 'No token provided' });
            return;
          }

          // Verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              organizationId: true,
              isActive: true,
            },
          });

          if (!user || !user.isActive) {
            socket.emit('auth-error', { message: 'Invalid or inactive user' });
            return;
          }

          // Store authenticated user
          this.authenticatedSockets.set(socket.id, user);

          if (!this.userSockets.has(user.id)) {
            this.userSockets.set(user.id, new Set());
          }
          this.userSockets.get(user.id).add(socket.id);

          // Join user-specific room
          socket.join(`user:${user.id}`);

          // Join organization room if applicable
          if (user.organizationId) {
            socket.join(`org:${user.organizationId}`);
          }

          socket.emit('authenticated', {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });

          console.log(`User ${user.email} authenticated on socket ${socket.id}`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth-error', { message: 'Authentication failed' });
        }
      });

      // Handle form subscription
      socket.on('subscribe-form', async (data) => {
        const user = this.authenticatedSockets.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          const { formId } = data;

          // Check if user has access to the form
          const form = await prisma.form.findFirst({
            where: {
              id: formId,
              OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
            },
          });

          if (!form) {
            socket.emit('error', { message: 'Form not found or access denied' });
            return;
          }

          // Join form-specific room
          socket.join(`form:${formId}`);
          socket.emit('subscribed', { formId });

          console.log(`User ${user.email} subscribed to form ${formId}`);
        } catch (error) {
          console.error('Form subscription error:', error);
          socket.emit('error', { message: 'Subscription failed' });
        }
      });

      // Handle form unsubscription
      socket.on('unsubscribe-form', (data) => {
        const { formId } = data;
        socket.leave(`form:${formId}`);
        socket.emit('unsubscribed', { formId });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.authenticatedSockets.get(socket.id);
        if (user) {
          // Remove socket from user's socket set
          const userSocketSet = this.userSockets.get(user.id);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(user.id);
            }
          }

          this.authenticatedSockets.delete(socket.id);
          console.log(`User ${user.email} disconnected from socket ${socket.id}`);
        } else {
          console.log(`Unauthenticated socket disconnected: ${socket.id}`);
        }
      });
    });
  }

  // Send real-time notifications
  notifyNewSubmission(formId, submission) {
    if (this.io) {
      this.io.to(`form:${formId}`).emit('new-submission', {
        type: 'new-submission',
        formId,
        submission: {
          id: submission.id,
          submittedAt: submission.submittedAt,
          status: submission.status,
          source: submission.source,
        },
        timestamp: new Date(),
      });
    }
  }

  notifyAnalysisComplete(formId, submissionId, analysisResults) {
    if (this.io) {
      this.io.to(`form:${formId}`).emit('analysis-complete', {
        type: 'analysis-complete',
        formId,
        submissionId,
        analysisResults: analysisResults.map((result) => ({
          id: result.id,
          analysisType: result.analysisType,
          confidence: result.confidence,
          status: result.status,
        })),
        timestamp: new Date(),
      });
    }
  }

  notifyFormUpdate(formId, updateType, data) {
    if (this.io) {
      this.io.to(`form:${formId}`).emit('form-update', {
        type: 'form-update',
        formId,
        updateType, // 'schema', 'settings', 'publish', etc.
        data,
        timestamp: new Date(),
      });
    }
  }

  notifyCollaboratorActivity(formId, userId, activity) {
    if (this.io) {
      this.io.to(`form:${formId}`).emit('collaborator-activity', {
        type: 'collaborator-activity',
        formId,
        userId,
        activity, // 'joined', 'editing', 'left', etc.
        timestamp: new Date(),
      });
    }
  }

  // Send notifications to specific user
  notifyUser(userId, notification) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date(),
      });
    }
  }

  // Send system-wide announcements (admin only)
  broadcastAnnouncement(announcement, excludeUserId = null) {
    if (this.io) {
      const event = {
        type: 'announcement',
        ...announcement,
        timestamp: new Date(),
      };

      if (excludeUserId) {
        // Send to all authenticated users except the excluded one
        this.authenticatedSockets.forEach((user, socketId) => {
          if (user.id !== excludeUserId) {
            this.io.to(socketId).emit('announcement', event);
          }
        });
      } else {
        // Send to all authenticated users
        this.io.emit('announcement', event);
      }
    }
  }

  // Get online users for a form
  getOnlineUsersForForm(formId) {
    if (!this.io) return [];

    const room = this.io.sockets.adapter.rooms.get(`form:${formId}`);
    if (!room) return [];

    const onlineUsers = [];
    room.forEach((socketId) => {
      const user = this.authenticatedSockets.get(socketId);
      if (user) {
        onlineUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    });

    return onlineUsers;
  }

  // Get connection statistics
  getConnectionStats() {
    if (!this.io) {
      return {
        totalConnections: 0,
        authenticatedConnections: 0,
        uniqueUsers: 0,
      };
    }

    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedConnections: this.authenticatedSockets.size,
      uniqueUsers: this.userSockets.size,
    };
  }

  // Health check
  isHealthy() {
    return this.io !== null && this.io.sockets.sockets.size >= 0;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
