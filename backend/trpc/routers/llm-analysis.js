const { router, authedProcedure, adminProcedure, prisma, z, TRPCError } = require('../../lib/trpc');
const LLMAnalysisService = require('../../services/llm-analysis');
const { QueueManager } = require('../../jobs/queue');

// Lazy load the LLM service to avoid startup crashes
let llmAnalysisService = null;
const getLLMService = () => {
  if (!llmAnalysisService) {
    llmAnalysisService = new LLMAnalysisService();
  }
  return llmAnalysisService;
};

const llmAnalysisRouter = router({
  // Get analysis results for a submission
  getSubmissionAnalysis: authedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const submission = await prisma.submission.findFirst({
        where: {
          id: input.submissionId,
          form: { userId: ctx.user.id },
        },
        include: {
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

      return submission.analyses;
    }),

  // Trigger analysis for a submission
  analyzeSubmission: authedProcedure
    .input(
      z.object({
        submissionId: z.string(),
        analysisTypes: z
          .array(z.enum(['SENTIMENT', 'CLASSIFICATION', 'EXTRACTION', 'SUMMARY', 'CUSTOM']))
          .default(['SENTIMENT', 'CLASSIFICATION']),
        priority: z.number().min(1).max(10).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if submission belongs to user
      const submission = await prisma.submission.findFirst({
        where: {
          id: input.submissionId,
          form: { userId: ctx.user.id },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found',
        });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'LLM analysis is not configured. Please contact your administrator.',
        });
      }

      // Queue analysis job
      const job = await QueueManager.addAnalysisJob(input.submissionId, {
        analysisTypes: input.analysisTypes,
        priority: input.priority,
      });

      return {
        jobId: job.id,
        message: 'Analysis queued successfully',
        estimatedCompletion: new Date(Date.now() + 30000), // ~30 seconds estimate
      };
    }),

  // Bulk analyze multiple submissions
  bulkAnalyze: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        analysisTypes: z
          .array(z.enum(['SENTIMENT', 'CLASSIFICATION', 'EXTRACTION', 'SUMMARY', 'CUSTOM']))
          .default(['SENTIMENT', 'CLASSIFICATION']),
        batchSize: z.number().min(1).max(100).default(10),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check form ownership
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

      // Get submissions that need analysis
      const submissions = await prisma.submission.findMany({
        where: {
          formId: input.formId,
          status: 'PENDING',
          ...((input.dateFrom || input.dateTo) && {
            submittedAt: {
              ...(input.dateFrom && { gte: input.dateFrom }),
              ...(input.dateTo && { lte: input.dateTo }),
            },
          }),
        },
        take: input.batchSize,
        orderBy: { submittedAt: 'desc' },
      });

      if (submissions.length === 0) {
        return {
          message: 'No submissions found for analysis',
          queuedJobs: 0,
        };
      }

      // Queue analysis jobs with staggered delays to avoid overwhelming the API
      const jobs = [];
      for (let i = 0; i < submissions.length; i++) {
        const delay = i * 2000; // 2 second delay between jobs
        const job = await QueueManager.addAnalysisJob(submissions[i].id, {
          analysisTypes: input.analysisTypes,
          priority: 2, // Lower priority for bulk jobs
          delay,
        });
        jobs.push(job.id);
      }

      return {
        message: `Bulk analysis queued for ${submissions.length} submissions`,
        queuedJobs: jobs.length,
        jobIds: jobs,
        estimatedCompletion: new Date(Date.now() + submissions.length * 2000 + 60000),
      };
    }),

  // Get analysis insights for a form
  getFormInsights: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        dateRange: z.number().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check form ownership
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

      const insights = await getLLMService().getAnalysisInsights(input.formId, input.dateRange);
      return insights;
    }),

  // Get analysis history
  getAnalysisHistory: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        analysisType: z
          .enum(['SENTIMENT', 'CLASSIFICATION', 'EXTRACTION', 'SUMMARY', 'CUSTOM'])
          .optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check form ownership
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

      const history = await getLLMService().getAnalysisHistory(input.formId, {
        limit: input.limit,
        analysisType: input.analysisType,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      return history;
    }),

  // Update form LLM settings
  updateFormLLMSettings: authedProcedure
    .input(
      z.object({
        formId: z.string(),
        settings: z.object({
          enableLLMAnalysis: z.boolean(),
          llmAnalysisTypes: z
            .array(z.enum(['SENTIMENT', 'CLASSIFICATION', 'EXTRACTION', 'SUMMARY', 'CUSTOM']))
            .optional(),
          customAnalysisPrompt: z.string().optional(),
          analysisCategories: z.array(z.string()).optional(),
          autoAnalyzeSubmissions: z.boolean().default(false),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check form ownership
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

      // Update form settings
      const updatedForm = await prisma.form.update({
        where: { id: input.formId },
        data: {
          settings: {
            ...form.settings,
            ...input.settings,
          },
        },
      });

      return {
        message: 'LLM settings updated successfully',
        settings: updatedForm.settings,
      };
    }),

  // Get queue statistics (admin only)
  getQueueStats: adminProcedure.query(async () => {
    const stats = await QueueManager.getQueueStats();
    return stats;
  }),

  // Manage queues (admin only)
  manageQueue: adminProcedure
    .input(
      z.object({
        action: z.enum(['pause', 'resume', 'cleanup']),
        queueName: z.enum(['analysis', 'email', 'export']).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { action, queueName } = input;

      switch (action) {
        case 'pause':
          if (!queueName) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Queue name is required for pause action',
            });
          }
          await QueueManager.pauseQueue(queueName);
          return { message: `Queue ${queueName} paused successfully` };

        case 'resume':
          if (!queueName) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Queue name is required for resume action',
            });
          }
          await QueueManager.resumeQueue(queueName);
          return { message: `Queue ${queueName} resumed successfully` };

        case 'cleanup':
          await QueueManager.cleanupQueues();
          return { message: 'Queue cleanup completed successfully' };

        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid action',
          });
      }
    }),

  // Get analysis cost estimates
  getCostEstimate: authedProcedure
    .input(
      z.object({
        submissionCount: z.number().min(1).max(10000),
        analysisTypes: z.array(
          z.enum(['SENTIMENT', 'CLASSIFICATION', 'EXTRACTION', 'SUMMARY', 'CUSTOM']),
        ),
      }),
    )
    .query(async ({ input }) => {
      // Simple cost estimation (adjust based on your actual costs)
      const costPerAnalysis = {
        SENTIMENT: 0.001, // $0.001 per analysis
        CLASSIFICATION: 0.0015,
        EXTRACTION: 0.002,
        SUMMARY: 0.003,
        CUSTOM: 0.0025,
      };

      const totalCost = input.analysisTypes.reduce((sum, type) => {
        return sum + costPerAnalysis[type] * input.submissionCount;
      }, 0);

      const estimatedTime = input.submissionCount * 3; // 3 seconds per analysis average

      return {
        submissionCount: input.submissionCount,
        analysisTypes: input.analysisTypes,
        estimatedCost: totalCost,
        estimatedTimeSeconds: estimatedTime,
        costBreakdown: input.analysisTypes.map((type) => ({
          type,
          costPerUnit: costPerAnalysis[type],
          totalCost: costPerAnalysis[type] * input.submissionCount,
        })),
      };
    }),
});

module.exports = llmAnalysisRouter;
