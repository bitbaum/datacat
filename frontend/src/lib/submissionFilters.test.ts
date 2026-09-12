import { describe, it, expect } from 'vitest';
import {
  parseSubmissionFilters,
  escapeLikePattern,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './submissionFilters';

const parse = (qs: string) => parseSubmissionFilters(new URLSearchParams(qs));

describe('parseSubmissionFilters', () => {
  it('defaults to page 1 and no filters when nothing is asked for', () => {
    const result = parse('');
    expect(result).toMatchObject({
      success: true,
      filters: {
        searchPattern: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: DEFAULT_LIMIT,
        skip: 0,
      },
    });
  });

  it('wraps a search term in a LIKE pattern', () => {
    const result = parse('search=alice');
    expect(result.success && result.filters.searchPattern).toBe('%alice%');
  });

  it('treats a blank or whitespace-only search as no search', () => {
    const blank = parse('search=');
    expect(blank.success && blank.filters.searchPattern).toBeNull();
    const whitespace = parse('search=%20%20');
    expect(whitespace.success && whitespace.filters.searchPattern).toBeNull();
  });

  it('parses ISO dates as sent by the page', () => {
    const result = parse('startDate=2026-01-01T00:00:00.000Z&endDate=2026-02-01T00:00:00.000Z');
    expect(result.success && result.filters.startDate?.toISOString()).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(result.success && result.filters.endDate?.toISOString()).toBe(
      '2026-02-01T00:00:00.000Z',
    );
  });

  it('rejects an unparseable date instead of silently ignoring it', () => {
    expect(parse('startDate=not-a-date')).toEqual({ success: false, error: 'Invalid startDate' });
    expect(parse('endDate=13/45/2026')).toEqual({ success: false, error: 'Invalid endDate' });
  });

  it('rejects an inverted range', () => {
    const result = parse('startDate=2026-02-01T00:00:00.000Z&endDate=2026-01-01T00:00:00.000Z');
    expect(result).toEqual({ success: false, error: 'startDate must be before endDate' });
  });

  it('clamps an absurd page so skip stays an exact integer', () => {
    // The ceiling used to be Number.MAX_SAFE_INTEGER, which bounds the page
    // NUMBER and not the arithmetic done with it: skip = (page - 1) * limit
    // then leaves the safe range, and the offset reaching Postgres is a rounded
    // approximation of what was asked for.
    //
    // Clamping rather than rejecting follows this module's existing convention,
    // the same one `limit` uses: too large is capped, while below the minimum
    // or non-integer is a 400. Either way the query returns nothing — there is
    // no page nine quadrillion — but skip is now always computable.
    const result = parse('page=9007199254740991&limit=500');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.filters.page).toBe(1_000_000);
    expect(Number.isSafeInteger(result.filters.skip)).toBe(true);
    expect(result.filters.skip).toBe(499_999_500);
  });

  it('leaves a page below the ceiling alone', () => {
    const result = parse('page=999999&limit=500');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.filters.page).toBe(999_999);
  });

  it('computes skip from page and limit', () => {
    const result = parse('page=3&limit=20');
    expect(result.success && result.filters.skip).toBe(40);
  });

  it('clamps limit to the ceiling rather than trusting the caller', () => {
    const result = parse(`limit=${MAX_LIMIT * 10}`);
    expect(result.success && result.filters.limit).toBe(MAX_LIMIT);
  });

  it('rejects non-integer and out-of-range paging', () => {
    expect(parse('page=0').success).toBe(false);
    expect(parse('page=abc').success).toBe(false);
    expect(parse('limit=-1').success).toBe(false);
    expect(parse('limit=1.5').success).toBe(false);
  });
});

describe('escapeLikePattern', () => {
  it('escapes SQL LIKE wildcards so a literal search stays literal', () => {
    // Searching "50%" must not become "starts with 50".
    expect(escapeLikePattern('50%')).toBe('50\\%');
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
    expect(escapeLikePattern('back\\slash')).toBe('back\\\\slash');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLikePattern('alice@example.com')).toBe('alice@example.com');
  });
});
