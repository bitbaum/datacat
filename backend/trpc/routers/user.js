const {
  router,
  publicProcedure,
  authedProcedure,
  adminProcedure,
  prisma,
  z,
  TRPCError,
} = require('../../lib/trpc');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserCreateInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const UserUpdateInput = z.object({
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

const userRouter = router({
  // Get current user
  me: authedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        organization: true,
        _count: {
          select: {
            forms: true,
            submissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }),

  // Register new user
  register: publicProcedure.input(UserCreateInput).mutation(async ({ input }) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }),

  // Login user
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is deactivated',
        });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      // Remove sensitive data
      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    }),

  // Update user profile
  updateProfile: authedProcedure.input(UserUpdateInput).mutation(async ({ ctx, input }) => {
    const user = await prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    });

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }),

  // Get user stats (admin only)
  getStats: adminProcedure.query(async () => {
    const [totalUsers, activeUsers, todaysSignups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      todaysSignups,
    };
  }),

  // List users (admin only)
  list: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            isActive: true,
            createdAt: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                forms: true,
                submissions: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),
});

module.exports = userRouter;
