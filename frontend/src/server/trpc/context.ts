import { prisma } from '@/lib/db';

export type AppContext = {
  db: typeof prisma;
  user: { id: string; email?: string | null; name?: string | null } | null;
};

export async function createContext(): Promise<AppContext> {
  // Auth integration will be added; return anonymous context for now.
  return { db: prisma, user: null };
}
