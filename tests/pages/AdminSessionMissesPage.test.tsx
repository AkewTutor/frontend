import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import AdminSessionMissesPage from '@/pages/admin/AdminSessionMissesPage';
import { useSessionMisses } from '@/hooks/useSessionMiss';
import type { SessionMissListResponse } from '@/types';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useSessionMiss');
vi.mock('@/components/common/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    createElement('div', { 'data-testid': 'empty-state' }, message),
}));
vi.mock('@/components/class-delivery/SessionMissTable', () => ({
  default: ({ onPageChange }: { onPageChange: (p: number) => void }) =>
    createElement(
      'button',
      { 'data-testid': 'miss-table', onClick: () => onPageChange(3) },
      'go page 3'
    ),
}));
vi.mock('@/components/class-delivery/EscalationBanner', () => ({
  default: ({
    visible,
    tutorIds,
    onSelectTutor,
  }: {
    visible: boolean;
    tutorIds?: string[];
    onSelectTutor?: (id: string) => void;
  }) =>
    createElement(
      'div',
      { 'data-testid': 'banner' },
      `visible:${visible};ids:${tutorIds?.join(',') ?? ''}`,
      ...(tutorIds ?? []).map((id) =>
        createElement('button', { key: id, onClick: () => onSelectTutor?.(id) }, `chip-${id}`)
      )
    ),
}));
vi.mock('@/components/class-delivery/RecordMissForm', () => ({
  default: ({ initialSessionId }: { initialSessionId?: string | null }) =>
    createElement('div', { 'data-testid': 'record-form' }, `Form init: ${initialSessionId}`),
}));

const mockData = (d: Partial<SessionMissListResponse> = {}) =>
  vi.mocked(useSessionMisses).mockReturnValue({
    data: {
      misses: [],
      escalationFlag: null,
      escalatedTutorIds: [],
      page: 1,
      limit: 20,
      total: 0,
      ...d,
    },
    isLoading: false,
    error: null,
  } as never);

const renderPage = (url = '/admin/session-misses') =>
  render(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/admin/session-misses',
          element: createElement(AdminSessionMissesPage),
        })
      )
    )
  );

describe('AdminSessionMissesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData();
  });

  it('?sessionId= (useSearchParams) is passed as initialSessionId to RecordMissForm', () => {
    renderPage('/admin/session-misses?sessionId=s1');
    expect(screen.getByTestId('record-form')).toHaveTextContent('Form init: s1');
  });

  it('changing a filter resets page to 1 (tutor and causedBy)', () => {
    renderPage();
    expect(useSessionMisses).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
    fireEvent.click(screen.getByTestId('miss-table'));
    expect(useSessionMisses).toHaveBeenLastCalledWith({ page: 3, limit: 20 });
    fireEvent.change(screen.getByPlaceholderText('Tutor ID'), { target: { value: 't1' } });
    expect(useSessionMisses).toHaveBeenLastCalledWith({ page: 1, limit: 20, tutorId: 't1' });
    fireEvent.click(screen.getByTestId('miss-table'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TUTOR' } });
    expect(useSessionMisses).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      tutorId: 't1',
      causedBy: 'TUTOR',
    });
  });

  it('no tutorId: banner follows escalatedTutorIds (list mode, two chips)', () => {
    mockData({ escalationFlag: null, escalatedTutorIds: ['t1', 't2'] });
    renderPage();
    expect(screen.getByTestId('banner')).toHaveTextContent('visible:true;ids:t1,t2');
    expect(screen.getByText('chip-t1')).toBeInTheDocument();
    expect(screen.getByText('chip-t2')).toBeInTheDocument();
  });

  it('no tutorId: empty escalatedTutorIds hides the banner', () => {
    mockData({ escalatedTutorIds: [] });
    renderPage();
    expect(screen.getByTestId('banner')).toHaveTextContent('visible:false');
  });

  it('tutorId set: banner follows escalationFlag (single mode, no ids)', () => {
    mockData({ escalationFlag: true, escalatedTutorIds: [] });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Tutor ID'), { target: { value: 't1' } });
    expect(screen.getByTestId('banner')).toHaveTextContent('visible:true;ids:');
    mockData({ escalationFlag: false });
    fireEvent.change(screen.getByPlaceholderText('Tutor ID'), { target: { value: 't2' } });
    expect(screen.getByTestId('banner')).toHaveTextContent('visible:false');
  });

  it('clicking a chip sets the tutor filter and resets page to 1', () => {
    mockData({ escalatedTutorIds: ['t1'] });
    renderPage();
    fireEvent.click(screen.getByTestId('miss-table'));
    fireEvent.click(screen.getByText('chip-t1'));
    expect(useSessionMisses).toHaveBeenLastCalledWith({ page: 1, limit: 20, tutorId: 't1' });
  });

  it('handles error state', () => {
    vi.mocked(useSessionMisses).mockReturnValue({ error: new Error() } as never);
    renderPage();
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Error loading session misses.');
  });
});
