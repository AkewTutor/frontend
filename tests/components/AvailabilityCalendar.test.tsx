import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AvailabilityCalendar from '@/components/accounts/AvailabilityCalendar';
import type { AvailabilitySlot } from '@/types';

// Saved by the old UTC grid: Monday 16:00-17:00 UTC = Monday 7:00-8:00 PM in Ethiopia.
const monday16Utc: AvailabilitySlot = {
  id: 's1',
  dayOfWeek: 1,
  startTime: '2026-01-05T16:00:00.000Z',
  endTime: '2026-01-05T17:00:00.000Z',
  isRecurring: true,
};

// One-off: Monday 19 Oct 2026, 4:00-5:00 PM in Ethiopia (13:00-14:00 UTC).
const oneOffOct19: AvailabilitySlot = {
  id: 's9',
  dayOfWeek: 1,
  startTime: '2026-10-19T13:00:00.000Z',
  endTime: '2026-10-19T14:00:00.000Z',
  isRecurring: false,
};

function setup(slots: AvailabilitySlot[] = []) {
  const onAddSlot = vi.fn();
  const onRemoveSlot = vi.fn();
  render(<AvailabilityCalendar slots={slots} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} />);
  return { onAddSlot, onRemoveSlot };
}

const cell = (label: string) => screen.getByRole('button', { name: label });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  // 13:00 in Ethiopia on Tuesday 13 Oct 2026
  vi.setSystemTime(new Date('2026-10-13T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AvailabilityCalendar', () => {
  it('shows the form at the top without clicking any cell', () => {
    setup();
    expect(screen.getByText('New slot')).toBeInTheDocument();
    expect(screen.getByLabelText('Day')).toHaveValue('2'); // today = Tuesday
    expect(screen.getByLabelText('Start time')).toHaveValue('14:00'); // next full hour
  });

  it('shows the current Ethiopia date and time', () => {
    setup();
    expect(screen.getByLabelText('Current Ethiopia time')).toHaveTextContent(
      'Tue, Oct 13, 2026 · 1:00:00 PM'
    );
  });

  it('does not reset the form when the clock moves to the next hour', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '08:30' } });
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    });
    expect(screen.getByLabelText('Start time')).toHaveValue('08:30');
    expect(screen.getByLabelText('Current Ethiopia time')).toHaveTextContent('3:00:00 PM');
  });

  it('shows PM hours by default and AM hours behind the AM toggle', () => {
    setup();
    expect(cell('Mon 4:00 PM')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sun 12:00 AM' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'AM' }));
    expect(cell('Sun 12:00 AM')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mon 4:00 PM' })).not.toBeInTheDocument();
  });

  it('lists PM rows above AM rows in the All view', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    const labels = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(labels.indexOf('Mon 12:00 PM')).toBeLessThan(labels.indexOf('Mon 12:00 AM'));
  });

  it('fills the form when an empty cell is clicked, and keeps it visible', () => {
    setup();
    fireEvent.click(cell('Mon 4:00 PM'));
    expect(screen.getByText('New slot')).toBeInTheDocument();
    expect(screen.getByLabelText('Day')).toHaveValue('1');
    expect(screen.getByLabelText('Start time')).toHaveValue('16:00');
    expect(screen.getByLabelText('End time')).toHaveValue('17:00');
  });

  it('shows Remove above the form for an occupied cell, form stays visible', () => {
    setup([monday16Utc]);
    fireEvent.click(cell('Mon 7:00 PM'));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.getByText(/Remove Mon 7:00 PM/)).toBeInTheDocument();
    expect(screen.getByText('New slot')).toBeInTheDocument();
  });

  it('sends a recurring slot converted from Ethiopia time to UTC', () => {
    const { onAddSlot } = setup();
    fireEvent.click(cell('Mon 4:00 PM'));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));
    expect(onAddSlot).toHaveBeenCalledWith({
      dayOfWeek: 1,
      startTime: '2026-01-05T13:00:00.000Z',
      endTime: '2026-01-05T14:00:00.000Z',
      isRecurring: true,
    });
  });

  it('sends the UTC weekday, so Monday 1 AM in Ethiopia is Sunday in UTC', () => {
    const { onAddSlot } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'AM' }));
    fireEvent.click(cell('Mon 1:00 AM'));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));
    expect(onAddSlot).toHaveBeenCalledWith({
      dayOfWeek: 0,
      startTime: '2026-01-04T22:00:00.000Z',
      endTime: '2026-01-04T23:00:00.000Z',
      isRecurring: true,
    });
  });

  it('sends a non-recurring slot with an Ethiopian date and no dayOfWeek', () => {
    const { onAddSlot } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'AM' }));
    fireEvent.click(cell('Tue 9:00 AM'));
    fireEvent.click(screen.getByLabelText('Recurring weekly'));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-02-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));

    const payload = onAddSlot.mock.calls[0][0];
    expect(payload).toEqual({
      startTime: '2026-02-10T06:00:00.000Z',
      endTime: '2026-02-10T07:00:00.000Z',
      isRecurring: false,
    });
    expect('dayOfWeek' in payload).toBe(false);
  });

  it('blocks an end time before the start time with a clear message', () => {
    const { onAddSlot } = setup();
    fireEvent.click(cell('Mon 4:00 PM'));
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '15:00' } });
    expect(screen.getByRole('alert')).toHaveTextContent('End time must be after the start time');
    expect(screen.getByRole('button', { name: 'Add slot' })).toBeDisabled();
    expect(onAddSlot).not.toHaveBeenCalled();
  });

  it('blocks a weekly slot that crosses 3:00 AM (midnight UTC)', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'AM' }));
    fireEvent.click(cell('Mon 1:00 AM'));
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '02:00' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '04:00' } });
    expect(screen.getByRole('alert')).toHaveTextContent('cannot cross 3:00 AM');
    expect(screen.getByRole('button', { name: 'Add slot' })).toBeDisabled();
  });

  it('shows how a slot saved in UTC appears in Ethiopia time', () => {
    setup([
      {
        ...monday16Utc,
        id: 's2',
        dayOfWeek: 0,
        startTime: '2026-01-04T22:00:00.000Z',
        endTime: '2026-01-04T23:00:00.000Z',
      },
    ]);
    // Sunday 22:00 UTC is Monday 1:00 AM in Ethiopia
    fireEvent.click(screen.getByRole('button', { name: 'AM' }));
    fireEvent.click(cell('Mon 1:00 AM'));
    expect(screen.getByText(/Remove Mon 1:00 AM – 2:00 AM/)).toBeInTheDocument();
  });

  it('removes with the id of the clicked slot', () => {
    const { onRemoveSlot } = setup([monday16Utc]);
    fireEvent.click(cell('Mon 7:00 PM'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemoveSlot).toHaveBeenCalledWith('s1');
  });

  it('lets an adjacent cell through to onAddSlot (no client overlap logic)', () => {
    const { onAddSlot } = setup([monday16Utc]);
    fireEvent.click(cell('Mon 8:00 PM'));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));
    expect(onAddSlot).toHaveBeenCalledTimes(1);
  });

  it('shows the current week and moves to next week', () => {
    setup();
    expect(screen.getByLabelText('Week shown')).toHaveTextContent(
      'Oct 11 – Oct 17, 2026 (this week)'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByLabelText('Week shown')).toHaveTextContent(
      'Oct 18 – Oct 24, 2026 (next week)'
    );
    fireEvent.click(screen.getByRole('button', { name: 'This week' }));
    expect(screen.getByLabelText('Week shown')).toHaveTextContent('(this week)');
  });

  it('shows a one-off slot only in its own week and a weekly slot in every week', () => {
    setup([oneOffOct19, monday16Utc]);
    fireEvent.click(cell('Mon 4:00 PM'));
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.click(cell('Mon 4:00 PM'));
    expect(screen.getByText(/Remove Mon 4:00 PM – 5:00 PM on Oct 19/)).toBeInTheDocument();
    fireEvent.click(cell('Mon 7:00 PM'));
    expect(
      screen.getByText(/Remove Mon 7:00 PM – 8:00 PM \(repeats every week\)/)
    ).toBeInTheDocument();
  });

  it('prefills the one-off date for the week being viewed', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    fireEvent.click(cell('Wed 4:00 PM'));
    fireEvent.click(screen.getByLabelText('Recurring weekly'));
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-21');
  });

  it('jumps to the week that contains a picked date', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Jump to date'), { target: { value: '2026-11-02' } });
    expect(screen.getByLabelText('Week shown')).toHaveTextContent('Nov 1 – Nov 7, 2026');
  });
});
