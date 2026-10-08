import { describe, expect, it, vi } from 'vitest';

const queryRaw = vi.fn();
vi.mock('@/lib/db', () => ({ prisma: { $queryRaw: (...a: unknown[]) => queryRaw(...a) } }));

import { GET } from './route';

describe('GET /api/health', () => {
  it('is 200 when the database answers', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, db: true });
  });

  it('is 503 — and says nothing about why — when it does not', async () => {
    queryRaw.mockImplementation(async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:5432');
    });
    const res = await GET();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toMatch(/ECONNREFUSED|5432/);
  });
});
