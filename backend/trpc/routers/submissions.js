const {
  router,
  publicProcedure,
  authedProcedure,
  prisma,
  z,
  TRPCError,
} = require('../../lib/trpc');

const SubmissionCreateInput = z.object({
  formId: z.string().optional(), // For direct submissions
  sharedLinkSlug: z.string().optional(), // For shared link submissions
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});

const submissionsRouter = router({
  // Get all submissions for user's forms
  list: authedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().min(1).max(100).default(20),
        formId: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSED', 'ARCHIVED', 'DELETED']).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, formId, status, dateFrom, dateTo } = input;
      const skip = (page - 1) * limit;

      const where = {
        form: { userId: ctx.user.id },
        ...(formId && { formId }),
        ...(status && { status }),
        ...((dateFrom || dateTo) && {
          submittedAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      };

      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          skip,
          take: limit,
          include: {
            form: {
              select: {
                id: true,
                title: true,
              },
            },
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                analyses: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.submission.count({ where }),
      ]);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single submission
  get: authedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const submission = await prisma.submission.findFirst({
      where: {
        id: input.id,
        form: { userId: ctx.user.id },
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            schema: true,
          },
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!submission) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Submission not found',
      });
    }

    return submission;
  }),

  // Create submission (public endpoint for shared forms)
  create: publicProcedure.input(SubmissionCreateInput).mutation(async ({ input, ctx }) => {
    let form;
    let sharedLink;

    // Handle shared link submission
    if (input.sharedLinkSlug) {
      sharedLink = await prisma.sharedLink.findUnique({
        where: { slug: input.sharedLinkSlug },
        include: { form: true },
      });

      if (!sharedLink || !sharedLink.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form link not found or expired',
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

      form = sharedLink.form;
    } else if (input.formId) {
      // Direct form submission (requires auth)
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for direct form submission',
        });
      }

      form = await prisma.form.findFirst({
        where: {
          id: input.formId,
          OR: [{ userId: ctx.user.id }, { collaborators: { some: { userId: ctx.user.id } } }],
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Either formId or sharedLinkSlug must be provided',
      });
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formId: form.id,
        submitterId: ctx.user?.id,
        data: input.data,
        metadata: {
          ...input.metadata,
          source: input.sharedLinkSlug ? 'SHARED_LINK' : 'DIRECT',
          userAgent: ctx.req?.headers['user-agent'],
          ipAddress: ctx.req?.ip,
        },
        source: input.sharedLinkSlug ? 'SHARED_LINK' : 'DIRECT',
      },
    });

    // Update shared link submission count
    if (sharedLink) {
      await prisma.sharedLink.update({
        where: { id: sharedLink.id },
        data: { currentSubmissions: { increment: 1 } },
      });
    }

    // Queue LLM analysis if enabled
    const hasLLMAnalysis = form.settings?.enableLLMAnalysis;
    if (hasLLMAnalysis) {
      await prisma.backgroundJob.create({
        data: {
          type: 'LLM_ANALYSIS',
          data: {
            submissionId: submission.id,
            formId: form.id,
            analysisTypes: form.settings.llmAnalysisTypes || ['SENTIMENT', 'CLASSIFICATION'],
          },
          priority: 1,
        },
      });
    }

    return submission;
  }),

  // Update submission status
  updateStatus: authedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PENDING', 'PROCESSED', 'ARCHIVED', 'DELETED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const submission = await prisma.submission.findFirst({
        where: {
          id: input.id,
          form: { userId: ctx.user.id },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found',
        });
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return updatedSubmission;
    }),

  // Get submission statistics
  getStats: authedProcedure
    .input(
      z.object({
        formId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { formId, dateFrom, dateTo } = input;

      const where = {
        form: { userId: ctx.user.id },
        ...(formId && { formId }),
        ...((dateFrom || dateTo) && {
          submittedAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      };

      const [total, today, thisWeek, byStatus, bySource] = await Promise.all([
        // Total submissions
        prisma.submission.count({ where }),

        // Today's submissions
        prisma.submission.count({
          where: {
            ...where,
            submittedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),

        // This week's submissions
        prisma.submission.count({
          where: {
            ...where,
            submittedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // By status
        prisma.submission.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),

        // By source
        prisma.submission.groupBy({
          by: ['source'],
          where,
          _count: { source: true },
        }),
      ]);

      return {
        total,
        today,
        thisWeek,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        bySource: bySource.reduce((acc, item) => {
          acc[item.source] = item._count.source;
          return acc;
        }, {}),
      };
    }),

  // Export submissions
  export: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        format: z.enum(['json', 'csv']).default('json'),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { formId, format, dateFrom, dateTo } = input;

      // Check form ownership
      const form = await prisma.form.findFirst({
        where: {
          id: formId,
          userId: ctx.user.id,
        },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }

      // Queue export job
      const job = await prisma.backgroundJob.create({
        data: {
          type: 'DATA_EXPORT',
          data: {
            formId,
            format,
            userId: ctx.user.id,
            dateFrom,
            dateTo,
          },
          priority: 2,
        },
      });

      return { jobId: job.id, message: 'Export job queued' };
    }),

  // Delete submission
  delete: authedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const submission = await prisma.submission.findFirst({
      where: {
        id: input.id,
        form: { userId: ctx.user.id },
      },
    });

    if (!submission) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Submission not found',
      });
    }

    await prisma.submission.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),
});

module.exports = submissionsRouter;
