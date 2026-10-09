import Decimal from 'decimal.js';

// Display only: never feed the returned string into a request body or further arithmetic.
export function formatMoney(value: string, currency = 'ETB'): string {
  let parsed: Decimal;
  try {
    parsed = new Decimal(value);
  } catch {
    return '—';
  }
  if (!parsed.isFinite()) return '—';

  const rounded = parsed.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const fixed = (rounded.isZero() ? rounded.abs() : rounded).toFixed(2);
  const negative = fixed.startsWith('-');
  const [intPart, fraction] = (negative ? fixed.slice(1) : fixed).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${negative ? '-' : ''}${grouped}.${fraction} ${currency}`;
}

// Decimal-safe check that parts add up to total (e.g. platform + tutor share = total per hour).
export function sumEquals(parts: string[], total: string): boolean {
  try {
    return parts.reduce((acc, part) => acc.plus(part), new Decimal(0)).equals(new Decimal(total));
  } catch {
    return false;
  }
}
