const { PrismaClient } = require('../generated/prisma');

// Create a single instance of Prisma Client
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

module.exports = prisma;
