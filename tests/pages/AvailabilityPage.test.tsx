import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AvailabilityPage from '@/pages/tutor/AvailabilityPage';

const mocks = vi.hoisted(() => ({
  slots: vi.fn(),
  add: { mutate: vi.fn(), isPending: false },
  remove: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useAvailability', () => ({
  useMyAvailability: () => mocks.slots(),
  useAddSlot: () => mocks.add,
  useRemoveSlot: () => mocks.remove,
}));

const monday16 = {
  id: 's1',
  dayOfWeek: 1,
  startTime: '2026-01-05T16:00:00.000Z',
  endTime: '2026-01-05T17:00:00.000Z',
  isRecurring: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.slots.mockReturnValue({ data: { slots: [monday16] }, isLoading: false, isError: false });
});

describe('AvailabilityPage', () => {
  it('wires adding a slot to useAddSlot', () => {
    render(<AvailabilityPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Tue 09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }));
    expect(mocks.add.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.add.mutate.mock.calls[0][0]).toMatchObject({ dayOfWeek: 2, isRecurring: true });
  });

  it('wires removing a slot to useRemoveSlot', () => {
    render(<AvailabilityPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mon 16:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(mocks.remove.mutate.mock.calls[0][0]).toBe('s1');
  });

  it('shows an error state when availability fails to load', () => {
    mocks.slots.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<AvailabilityPage />);
    expect(screen.getByText(/couldn.t load your availability/i)).toBeInTheDocument();
  });
});
