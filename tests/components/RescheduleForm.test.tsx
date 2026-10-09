import { render, screen, fireEvent } from '@testing-library/react';
import RescheduleForm from '@/components/class-delivery/RescheduleForm';
import { useRequestReschedule } from '@/hooks/useReschedule';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@/hooks/useReschedule');
vi.mock('@/components/common/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    ...props
  }: import('react').ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe('RescheduleForm', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.mocked(useRequestReschedule).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      error: null,
      isPending: false,
      isSuccess: false,
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const session = { id: 'sess-1', scheduledStart: '2024-01-01T12:00:00.000Z' };

  it('live badge flips from FREE_RESCHEDULE to SAME_DAY_MISS as the picked time changes', () => {
    vi.setSystemTime(new Date('2023-12-31T23:00:00.000Z')); // 13h notice

    render(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );

    const input = screen.getByTestId('datetime-input');

    fireEvent.change(input, { target: { value: '2024-01-02T10:00' } });
    expect(screen.getByTestId('status-badge')).toHaveTextContent('FREE_RESCHEDULE');

    vi.setSystemTime(new Date('2024-01-01T01:00:00.000Z')); // 11h notice

    fireEvent.change(input, { target: { value: '2024-01-02T11:00' } });
    expect(screen.getByTestId('status-badge')).toHaveTextContent('SAME_DAY_MISS');
  });

  it("confirmation reconciles to the server's classification where preview and server GENUINELY disagree", () => {
    vi.setSystemTime(new Date('2023-12-31T23:00:00.000Z')); // Preview would be FREE_RESCHEDULE

    vi.mocked(useRequestReschedule).mockReturnValue({
      mutate: mockMutate,
      data: {
        id: '1',
        sessionId: 'sess-1',
        requestedNewStart: '2024-01-02T10:00:00.000Z',
        noticeHours: '11.5',
        classification: 'SAME_DAY_MISS',
      },
      error: null,
      isPending: false,
      isSuccess: true,
    } as never);

    render(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('status-badge')).toHaveTextContent('SAME_DAY_MISS');
    expect(screen.getByText(/A missed-session record was created/)).toBeInTheDocument();
  });

  it('submit disabled until a time is picked', () => {
    render(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Request Reschedule/i });
    expect(submitBtn).toBeDisabled();

    const input = screen.getByTestId('datetime-input');
    fireEvent.change(input, { target: { value: '2024-01-02T10:00' } });

    expect(submitBtn).not.toBeDisabled();
  });

  it('400 and 409 messages rendered', () => {
    vi.mocked(useRequestReschedule).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      error: {
        response: {
          data: {
            message: 'Outside tutor availability',
          },
        },
      } as never,
      isPending: false,
      isSuccess: false,
    } as never);

    const { rerender } = render(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );
    expect(screen.getByText('Outside tutor availability')).toBeInTheDocument();

    vi.mocked(useRequestReschedule).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      error: {
        response: {
          data: {
            message: 'Admin review needed',
          },
        },
      } as never,
      isPending: false,
      isSuccess: false,
    } as never);

    rerender(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );
    expect(screen.getByText('Admin review needed')).toBeInTheDocument();
  });

  it('SAME_DAY_MISS confirmation shows the warning', () => {
    vi.mocked(useRequestReschedule).mockReturnValue({
      mutate: mockMutate,
      data: {
        id: '1',
        sessionId: 'sess-1',
        requestedNewStart: '2024-01-02T10:00:00.000Z',
        noticeHours: '11',
        classification: 'SAME_DAY_MISS',
        sessionMissId: 'miss-123',
      },
      error: null,
      isPending: false,
      isSuccess: true,
    } as never);

    render(
      <BrowserRouter>
        <RescheduleForm session={session} />
      </BrowserRouter>
    );

    expect(screen.getByText(/A missed-session record was created/)).toBeInTheDocument();
    expect(screen.getByText(/miss-123/)).toBeInTheDocument();
  });
});
