const {
  router,
  publicProcedure,
  authedProcedure,
  prisma,
  z,
  TRPCError,
} = require('../../lib/trpc');
const { nanoid } = require('nanoid');

const FormCreateInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  schema: z.any(), // Form field definitions
  settings: z.record(z.any()).optional(),
  isTemplate: z.boolean().default(false),
  templateTags: z.array(z.string()).optional(),
});

const FormUpdateInput = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  schema: z.any().optional(),
  settings: z.record(z.any()).optional(),
  isPublished: z.boolean().optional(),
});

const ShareSettingsInput = z.object({
  accessType: z.enum(['PRIVATE', 'RESTRICTED', 'PUBLIC']),
  requireAuth: z.boolean().default(false),
  allowAnonymous: z.boolean().default(true),
  collectEmails: z.boolean().default(false),
  allowMultipleSubmissions: z.boolean().default(false),
  notificationSettings: z.record(z.any()).optional(),
});

const SharedLinkInput = z.object({
  accessType: z.enum(['PRIVATE', 'RESTRICTED', 'PUBLIC']).default('PUBLIC'),
  requiresAuth: z.boolean().default(false),
  expiresAt: z.date().optional(),
  maxSubmissions: z.number().positive().optional(),
  allowedDomains: z.array(z.string()).optional(),
  password: z.string().optional(),
});

const formsRouter = router({
  // Get all forms for current user
  list: authedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().min(1).max(50).default(20),
        search: z.string().optional(),
        isTemplate: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, isTemplate, isPublished } = input;
      const skip = (page - 1) * limit;

      const where = {
        userId: ctx.user.id,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(isTemplate !== undefined && { isTemplate }),
        ...(isPublished !== undefined && { isPublished }),
      };

      const [forms, total] = await Promise.all([
        prisma.form.findMany({
          where,
          skip,
          take: limit,
          include: {
            shareSettings: true,
            _count: {
              select: {
                submissions: true,
                sharedLinks: true,
                collaborators: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.form.count({ where }),
      ]);

      return {
        forms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single form by ID
  get: authedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const form = await prisma.form.findFirst({
      where: {
        id: input.id,
        OR: [{ userId: ctx.user.id }, { collaborators: { some: { userId: ctx.user.id } } }],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        shareSettings: true,
        sharedLinks: true,
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
            analysisResults: true,
          },
        },
      },
    });

    if (!form) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Form not found',
      });
    }

    return form;
  }),

  // Create new form
  create: authedProcedure.input(FormCreateInput).mutation(async ({ ctx, input }) => {
    const form = await prisma.form.create({
      data: {
        ...input,
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
        settings: input.settings || {},
        templateTags: input.templateTags || [],
      },
      include: {
        _count: {
          select: {
            submissions: true,
            sharedLinks: true,
          },
        },
      },
    });

    return form;
  }),

  // Update form
  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        data: FormUpdateInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership or collaboration access
      const existingForm = await prisma.form.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            {
              collaborators: {
                some: {
                  userId: ctx.user.id,
                  role: { in: ['EDITOR', 'ADMIN'] },
                },
              },
            },
          ],
        },
      });

      if (!existingForm) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found or insufficient permissions',
        });
      }

      // Create version if schema changed
      if (
        input.data.schema &&
        JSON.stringify(input.data.schema) !== JSON.stringify(existingForm.schema)
      ) {
        await prisma.formVersion.create({
          data: {
            formId: input.id,
            version: existingForm.currentVersion + 1,
            schema: existingForm.schema,
            settings: existingForm.settings,
            createdBy: ctx.user.id,
          },
        });
      }

      const form = await prisma.form.update({
        where: { id: input.id },
        data: {
          ...input.data,
          ...(input.data.schema && { currentVersion: existingForm.currentVersion + 1 }),
        },
        include: {
          shareSettings: true,
          _count: {
            select: {
              submissions: true,
              sharedLinks: true,
            },
          },
        },
      });

      return form;
    }),

  // Delete form
  delete: authedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const form = await prisma.form.findFirst({
      where: {
        id: input.id,
        userId: ctx.user.id,
      },
    });

    if (!form) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Form not found',
      });
    }

    await prisma.form.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  // Update share settings
  updateShareSettings: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        settings: ShareSettingsInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const form = await prisma.form.findFirst({
        where: {
          id: input.formId,
          userId: ctx.user.id,
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }

      const shareSettings = await prisma.shareSettings.upsert({
        where: { formId: input.formId },
        create: {
          formId: input.formId,
          ...input.settings,
          notificationSettings: input.settings.notificationSettings || {},
        },
        update: {
          ...input.settings,
          notificationSettings: input.settings.notificationSettings || {},
        },
      });

      return shareSettings;
    }),

  // Create shared link
  createSharedLink: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        settings: SharedLinkInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const form = await prisma.form.findFirst({
        where: {
          id: input.formId,
          userId: ctx.user.id,
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }

      const sharedLink = await prisma.sharedLink.create({
        data: {
          formId: input.formId,
          slug: nanoid(10),
          ...input.settings,
          allowedDomains: input.settings.allowedDomains || [],
          metadata: {},
        },
      });

      return sharedLink;
    }),

  // Get shared links for form
  getSharedLinks: authedProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ ctx, input }) => {
      const form = await prisma.form.findFirst({
        where: {
          id: input.formId,
          userId: ctx.user.id,
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }

      const sharedLinks = await prisma.sharedLink.findMany({
        where: { formId: input.formId },
        orderBy: { createdAt: 'desc' },
      });

      return sharedLinks;
    }),

  // Update shared link
  updateSharedLink: authedProcedure
    .input(
      z.object({
        id: z.string(),
        settings: SharedLinkInput.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership through form
      const sharedLink = await prisma.sharedLink.findFirst({
        where: {
          id: input.id,
          form: { userId: ctx.user.id },
        },
      });

      if (!sharedLink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shared link not found',
        });
      }

      const updatedLink = await prisma.sharedLink.update({
        where: { id: input.id },
        data: input.settings,
      });

      return updatedLink;
    }),

  // Delete shared link
  deleteSharedLink: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sharedLink = await prisma.sharedLink.findFirst({
        where: {
          id: input.id,
          form: { userId: ctx.user.id },
        },
      });

      if (!sharedLink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shared link not found',
        });
      }

      await prisma.sharedLink.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get public form by shared link slug
  getBySharedLink: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const sharedLink = await prisma.sharedLink.findUnique({
        where: { slug: input.slug },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              schema: true,
              settings: true,
              user: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!sharedLink || !sharedLink.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found or link has expired',
        });
      }

      // Check expiration
      if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'GONE',
          message: 'This form link has expired',
        });
      }

      // Check submission limit
      if (sharedLink.maxSubmissions && sharedLink.currentSubmissions >= sharedLink.maxSubmissions) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This form has reached its submission limit',
        });
      }

      return {
        form: sharedLink.form,
        linkSettings: {
          accessType: sharedLink.accessType,
          requiresAuth: sharedLink.requiresAuth,
          allowedDomains: sharedLink.allowedDomains,
          maxSubmissions: sharedLink.maxSubmissions,
          currentSubmissions: sharedLink.currentSubmissions,
        },
      };
    }),

  // Get form templates
  getTemplates: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().min(1).max(50).default(20),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, tags, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        isTemplate: true,
        isPublished: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(tags &&
          tags.length > 0 && {
            templateTags: { hasSome: tags },
          }),
      };

      const [templates, total] = await Promise.all([
        prisma.form.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            description: true,
            schema: true,
            templateTags: true,
            createdAt: true,
            user: {
              select: { name: true },
            },
            _count: {
              select: { submissions: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.form.count({ where }),
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),
});

module.exports = formsRouter;
