const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const appRouter = require('../trpc');

// Create context for tRPC
const createContext = async ({ req, res }) => {
  let user = null;

  // Try to get user from JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await prisma.user.findUnique({
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

      // Check if user is active
      if (user && !user.isActive) {
        user = null;
      }
    } catch (error) {
      // Invalid token, user remains null
      console.warn('Invalid JWT token:', error.message);
    }
  }

  return {
    req,
    res,
    user,
    prisma,
  };
};

// Create Express middleware
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ error, type, path, input }) => {
    console.error(`tRPC Error [${type}] at ${path}:`, error);

    // Log input for debugging (be careful with sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.error('Input:', input);
    }
  },
});

module.exports = {
  trpcMiddleware,
  createContext,
  appRouter,
};
