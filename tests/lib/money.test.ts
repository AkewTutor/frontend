import { describe, expect, it } from 'vitest';

import { formatMoney, sumEquals } from '@/lib/money';

describe('formatMoney', () => {
  it('adds thousands separators, two decimals and the currency suffix', () => {
    expect(formatMoney('1234.5')).toBe('1,234.50 ETB');
  });

  it('rounds past 2 decimals instead of truncating', () => {
    expect(formatMoney('99.999')).toBe('100.00 ETB');
  });

  it('rounds half up at the .XX5 boundary', () => {
    expect(formatMoney('33.125')).toBe('33.13 ETB');
  });

  it('accepts a custom currency', () => {
    expect(formatMoney('10', 'USD')).toBe('10.00 USD');
  });

  it('handles large values without float precision loss', () => {
    expect(formatMoney('12345678901234567.89')).toBe('12,345,678,901,234,567.89 ETB');
  });

  it('formats negatives and never shows -0.00', () => {
    expect(formatMoney('-1234.5')).toBe('-1,234.50 ETB');
    expect(formatMoney('-0.001')).toBe('0.00 ETB');
  });

  it('returns a dash for invalid input instead of throwing', () => {
    expect(formatMoney('abc')).toBe('—');
    expect(formatMoney('')).toBe('—');
  });
});

describe('sumEquals', () => {
  it('is exact where native floats are not', () => {
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(sumEquals(['0.1', '0.2'], '0.3')).toBe(true);
  });

  it('returns false when the parts do not add up', () => {
    expect(sumEquals(['100', '49.99'], '150')).toBe(false);
  });

  it('returns false on invalid input', () => {
    expect(sumEquals(['x', '1'], '2')).toBe(false);
  });
});
