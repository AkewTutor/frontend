import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import TutorSessionMissesPage from '@/pages/tutor/TutorSessionMissesPage';
import { useSessionMisses } from '@/hooks/useSessionMiss';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useSessionMiss');
vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));
vi.mock('@/components/class-delivery/SessionMissTable', () => ({
  default: ({ total }: { total: number }) =>
    createElement('div', { 'data-testid': 'miss-table' }, `Total: ${total}`),
}));
vi.mock('@/components/class-delivery/EscalationBanner', () => ({
  default: ({ visible }: { visible: boolean }) =>
    visible ? createElement('div', { 'data-testid': 'banner' }) : null,
}));

const mockData = (escalationFlag: boolean | null) =>
  vi.mocked(useSessionMisses).mockReturnValue({
    data: { misses: [], escalationFlag, escalatedTutorIds: [], page: 1, limit: 20, total: 5 },
    isLoading: false,
    error: null,
  } as never);

describe('TutorSessionMissesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TutorSessionMissesPage calls useSessionMisses({ page, limit: 20 }) and NEVER passes tutorId', () => {
    mockData(null);
    render(createElement(TutorSessionMissesPage));
    expect(useSessionMisses).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(vi.mocked(useSessionMisses).mock.calls[0][0] as object).not.toHaveProperty('tutorId');
    expect(screen.getByTestId('miss-table')).toHaveTextContent('Total: 5');
  });

  it.each([
    [true, true],
    [false, false],
    [null, false],
  ])('banner for escalationFlag=%s visible=%s (only true shows it)', (flag, shown) => {
    mockData(flag);
    render(createElement(TutorSessionMissesPage));
    expect(screen.queryByTestId('banner') !== null).toBe(shown);
  });

  it('handles loading state', () => {
    vi.mocked(useSessionMisses).mockReturnValue({ isLoading: true } as never);
    render(createElement(TutorSessionMissesPage));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    vi.mocked(useSessionMisses).mockReturnValue({ error: new Error() } as never);
    render(createElement(TutorSessionMissesPage));
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Error loading session misses.');
  });
});
