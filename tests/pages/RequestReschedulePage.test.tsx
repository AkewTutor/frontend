import { render, screen } from '@testing-library/react';
import RequestReschedulePage from '@/pages/RequestReschedulePage';
import { useSession } from '@/hooks/useSessions';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useSessions');
vi.mock('@/components/class-delivery/RescheduleForm', () => ({
  default: () => <div data-testid="reschedule-form" />,
}));
vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) => <div data-testid="empty-state">{message}</div>,
}));

describe('RequestReschedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (sessionId = 'sess-1') => {
    return render(
      <MemoryRouter initialEntries={[`/reschedule/${sessionId}`]}>
        <Routes>
          <Route path="/reschedule/:sessionId" element={<RequestReschedulePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('not-found/error EmptyState', () => {
    vi.mocked(useSession).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as never);

    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'Session not found or error occurred.'
    );
  });

  it('COMPLETED/MISSED -> EmptyState', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { id: 'sess-1', scheduledStart: '2024-01-01T12:00:00Z', status: 'COMPLETED' },
      isLoading: false,
      error: null,
    } as never);

    const { unmount } = renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Session is already COMPLETED.');
    unmount();

    vi.mocked(useSession).mockReturnValue({
      data: { id: 'sess-1', scheduledStart: '2024-01-01T12:00:00Z', status: 'MISSED' },
      isLoading: false,
      error: null,
    } as never);

    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Session is already MISSED.');
  });

  it('normal -> form rendered', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { id: 'sess-1', scheduledStart: '2024-01-01T12:00:00Z', status: 'SCHEDULED' },
      isLoading: false,
      error: null,
    } as never);

    renderPage();
    expect(screen.getByTestId('reschedule-form')).toBeInTheDocument();
  });
});
