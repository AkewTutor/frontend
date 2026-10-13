import { render, screen, fireEvent } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import SessionMissTable from '@/components/class-delivery/SessionMissTable';
import type { SessionMiss } from '@/types';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => createElement('button', { disabled, onClick }, children),
}));

const miss = (o: Partial<SessionMiss> = {}): SessionMiss => ({
  id: '1',
  sessionId: 's1',
  causedBy: 'STUDENT',
  missType: 'NO_SHOW',
  tutorId: 't1',
  makeupSessionId: null,
  createdAt: '2024-01-01',
  ...o,
});
const base = { page: 1, limit: 10, total: 1, onPageChange: vi.fn() };

describe('SessionMissTable', () => {
  it('renders loading state', () => {
    render(createElement(SessionMissTable, { ...base, misses: [], isLoading: true }));
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders EmptyState when misses is empty', () => {
    render(createElement(SessionMissTable, { ...base, misses: [] }));
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No session misses found.');
  });

  it('renders inline Prev/Next using Button, disabled at bounds, and shows Page X of Y', () => {
    const onPageChange = vi.fn();
    render(createElement(SessionMissTable, { ...base, misses: [miss()], total: 25, onPageChange }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Prev')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('make-up column shows Queued with makeupSessionId and None without', () => {
    render(
      createElement(SessionMissTable, {
        ...base,
        total: 2,
        misses: [miss({ id: '1', makeupSessionId: 'm1' }), miss({ id: '2' })],
      })
    );
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('tutor column only with showTutor; tutor click calls onSelectTutor', () => {
    const onSelectTutor = vi.fn();
    const { rerender } = render(createElement(SessionMissTable, { ...base, misses: [miss()] }));
    expect(screen.queryByRole('columnheader', { name: 'Tutor' })).not.toBeInTheDocument();
    rerender(
      createElement(SessionMissTable, { ...base, misses: [miss()], showTutor: true, onSelectTutor })
    );
    expect(screen.getByRole('columnheader', { name: 'Tutor' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('t1'));
    expect(onSelectTutor).toHaveBeenCalledWith('t1');
  });
});
