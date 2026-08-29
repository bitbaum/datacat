import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

export const healthRouter = router({
  ping: publicProcedure.input(z.void().optional()).query(() => ({ ok: true })),
});
