vi.stubEnv('TZ', 'America/New_York');
// The zone is applied via process.env.TZ at the top of the file before any Date is evaluated,
// ensuring that the test environment's local timezone is America/New_York.

import { describe, it, expect, vi } from 'vitest';
import { classifyReschedule } from '@/lib/classifyReschedule';

describe('classifyReschedule', () => {
  it('exactly 12h -> FREE', () => {
    expect(
      classifyReschedule('2024-01-01T12:00:00.000Z', new Date('2024-01-01T00:00:00.000Z'))
    ).toBe('FREE_RESCHEDULE');
  });

  it('13h -> FREE', () => {
    expect(
      classifyReschedule('2024-01-01T13:00:00.000Z', new Date('2024-01-01T00:00:00.000Z'))
    ).toBe('FREE_RESCHEDULE');
  });

  it('just under 12h (e.g. 11h59m) -> SAME_DAY_MISS', () => {
    expect(
      classifyReschedule('2024-01-01T11:59:00.000Z', new Date('2024-01-01T00:00:00.000Z'))
    ).toBe('SAME_DAY_MISS');
  });

  it('negative -> SAME_DAY_MISS', () => {
    expect(
      classifyReschedule('2024-01-01T12:00:00.000Z', new Date('2024-01-01T13:00:00.000Z'))
    ).toBe('SAME_DAY_MISS');
  });

  it('the DST case MUST actually run under a DST-observing zone and use UTC instants exactly 12h apart straddling a DST change', () => {
    // In America/New_York, DST ends on Nov 3, 2024 at 2:00 AM (clocks go back to 1:00 AM).
    // Let's use instances straddling this.
    // Nov 3 04:00Z is 00:00 EDT
    // Nov 3 16:00Z is 11:00 EST (exactly 12 hours later)
    expect(
      classifyReschedule('2024-11-03T16:00:00.000Z', new Date('2024-11-03T04:00:00.000Z'))
    ).toBe('FREE_RESCHEDULE');
  });
});
