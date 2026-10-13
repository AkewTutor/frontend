import { describe, expect, it } from 'vitest';

import { isDecimalBetween } from '@/lib/money';

describe('isDecimalBetween', () => {
  it('is inclusive at both boundaries', () => {
    expect(isDecimalBetween('1', '1', '100')).toBe(true);
    expect(isDecimalBetween('100', '1', '100')).toBe(true);
  });

  it('rejects values just outside the range', () => {
    expect(isDecimalBetween('0', '1', '100')).toBe(false);
    expect(isDecimalBetween('100.01', '1', '100')).toBe(false);
  });

  it('is exact for decimals', () => {
    expect(isDecimalBetween('0.30', '0.1', '0.3')).toBe(true);
  });

  it('returns false for invalid input', () => {
    expect(isDecimalBetween('abc', '1', '100')).toBe(false);
    expect(isDecimalBetween('', '1', '100')).toBe(false);
  });
});
