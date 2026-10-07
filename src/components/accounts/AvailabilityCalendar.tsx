import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AvailabilitySlot } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_MS = 86_400_000;
// 2026-01-04 is a Sunday: reference week for recurring slots (times are UTC).
const REFERENCE_SUNDAY = Date.UTC(2026, 0, 4);

const pad = (n: number) => String(n).padStart(2, '0');

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

type Panel =
  { kind: 'add'; day: number; hour: number } | { kind: 'remove'; slot: AvailabilitySlot };

const minutesOf = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const dayOf = (slot: AvailabilitySlot) => slot.dayOfWeek ?? new Date(slot.startTime).getUTCDay();
const range = (slot: AvailabilitySlot): [number, number] => {
  const start = minutesOf(slot.startTime);
  const end = minutesOf(slot.endTime);
  return [start, end <= start ? 1440 : end];
};
const timeLabel = (iso: string) => {
  const m = minutesOf(iso);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

function toIso(baseUtcMidnight: number, time: string) {
  const [h, m] = time.split(':').map(Number);
  return new Date(baseUtcMidnight + h * 3_600_000 + m * 60_000).toISOString();
}

function AddSlotForm({
  day,
  hour,
  onSubmit,
  onCancel,
}: {
  day: number;
  hour: number;
  onSubmit: (slot: NewSlot) => void;
  onCancel: () => void;
}) {
  const [dayValue, setDayValue] = useState(String(day));
  const [start, setStart] = useState(`${pad(hour)}:00`);
  const [end, setEnd] = useState(hour === 23 ? '23:59' : `${pad(hour + 1)}:00`);
  const [recurring, setRecurring] = useState(true);
  const [date, setDate] = useState('');

  const invalid = !start || !end || end <= start || (!recurring && !date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    if (recurring) {
      const base = REFERENCE_SUNDAY + Number(dayValue) * DAY_MS;
      onSubmit({
        dayOfWeek: Number(dayValue),
        startTime: toIso(base, start),
        endTime: toIso(base, end),
        isRecurring: true,
      });
    } else {
      const base = Date.parse(`${date}T00:00:00Z`);
      onSubmit({ startTime: toIso(base, start), endTime: toIso(base, end), isRecurring: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-m border border-border p-4">
      <p className="text-m font-semibold">New slot</p>
      <div className="space-y-1">
        <Label htmlFor="slot-day">Day</Label>
        <select
          id="slot-day"
          className="w-full rounded-m border border-border p-2"
          value={dayValue}
          onChange={(e) => setDayValue(e.target.value)}
        >
          {DAYS.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot-start">Start time</Label>
        <Input
          id="slot-start"
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot-end">End time</Label>
        <Input id="slot-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-m">
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
      <div className="flex gap-2">
        <Button type="submit" disabled={invalid}>
          Add slot
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AvailabilityCalendar({
  slots,
  onAddSlot,
  onRemoveSlot,
}: AvailabilityCalendarProps) {
  const [panel, setPanel] = useState<Panel | null>(null);

  // Cell-level occupancy only (visual). Slot-vs-slot overlap rules belong to the backend.
  const slotAt = (day: number, hour: number) =>
    slots.find((s) => {
      const [start, end] = range(s);
      return dayOf(s) === day && start < (hour + 1) * 60 && end > hour * 60;
    });

  const handleCell = (day: number, hour: number) => {
    const slot = slotAt(day, hour);
    setPanel(slot ? { kind: 'remove', slot } : { kind: 'add', day, hour });
  };

  return (
    <div className="space-y-space-md">
      <p className="text-s text-muted-foreground">Times are in UTC.</p>
      <div className="max-h-[480px] overflow-auto">
        <div className="grid min-w-[560px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] text-s">
          <div />
          {DAYS.map((d) => (
            <div key={d} className="p-1 text-center font-semibold">
              {d}
            </div>
          ))}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-1 text-muted-foreground">{pad(hour)}:00</div>
              {DAYS.map((d, day) => {
                const occupied = Boolean(slotAt(day, hour));
                return (
                  <button
                    key={d}
                    type="button"
                    aria-label={`${d} ${pad(hour)}:00`}
                    onClick={() => handleCell(day, hour)}
                    className={`h-8 border border-border ${occupied ? 'bg-accent' : 'bg-white hover:bg-muted'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {panel?.kind === 'add' && (
        <AddSlotForm
          key={`${panel.day}-${panel.hour}`}
          day={panel.day}
          hour={panel.hour}
          onSubmit={(slot) => {
            onAddSlot(slot);
            setPanel(null);
          }}
          onCancel={() => setPanel(null)}
        />
      )}

      {panel?.kind === 'remove' && (
        <div className="space-y-3 rounded-m border border-border p-4">
          <p className="text-m">
            Remove {DAYS[dayOf(panel.slot)]} {timeLabel(panel.slot.startTime)}–
            {timeLabel(panel.slot.endTime)}?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                onRemoveSlot(panel.slot.id);
                setPanel(null);
              }}
            >
              Remove
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
