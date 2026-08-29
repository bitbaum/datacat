import { router } from '../trpc';
import { healthRouter } from './meta';

export const appRouter = router({
  meta: healthRouter,
});

export type AppRouter = typeof appRouter;
