const { router } = require('../lib/trpc');
const userRouter = require('./routers/user');
const formsRouter = require('./routers/forms');
const submissionsRouter = require('./routers/submissions');
const llmAnalysisRouter = require('./routers/llm-analysis');

// Main tRPC app router
const appRouter = router({
  users: userRouter,
  forms: formsRouter,
  submissions: submissionsRouter,
  llmAnalysis: llmAnalysisRouter,
});

// Export the app router type for client-side usage
module.exports = appRouter;
