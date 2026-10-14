import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  WEEKDAYS,
  eatDateToUtcIso,
  eatWeekdayToUtcIso,
  formatEthiopianDateTime,
  formatMinutesAmPm,
  slotToEat,
  utcMinutesOf,
  utcToEat,
  DAY_MS,
  WEEK_MS,
  dayKeyToDateInput,
  eatDayKey,
  eatWeekStartKey,
  formatDayKey,
} from '@/lib/ethiopianTime';
import type { AvailabilitySlot } from '@/types';

type HourRange = 'pm' | 'am' | 'all';
const PM_HOURS = Array.from({ length: 12 }, (_, i) => i + 12);
const AM_HOURS = Array.from({ length: 12 }, (_, i) => i);
const HOURS_BY_RANGE: Record<HourRange, number[]> = {
  pm: PM_HOURS,
  am: AM_HOURS,
  all: [...PM_HOURS, ...AM_HOURS],
};
const RANGE_OPTIONS: { value: HourRange; label: string; title: string }[] = [
  { value: 'pm', label: 'PM', title: '12:00 PM – 11:00 PM' },
  { value: 'am', label: 'AM', title: '12:00 AM – 11:00 AM' },
  { value: 'all', label: 'All', title: 'All 24 hours, PM first' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// 12-hour options (value stays 24h "HH:mm" for the conversion logic; label shows AM/PM).
const TIME_OPTIONS = [...Array.from({ length: 96 }, (_, i) => i * 15), 1439].map((m) => ({
  value: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
  label: formatMinutesAmPm(m),
}));

export interface NewSlot {
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  onAddSlot: (slot: NewSlot) => void;
  onRemoveSlot: (slotId: string) => void;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function AddSlotForm({
  day,
  hour,
  defaultDate,
  onSubmit,
}: {
  day: number;
  hour: number;
  defaultDate: string;
  onSubmit: (slot: NewSlot) => void;
}) {
  const [dayValue, setDayValue] = useState(String(day));
  const [start, setStart] = useState(`${pad(hour)}:00`);
  const [end, setEnd] = useState(hour === 23 ? '23:59' : `${pad(hour + 1)}:00`);
  const [recurring, setRecurring] = useState(true);
  const [date, setDate] = useState(defaultDate);

  const startMin = start ? toMinutes(start) : NaN;
  const endMin = end ? toMinutes(end) : NaN;
  const endBeforeStart = Boolean(start && end) && endMin <= startMin;

  // The backend compares recurring slots by UTC time of day, so a recurring slot must not
  // cross midnight UTC (= 3:00 AM in Ethiopia). One-off slots compare full datetimes: fine.
  const startIso = start ? eatWeekdayToUtcIso(Number(dayValue), start) : '';
  const endIso = end ? eatWeekdayToUtcIso(Number(dayValue), end) : '';
  const crossesUtcMidnight =
    recurring &&
    !endBeforeStart &&
    Boolean(start && end) &&
    utcMinutesOf(endIso) <= utcMinutesOf(startIso);

  const invalid = !start || !end || endBeforeStart || crossesUtcMidnight || (!recurring && !date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    if (recurring) {
      onSubmit({
        dayOfWeek: new Date(startIso).getUTCDay(),
        startTime: startIso,
        endTime: endIso,
        isRecurring: true,
      });
    } else {
      onSubmit({
        startTime: eatDateToUtcIso(date, start),
        endTime: eatDateToUtcIso(date, end),
        isRecurring: false,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-m border border-border p-4">
      <p className="text-m font-semibold">
        New slot{' '}
        <span className="text-s font-normal text-muted-foreground">(Ethiopia time, EAT UTC+3)</span>
      </p>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="slot-day">Day</Label>
          <select
            id="slot-day"
            className="h-10 w-full rounded-m border border-border bg-white px-3"
            value={dayValue}
            onChange={(e) => setDayValue(e.target.value)}
          >
            {WEEKDAYS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label htmlFor="slot-start">Start time</Label>
            <span className="text-s text-muted-foreground">(EAT)</span>
          </div>
          <select
            id="slot-start"
            className="h-10 w-full rounded-m border border-border bg-white px-3"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label htmlFor="slot-end">End time</Label>
            <span className="text-s text-muted-foreground">(EAT)</span>
          </div>
          <select
            id="slot-end"
            className="h-10 w-full rounded-m border border-border bg-white px-3"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>{' '}
        </div>
        <label className="flex h-10 items-center gap-2 text-m">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Recurring weekly
        </label>
        {!recurring && (
          <div className="space-y-1">
            <Label htmlFor="slot-date">Date</Label>
            <Input
              id="slot-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}
      </div>
      {start && end && !endBeforeStart && (
        <p className="text-s text-muted-foreground">
          {formatMinutesAmPm(startMin)} – {formatMinutesAmPm(endMin)} Ethiopia time
        </p>
      )}
      {endBeforeStart && (
        <p role="alert" className="text-s text-destructive">
          End time must be after the start time.
        </p>
      )}
      {crossesUtcMidnight && (
        <p role="alert" className="text-s text-destructive">
          A weekly slot cannot cross 3:00 AM. Split it into two slots.
        </p>
      )}
      <Button type="submit" disabled={invalid}>
        Add slot
      </Button>
    </form>
  );
}

export default function AvailabilityCalendar({
  slots,
  onAddSlot,
  onRemoveSlot,
}: AvailabilityCalendarProps) {
  const now = useNow();
  const today = utcToEat(now);
  const [selection, setSelection] = useState<{ day: number; hour: number } | null>(null);
  const [removing, setRemoving] = useState<AvailabilitySlot | null>(null);
  const [range, setRange] = useState<HourRange>('pm');
  const [weekOffset, setWeekOffset] = useState(0);

  // Before any click, the form defaults to today (Ethiopia time) and the next full hour.
  // Captured once, so the live clock never resets a form the tutor is typing in.
  const [defaults] = useState(() => {
    const t = utcToEat(new Date());
    return { day: t.day, hour: Math.min(23, Math.floor(t.minutes / 60) + 1) };
  });
  const formDay = selection?.day ?? defaults.day;
  const formHour = selection?.hour ?? defaults.hour;
  const currentHour = Math.floor(today.minutes / 60);

  const weekStart = eatWeekStartKey(now, weekOffset);
  const todayKey = eatDayKey(now);
  const dayKey = (day: number) => weekStart + day * DAY_MS;
  const isToday = (day: number) => dayKey(day) === todayKey;
  const weekEndKey = weekStart + 6 * DAY_MS;
  const weekLabel = `${formatDayKey(weekStart)} – ${formatDayKey(weekEndKey)}, ${new Date(weekEndKey).getUTCFullYear()}`;
  const weekTag = weekOffset === 0 ? ' (this week)' : weekOffset === 1 ? ' (next week)' : '';

  // Weekly slots repeat every week; a one-off slot belongs to exactly one date.
  const weekSlots = slots.filter((s) => {
    if (s.isRecurring) return true;
    const key = eatDayKey(s.startTime);
    return key >= weekStart && key < weekStart + WEEK_MS;
  });

  const jumpTo = (value: string) => {
    if (!value) return;
    const target = eatWeekStartKey(new Date(`${value}T12:00:00Z`));
    setWeekOffset(Math.round((target - eatWeekStartKey(now)) / WEEK_MS));
  };

  // Cell-level occupancy only (visual). Slot-vs-slot overlap rules belong to the backend.
  const slotAt = (day: number, hour: number) =>
    weekSlots.find((s) => {
      const p = slotToEat(s);
      return p.day === day && p.startMin < (hour + 1) * 60 && p.endMin > hour * 60;
    });

  const handleCell = (day: number, hour: number) => {
    const slot = slotAt(day, hour);
    if (slot) {
      setRemoving(slot);
    } else {
      setRemoving(null);
      setSelection({ day, hour });
    }
  };

  const removingPos = removing ? slotToEat(removing) : null;
  const hiddenCount =
    range === 'all'
      ? 0
      : weekSlots.filter((s) => {
          const h = Math.floor(slotToEat(s).startMin / 60);
          return range === 'pm' ? h < 12 : h >= 12;
        }).length;

  return (
    <div className="space-y-space-md">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-label="Previous week"
          onClick={() => setWeekOffset((o) => o - 1)}
        >
          ←
        </Button>
        <p className="min-w-[13rem] text-center text-m font-semibold" aria-label="Week shown">
          {weekLabel}
          {weekTag}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-label="Next week"
          onClick={() => setWeekOffset((o) => o + 1)}
        >
          →
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={weekOffset === 0}
          onClick={() => setWeekOffset(0)}
        >
          This week
        </Button>
        <Label htmlFor="week-jump" className="sr-only">
          Jump to date
        </Label>
        <Input
          id="week-jump"
          type="date"
          className="h-9 w-auto"
          value={dayKeyToDateInput(weekStart)}
          onChange={(e) => jumpTo(e.target.value)}
        />
      </div>
      <p className="text-s text-muted-foreground">
        Weekly slots show in every week. One-off slots (dark outline) show only on their date.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-m bg-muted p-3">
        <p className="text-m font-semibold" aria-label="Current Ethiopia time">
          {formatEthiopianDateTime(now, true)}
        </p>
        <p className="text-s text-muted-foreground">
          All times are Ethiopia time (EAT, UTC+3). Click an empty cell to fill the form.
        </p>
      </div>

      {removing && removingPos && (
        <div className="flex flex-wrap items-center gap-3 rounded-m border border-border p-4">
          <p className="text-m">
            Remove {WEEKDAYS[removingPos.day]} {formatMinutesAmPm(removingPos.startMin)} –{' '}
            {formatMinutesAmPm(removingPos.endMin)}
            {removing.isRecurring
              ? ' (repeats every week)'
              : ` on ${formatDayKey(eatDayKey(removing.startTime))}`}
            ?
          </p>
          <Button
            type="button"
            onClick={() => {
              onRemoveSlot(removing.id);
              setRemoving(null);
            }}
          >
            Remove
          </Button>
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
        </div>
      )}

      <AddSlotForm
        key={`${formDay}-${formHour}-${weekStart}`}
        day={formDay}
        hour={formHour}
        defaultDate={dayKeyToDateInput(dayKey(formDay))}
        onSubmit={onAddSlot}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-s text-muted-foreground">Show:</span>
        {RANGE_OPTIONS.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={range === o.value ? 'default' : 'secondary'}
            aria-pressed={range === o.value}
            title={o.title}
            onClick={() => setRange(o.value)}
          >
            {o.label}
          </Button>
        ))}
        {hiddenCount > 0 && (
          <span className="text-s text-muted-foreground">
            {hiddenCount} slot{hiddenCount === 1 ? '' : 's'} in the other half of the day
          </span>
        )}
      </div>

      <div className="max-h-[420px] overflow-auto">
        <div className="grid min-w-[520px] grid-cols-[4rem_repeat(7,minmax(0,1fr))] text-xs">
          <div />
          {WEEKDAYS.map((d, day) => (
            <div
              key={d}
              className={`p-1 text-center font-semibold ${isToday(day) ? 'text-primary underline' : ''}`}
            >
              {d} {new Date(dayKey(day)).getUTCDate()}
              {isToday(day) ? ' (today)' : ''}
            </div>
          ))}
          {HOURS_BY_RANGE[range].map((hour) => (
            <div key={hour} className="contents">
              <div
                className={`p-1 ${hour === currentHour ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              >
                {formatMinutesAmPm(hour * 60)}
              </div>
              {WEEKDAYS.map((d, day) => {
                const slot = slotAt(day, hour);
                const isNow = isToday(day) && hour === currentHour;

                return (
                  <button
                    key={d}
                    type="button"
                    aria-label={`${d} ${formatMinutesAmPm(hour * 60)}`}
                    onClick={() => handleCell(day, hour)}
                    className={`h-6 border border-border 
                      ${slot ? (slot.isRecurring ? 'bg-accent' : 'bg-accent border-2 border-primary') : 'bg-white hover:bg-muted'} ${isNow ? 'ring-2 ring-inset ring-primary' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
