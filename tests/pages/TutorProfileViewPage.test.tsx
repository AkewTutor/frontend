import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TutorProfileViewPage from '@/pages/student/TutorProfileViewPage';
import type { TutorProfileView } from '@/types';

const { useTutorFullProfileMock, selectMutate } = vi.hoisted(() => ({
  useTutorFullProfileMock: vi.fn(),
  selectMutate: vi.fn(),
}));

vi.mock('@/hooks/useMatching', () => ({
  useTutorFullProfile: (id: string) => useTutorFullProfileMock(id),
  useSelectTutor: () => ({ mutate: selectMutate, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const profile: TutorProfileView = {
  tutorId: 't1',
  name: 'Selam Tesfaye',
  profilePictureUrl: null,
  verificationStatus: 'VERIFIED',
  educationInstitution: 'Addis Ababa University',
  degree: 'BSc Mathematics',
  subjectsAndGrades: [{ subjectName: 'Mathematics', grades: '1-12' }],
  uniqueStudentsTaught: 42,
  availableSlots: [{ startTime: '2026-09-08T16:00:00Z', endTime: '2026-09-08T17:00:00Z' }],
};

function mockProfile(data: TutorProfileView) {
  useTutorFullProfileMock.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/tutors/t1']}>
      <Routes>
        <Route path="/student/tutors/:tutorId" element={<TutorProfileViewPage />} />
        <Route path="/student/group-status" element={<p>group status page</p>} />
        <Route path="/student/find-tutor" element={<p>find tutor page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TutorProfileViewPage', () => {
  it('requests the profile for the tutorId in the URL', () => {
    mockProfile(profile);
    renderPage();
    expect(useTutorFullProfileMock).toHaveBeenCalledWith('t1');
  });

  it('shows loading state', () => {
    useTutorFullProfileMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText(/loading tutor profile/i)).toBeInTheDocument();
  });

  it('shows a "no longer available" message with a way back on 404', () => {
    useTutorFullProfileMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    });
    renderPage();
    expect(screen.getByText('This tutor is no longer available.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to tutor search' })).toHaveAttribute(
      'href',
      '/student/find-tutor'
    );
  });

  it('shows a generic error for non-404 failures', () => {
    useTutorFullProfileMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 500 } },
    });
    renderPage();
    expect(screen.getByText(/couldn.t load this tutor/i)).toBeInTheDocument();
  });

  it('renders the profile details', () => {
    mockProfile(profile);
    renderPage();
    expect(screen.getByRole('heading', { name: 'Selam Tesfaye' })).toBeInTheDocument();
    expect(screen.getByText(/Addis Ababa University/)).toBeInTheDocument();
    expect(screen.getByText(/BSc Mathematics/)).toBeInTheDocument();
    expect(screen.getByText(/Mathematics \(grades 1-12\)/)).toBeInTheDocument();
    expect(screen.getByText(/Students taught:/).parentElement).toHaveTextContent('42');
  });

  it('omits the degree line when degree is not set', () => {
    mockProfile({ ...profile, degree: undefined });
    renderPage();
    expect(screen.queryByText(/Degree:/)).toBeNull();
  });

  it('says so when there are no available slots', () => {
    mockProfile({ ...profile, availableSlots: [] });
    renderPage();
    expect(screen.getByText('No available slots listed.')).toBeInTheDocument();
  });

  it('selects the tutor and navigates to group status on success', () => {
    mockProfile(profile);
    selectMutate.mockImplementation((_body, opts) => opts.onSuccess());
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Select this tutor' }));
    expect(selectMutate).toHaveBeenCalledWith({ tutorId: 't1' }, expect.any(Object));
    expect(screen.getByText('group status page')).toBeInTheDocument();
  });

  it('toasts on 409 and stays on the page', () => {
    mockProfile(profile);
    selectMutate.mockImplementation((_body, opts) => opts.onError({ response: { status: 409 } }));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Select this tutor' }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/no longer available/i));
    expect(screen.queryByText('group status page')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Selam Tesfaye' })).toBeInTheDocument();
  });
});
