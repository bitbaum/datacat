const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
require('dotenv').config();

const app = express();
const server = createServer(app);
const { trpcMiddleware } = require('./middleware/trpc');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const webSocketService = require('./services/websocket');

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  pinoHttp({
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }),
);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'DataCat Backend API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      trpc: '/api/trpc',
      rest: '/api/v1',
    },
  });
});

// Dedicated health endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// tRPC API (primary)
app.use('/api/trpc', trpcMiddleware);

// Legacy REST API routes (for backward compatibility)
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/forms', require('./routes/forms'));
app.use('/api/v1/submissions', require('./routes/submissions'));
app.use('/api/v1/databases', require('./routes/database'));

// Data Ingestion API routes
app.use('/api/v1/audio', require('./routes/audio'));
app.use('/api/v1/images', require('./routes/images'));
app.use('/api/v1/videos', require('./routes/videos'));
app.use('/api/v1/websites', require('./routes/websites'));
app.use('/api/v1/db-ingestion', require('./routes/dbIngestion'));

// Deprecated REST routes (redirect to v1)
app.use('/api/auth', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved to /api/v1/auth',
    deprecated: true,
  });
});
app.use('/api/user', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved to /api/v1/user',
    deprecated: true,
  });
});
app.use('/api/forms', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved to /api/v1/forms',
    deprecated: true,
  });
});
app.use('/api/submissions', (req, res) => {
  res.status(301).json({
    message: 'This endpoint has moved to /api/v1/submissions',
    deprecated: true,
  });
});

const PORT = process.env.PORT || 5001;

// Initialize WebSocket service
webSocketService.initialize(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DataCat Backend Server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/trpc`);
  console.log(`🔌 WebSocket server ready for real-time connections`);
  console.log(`📚 Architecture documentation: /backend/ARCHITECTURE.md`);
});
