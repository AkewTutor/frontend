import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AvailabilityCalendar from '@/components/accounts/AvailabilityCalendar';
import type { AvailabilitySlot } from '@/types';

const monday16: AvailabilitySlot = {
  id: 's1',
  dayOfWeek: 1,
  startTime: '2026-01-05T16:00:00.000Z',
  endTime: '2026-01-05T17:00:00.000Z',
  isRecurring: true,
};

function setup(slots: AvailabilitySlot[] = []) {
  const onAddSlot = vi.fn();
  const onRemoveSlot = vi.fn();
  render(<AvailabilityCalendar slots={slots} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} />);
  return { onAddSlot, onRemoveSlot };
}

const cell = (label: string) => screen.getByRole('button', { name: label });

describe('AvailabilityCalendar', () => {
  it('opens the creation form on an empty cell', () => {
    setup();
    fireEvent.click(cell('Mon 16:00'));
    expect(screen.getByText('New slot')).toBeInTheDocument();
    expect(screen.getByLabelText('Start time')).toHaveValue('16:00');
  });

  it('offers Remove, not a second form, on an occupied cell', () => {
    setup([monday16]);
    fireEvent.click(cell('Mon 16:00'));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.queryByText('New slot')).toBeNull();
  });

  it('adds a recurring slot with the clicked day and times', () => {
    const { onAddSlot } = setup();
    fireEvent.click(cell('Mon 16:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));

    expect(onAddSlot).toHaveBeenCalledWith({
      dayOfWeek: 1,
      startTime: '2026-01-05T16:00:00.000Z',
      endTime: '2026-01-05T17:00:00.000Z',
      isRecurring: true,
    });
  });

  it('adds a non-recurring slot with a date and no dayOfWeek', () => {
    const { onAddSlot } = setup();
    fireEvent.click(cell('Tue 09:00'));
    fireEvent.click(screen.getByLabelText('Recurring weekly'));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-02-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));

    const payload = onAddSlot.mock.calls[0][0];
    expect(payload).toEqual({
      startTime: '2026-02-10T09:00:00.000Z',
      endTime: '2026-02-10T10:00:00.000Z',
      isRecurring: false,
    });
    expect('dayOfWeek' in payload).toBe(false);
  });

  it('removes with the id of the clicked slot', () => {
    const { onRemoveSlot } = setup([monday16]);
    fireEvent.click(cell('Mon 16:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemoveSlot).toHaveBeenCalledWith('s1');
  });

  it('lets an adjacent cell through to onAddSlot (no client overlap logic)', () => {
    const { onAddSlot } = setup([monday16]);
    fireEvent.click(cell('Mon 17:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));
    expect(onAddSlot).toHaveBeenCalledTimes(1);
  });
});
