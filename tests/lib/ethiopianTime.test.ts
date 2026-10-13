import { describe, expect, it } from 'vitest';

import {
  eatDateToUtcIso,
  eatWeekdayToUtcIso,
  formatEthiopianDateTime,
  formatEthiopianTime,
  formatMinutesAmPm,
  slotToEat,
  utcToEat,
} from '@/lib/ethiopianTime';

describe('formatMinutesAmPm', () => {
  it('formats midnight, noon and evening on a 12-hour clock', () => {
    expect(formatMinutesAmPm(0)).toBe('12:00 AM');
    expect(formatMinutesAmPm(30)).toBe('12:30 AM');
    expect(formatMinutesAmPm(720)).toBe('12:00 PM');
    expect(formatMinutesAmPm(960)).toBe('4:00 PM');
    expect(formatMinutesAmPm(1439)).toBe('11:59 PM');
  });
});

describe('UTC to Ethiopia time (UTC+3)', () => {
  it('adds three hours', () => {
    expect(formatEthiopianTime('2026-01-05T13:00:00.000Z')).toBe('4:00 PM');
    expect(formatEthiopianTime('2026-01-05T06:00:00.000Z')).toBe('9:00 AM');
  });

  it('rolls over midnight into the next weekday and date', () => {
    expect(formatEthiopianTime('2026-01-05T21:30:00.000Z')).toBe('12:30 AM');
    expect(utcToEat('2026-01-04T22:00:00.000Z').day).toBe(1); // Sunday 22:00 UTC = Monday EAT
    expect(formatEthiopianDateTime('2026-12-31T21:30:00.000Z')).toBe('Fri, Jan 1, 2027 · 12:30 AM');
  });

  it('formats the full date and time with seconds for the live clock', () => {
    expect(formatEthiopianDateTime('2026-10-13T10:00:07.000Z', true)).toBe(
      'Tue, Oct 13, 2026 · 1:00:07 PM'
    );
  });
});

describe('Ethiopia time to UTC', () => {
  it('converts a recurring weekday + time into the reference week in UTC', () => {
    expect(eatWeekdayToUtcIso(1, '16:00')).toBe('2026-01-05T13:00:00.000Z');
  });

  it('moves early-morning Ethiopian slots to the previous UTC day', () => {
    expect(eatWeekdayToUtcIso(1, '01:00')).toBe('2026-01-04T22:00:00.000Z');
  });

  it('converts a one-off Ethiopian date + time to UTC', () => {
    expect(eatDateToUtcIso('2026-02-10', '09:00')).toBe('2026-02-10T06:00:00.000Z');
  });
});

describe('slotToEat', () => {
  it('places a recurring UTC slot on the Ethiopian grid', () => {
    expect(
      slotToEat({
        dayOfWeek: 1,
        startTime: '2026-01-05T16:00:00.000Z',
        endTime: '2026-01-05T17:00:00.000Z',
        isRecurring: true,
      })
    ).toEqual({ day: 1, startMin: 19 * 60, endMin: 20 * 60 });
  });

  it('moves a recurring slot to the next weekday when UTC time is 21:00 or later', () => {
    expect(
      slotToEat({
        dayOfWeek: 0,
        startTime: '2026-01-04T22:00:00.000Z',
        endTime: '2026-01-04T23:00:00.000Z',
        isRecurring: true,
      })
    ).toEqual({ day: 1, startMin: 60, endMin: 120 });
  });

  it('uses the real date for a one-off slot', () => {
    expect(
      slotToEat({
        dayOfWeek: null,
        startTime: '2026-02-10T06:00:00.000Z',
        endTime: '2026-02-10T07:00:00.000Z',
        isRecurring: false,
      })
    ).toEqual({ day: 2, startMin: 9 * 60, endMin: 10 * 60 });
  });
});
