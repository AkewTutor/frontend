import { describe, expect, it } from 'vitest';

import { totalPages } from '@/lib/totalPages';

describe('totalPages', () => {
  it('rounds up total / limit', () => {
    expect(totalPages({ total: 41, limit: 20 })).toBe(3);
    expect(totalPages({ total: 40, limit: 20 })).toBe(2);
  });

  it('is 1 for empty or missing data', () => {
    expect(totalPages({ total: 0, limit: 20 })).toBe(1);
    expect(totalPages(undefined)).toBe(1);
  });
});
