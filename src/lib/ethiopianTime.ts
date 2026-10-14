// Ethiopia uses East Africa Time (EAT = UTC+3) all year, with no daylight saving.
// Pure arithmetic (no Intl / locale) so output is identical in every browser and in tests.
// The API stores and returns UTC; call these helpers only for DISPLAY and for building
// the UTC values sent to the API.

export const EAT_OFFSET_MIN = 180;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_MIN = 60_000;
const DAY_MIN = 1440;
export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS; // 2026-01-04 is a Sunday: reference week for recurring slots.
const REFERENCE_SUNDAY = Date.UTC(2026, 0, 4);

const pad = (n: number) => String(n).padStart(2, '0');

/** Minutes since midnight -> "4:00 PM" (12-hour clock, 0 -> "12:00 AM"). */
export function formatMinutesAmPm(minutes: number): string {
  const m = ((minutes % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m % 60)} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

/** A UTC instant seen on an Ethiopian wall clock. */
export function utcToEat(input: string | Date) {
  const eat = new Date(new Date(input).getTime() + EAT_OFFSET_MIN * MS_MIN);
  return {
    day: eat.getUTCDay(), // 0 = Sunday
    minutes: eat.getUTCHours() * 60 + eat.getUTCMinutes(),
    seconds: eat.getUTCSeconds(),
    year: eat.getUTCFullYear(),
    month: eat.getUTCMonth(),
    date: eat.getUTCDate(),
  };
}

/** UTC ISO string (or Date) -> "4:00 PM" in Ethiopia time. */
export function formatEthiopianTime(input: string | Date): string {
  return formatMinutesAmPm(utcToEat(input).minutes);
}

/** UTC instant -> "Tue, Oct 13, 2026 · 1:45:07 PM" in Ethiopia time. */
export function formatEthiopianDateTime(input: string | Date, withSeconds = false): string {
  const t = utcToEat(input);
  const base = formatMinutesAmPm(t.minutes);
  const time = withSeconds ? base.replace(/(\d{2}) (AM|PM)$/, `$1:${pad(t.seconds)} $2`) : base;
  return `${WEEKDAYS[t.day]}, ${MONTHS[t.month]} ${t.date}, ${t.year} · ${time}`;
}

interface SlotLike {
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

/**
 * Where a stored slot sits on an Ethiopian weekly grid.
 * Backend convention: a recurring slot's dayOfWeek is the UTC weekday of its start time,
 * so shifting into EAT can move it to the next day (UTC 21:00+ becomes EAT 00:00+).
 */
export function slotToEat(slot: SlotLike) {
  const start = utcToEat(slot.startTime);
  const end = utcToEat(slot.endTime);
  let day = start.day;
  if (slot.isRecurring && slot.dayOfWeek != null) {
    const s = new Date(slot.startTime);
    const utcStartMin = s.getUTCHours() * 60 + s.getUTCMinutes();
    day = (slot.dayOfWeek + Math.floor((utcStartMin + EAT_OFFSET_MIN) / DAY_MIN)) % 7;
  }
  // Slots that cross EAT midnight are clamped to the end of their start day (display only).
  return {
    day,
    startMin: start.minutes,
    endMin: end.minutes <= start.minutes ? DAY_MIN : end.minutes,
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Recurring slot: Ethiopian weekday (0-6) + "HH:mm" -> UTC ISO in the reference week. */
export function eatWeekdayToUtcIso(eatDay: number, hhmm: string): string {
  const ms = REFERENCE_SUNDAY + eatDay * DAY_MS + (toMinutes(hhmm) - EAT_OFFSET_MIN) * MS_MIN;
  return new Date(ms).toISOString();
}

/** One-off slot: Ethiopian calendar date "YYYY-MM-DD" + "HH:mm" -> UTC ISO. */
export function eatDateToUtcIso(date: string, hhmm: string): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + (toMinutes(hhmm) - EAT_OFFSET_MIN) * MS_MIN;
  return new Date(ms).toISOString();
}

/** Minutes since midnight in UTC of an ISO string. */
export function utcMinutesOf(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Ethiopian calendar day of an instant, as epoch ms of that date at 00:00Z (a stable day key). */
export function eatDayKey(input: string | Date): number {
  const t = utcToEat(input);
  return Date.UTC(t.year, t.month, t.date);
}

/** Day key of the Sunday that starts the Ethiopian week containing `input`, shifted by whole weeks. */
export function eatWeekStartKey(input: string | Date, offsetWeeks = 0): number {
  const t = utcToEat(input);
  return Date.UTC(t.year, t.month, t.date - t.day + offsetWeeks * 7);
}

/** Day key -> "Oct 11". */
export function formatDayKey(key: number): string {
  const d = new Date(key);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Day key -> "2026-10-11" (for <input type="date">). */
export function dayKeyToDateInput(key: number): string {
  return new Date(key).toISOString().slice(0, 10);
}
