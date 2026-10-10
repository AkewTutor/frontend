import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ActivityHistoryTable from '@/components/admin-support/ActivityHistoryTable';
import { ROUTES } from '@/constants';

declare const process: { env: Record<string, string | undefined> };

const mocks = vi.hoisted(() => ({ useActivityHistory: vi.fn() }));
vi.mock('@/hooks/useAdminReporting', () => ({
  useActivityHistory: mocks.useActivityHistory,
}));

const ev = (id: string, relatedEntityType: string, eventType = 'DISPUTE') => ({
  id,
  eventType,
  summary: `Summary ${id}`,
  relatedEntityType,
  relatedEntityId: `e-${id}`,
  occurredAt: '2026-10-05T21:30:00Z',
});

function ok(events = [ev('1', 'ComplaintReport')], totalPages = 5) {
  return {
    data: { events, pagination: { page: 1, limit: 20, total: 100, totalPages } },
    isLoading: false,
    isError: false,
  };
}

function renderTable() {
  return render(
    <MemoryRouter>
      <ActivityHistoryTable />
    </MemoryRouter>
  );
}

const originalTz = process.env.TZ;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActivityHistory.mockReturnValue(ok());
});

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe('ActivityHistoryTable', () => {
  it('initial call uses the defaults', () => {
    renderTable();

    expect(mocks.useActivityHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      dateRange: '30d',
      eventType: undefined,
    });
  });

  it('changing dateRange or eventType resets page to 1', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(mocks.useActivityHistory).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));

    fireEvent.change(screen.getByLabelText('Date range'), { target: { value: '7d' } });
    expect(mocks.useActivityHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      dateRange: '7d',
      eventType: undefined,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Event type'), { target: { value: 'REFUND' } });
    expect(mocks.useActivityHistory).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      dateRange: '7d',
      eventType: 'REFUND',
    });
  });

  it('pagination changes only page', () => {
    renderTable();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(mocks.useActivityHistory).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
      dateRange: '30d',
      eventType: undefined,
    });
  });

  it('event type options are All plus the six types', () => {
    renderTable();

    const select = screen.getByLabelText('Event type') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      '',
      'BOOKING',
      'PAYMENT',
      'DISPUTE',
      'TUTOR_VERIFICATION',
      'REFUND',
      'PAYOUT',
    ]);
  });

  it('shows occurredAt in the viewer local time zone', () => {
    process.env.TZ = 'Asia/Tokyo'; // 21:30Z -> 06:30 next day
    renderTable();

    expect(screen.getByText(/6:30/)).toBeInTheDocument();
    expect(screen.queryByText(/9:30/)).not.toBeInTheDocument();
  });

  it('renders the event type through StatusBadge', () => {
    mocks.useActivityHistory.mockReturnValue(ok([ev('1', 'Cohort', 'TUTOR_VERIFICATION')]));
    renderTable();

    expect(document.querySelector('[data-status="TUTOR_VERIFICATION"]')).toBeInTheDocument();
  });

  it('links only entity types that have an admin route', () => {
    mocks.useActivityHistory.mockReturnValue(
      ok([
        ev('1', 'ComplaintReport'),
        ev('2', 'TutorProfile', 'TUTOR_VERIFICATION'),
        ev('3', 'Refund', 'REFUND'),
        ev('4', 'Payout', 'PAYOUT'),
        ev('5', 'Payment', 'PAYMENT'),
        ev('6', 'SomethingNew', 'BOOKING'),
      ])
    );
    renderTable();

    const hrefOf = (id: string) =>
      screen.getByText(`Summary ${id}`).closest('tr')!.querySelector('a')?.getAttribute('href');

    expect(hrefOf('1')).toBe(ROUTES.ADMIN_DISPUTES);
    expect(hrefOf('2')).toBe(ROUTES.ADMIN_TUTOR_VERIFICATION);
    expect(hrefOf('3')).toBe(ROUTES.ADMIN_REFUNDS);
    expect(hrefOf('4')).toBe(ROUTES.ADMIN_PAYOUTS);
    expect(hrefOf('5')).toBeUndefined();
    expect(hrefOf('6')).toBeUndefined();
  });

  it('shows empty, loading and error states', () => {
    mocks.useActivityHistory.mockReturnValue(ok([], 1));
    const { rerender } = renderTable();
    expect(screen.getByText('No activity for these filters.')).toBeInTheDocument();

    mocks.useActivityHistory.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    rerender(
      <MemoryRouter>
        <ActivityHistoryTable />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading activity…')).toBeInTheDocument();

    mocks.useActivityHistory.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(
      <MemoryRouter>
        <ActivityHistoryTable />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load activity history.');
  });
});
