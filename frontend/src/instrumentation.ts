/**
 * Next runs `register()` once per server instance, before the first request.
 * That is the right place to refuse to serve a production build that has no
 * auth secret: the alternative — what actually happened — is that the absence
 * is discovered by every visitor instead, four 500s per page load, forever,
 * with nothing louder than a journal line nobody was reading.
 *
 * Deliberately narrow: it never fires in dev (where the throwaway fallback is
 * legitimate) and never during `next build` (a build machine has no runtime
 * env and must not be failed by one).
 */
import { assertProductionAuthSecrets } from '@/server/auth/secret';

const PHASE_PRODUCTION_BUILD = 'phase-production-build';

export async function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;
  // Throws MissingAuthSecretError, naming every env var that would satisfy it.
  assertProductionAuthSecrets();
}
