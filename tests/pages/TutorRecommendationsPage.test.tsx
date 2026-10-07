import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorRecommendationsPage from '@/pages/student/TutorRecommendationsPage';
import type { TutorRecommendation } from '@/types';

const { useRecommendationsMock, selectMutate, noExactMutate } = vi.hoisted(() => ({
  useRecommendationsMock: vi.fn(),
  selectMutate: vi.fn(),
  noExactMutate: vi.fn(),
}));

vi.mock('@/hooks/useMatching', () => ({
  useRecommendations: () => useRecommendationsMock(),
  useSelectTutor: () => ({ mutate: selectMutate, isPending: false }),
  useNoExactMatch: () => ({ mutate: noExactMutate, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tutor: TutorRecommendation = {
  tutorId: 't1',
  name: 'Selam Tesfaye',
  profilePictureUrl: null,
  matchPercentage: 92,
};

function mockData(recommendations: TutorRecommendation[], zeroMatchSince: string | null = null) {
  useRecommendationsMock.mockReturnValue({
    data: { recommendations, matchRequestId: 'm1', zeroMatchSince },
    isLoading: false,
    isError: false,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/recommendations']}>
      <Routes>
        <Route path="/student/recommendations" element={<TutorRecommendationsPage />} />
        <Route path="/student/group-status" element={<p>group status page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TutorRecommendationsPage', () => {
  it('renders one card per recommendation and no NoExactMatchButton', () => {
    mockData([tutor, { ...tutor, tutorId: 't2', name: 'Abel Kebede' }]);
    renderPage();
    expect(screen.getByText('Selam Tesfaye')).toBeInTheDocument();
    expect(screen.getByText('Abel Kebede')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /no exact match/i })).toBeNull();
  });

  it('renders NoExactMatchButton (not an error) when the list is empty', () => {
    mockData([]);
    renderPage();
    expect(screen.getByRole('button', { name: /no exact match/i })).toBeInTheDocument();
    expect(screen.queryByText(/couldn.t load/i)).toBeNull();
  });

  it('triggers no-exact-match and navigates to group status on success', () => {
    mockData([]);
    noExactMutate.mockImplementation((_arg, opts) => opts.onSuccess());
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /no exact match/i }));
    expect(noExactMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
    expect(screen.getByText('group status page')).toBeInTheDocument();
  });

  it('selects a tutor and navigates to group status on success', () => {
    mockData([tutor]);
    selectMutate.mockImplementation((_body, opts) => opts.onSuccess());
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /select/i }));
    expect(selectMutate).toHaveBeenCalledWith({ tutorId: 't1' }, expect.any(Object));
    expect(screen.getByText('group status page')).toBeInTheDocument();
  });

  it('shows a toast on 409, stays on the page and keeps the list', () => {
    mockData([tutor]);
    selectMutate.mockImplementation((_body, opts) => opts.onError({ response: { status: 409 } }));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /select/i }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/no longer available/i));
    expect(screen.getByText('Selam Tesfaye')).toBeInTheDocument();
    expect(screen.queryByText('group status page')).toBeNull();
  });
});
