const { initTRPC, TRPCError } = require('@trpc/server');
const { z } = require('zod');
const prisma = require('./prisma');

// Initialize tRPC
const t = initTRPC.context().create();

// Export reusable router and procedure helpers
const router = t.router;
const publicProcedure = t.procedure;

// Authenticated procedure middleware
const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // User is now guaranteed to be defined
    },
  });
});

// Admin procedure middleware
const adminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});

module.exports = {
  router,
  publicProcedure,
  authedProcedure,
  adminProcedure,
  prisma,
  z,
  TRPCError,
};
