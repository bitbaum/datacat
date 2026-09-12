/**
 * Query-string contract for the submissions list, kept out of the route handler
 * so it can be tested without a database. The submissions page
 * (app/submissions/[formId]/page.tsx) is the only caller today; it sends
 * `search`, `startDate` and `endDate`.
 */

/** Rows returned when the caller does not ask for a page size. */
export const DEFAULT_LIMIT = 100;
/** Hard ceiling, so one request cannot ask for the whole table. */
export const MAX_LIMIT = 500;

export type SubmissionFilters = {
  /** Escaped SQL LIKE pattern (`%foo%`), or null when no search was asked for. */
  searchPattern: string | null;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
  skip: number;
};

export type ParsedFilters =
  { success: true; filters: SubmissionFilters } | { success: false; error: string };

/**
 * `%` and `_` are wildcards to SQL LIKE, so a user searching for "50%" would
 * otherwise match everything starting with "50". Escape them, and the escape
 * character itself, with the backslash LIKE uses by default.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, '\\$1');
}

/**
 * A ceiling on `page` so `skip` stays an exact integer.
 *
 * It was `Number.MAX_SAFE_INTEGER`, which is a bound on the page NUMBER and not
 * on the arithmetic done with it: `skip = (page - 1) * limit`, so
 * `?page=9007199254740991&limit=500` overflows the safe range and the offset
 * that reaches Postgres is a rounded approximation of what was asked for.
 *
 * The query returns nothing either way — there is no page nine quadrillion —
 * so this is a correctness smell rather than a way in. It is still worth a
 * bound: a number that cannot be computed with is not a page number, and
 * refusing it at the boundary is this module's whole job.
 *
 * One million pages at MAX_LIMIT is 500 million rows, comfortably past any
 * real form, and leaves `skip` exact.
 */
const MAX_PAGE = 1_000_000;

function parseDate(raw: string | null): Date | null | 'invalid' {
  if (raw === null || raw === '') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? 'invalid' : date;
}

function parseCount(raw: string | null, fallback: number, min: number, max: number) {
  if (raw === null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min) return 'invalid' as const;
  return Math.min(parsed, max);
}

/** Validate at the boundary: a malformed filter is a 400, never a silent default. */
export function parseSubmissionFilters(params: URLSearchParams): ParsedFilters {
  const startDate = parseDate(params.get('startDate'));
  if (startDate === 'invalid') return { success: false, error: 'Invalid startDate' };

  const endDate = parseDate(params.get('endDate'));
  if (endDate === 'invalid') return { success: false, error: 'Invalid endDate' };

  if (startDate && endDate && startDate > endDate) {
    return { success: false, error: 'startDate must be before endDate' };
  }

  const page = parseCount(params.get('page'), 1, 1, MAX_PAGE);
  if (page === 'invalid') return { success: false, error: 'Invalid page' };

  const limit = parseCount(params.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  if (limit === 'invalid') return { success: false, error: 'Invalid limit' };

  const search = params.get('search')?.trim() ?? '';

  return {
    success: true,
    filters: {
      searchPattern: search === '' ? null : `%${escapeLikePattern(search)}%`,
      startDate,
      endDate,
      page,
      limit,
      skip: (page - 1) * limit,
    },
  };
}
