import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AcademicProfilePage from '@/pages/student/AcademicProfilePage';
import type { StudentProfile } from '@/types';

const mocks = vi.hoisted(() => ({
  useMyStudentProfile: vi.fn(),
  upload: { mutate: vi.fn(), isPending: false },
  updateAcademic: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useStudentProfile', () => ({
  useMyStudentProfile: (...a: unknown[]) => mocks.useMyStudentProfile(...a),
  useUploadProfilePicture: () => mocks.upload,
  useUpdateAcademicProfile: () => mocks.updateAcademic,
}));
vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => ({ data: { subjects: [{ id: 's1', name: 'Mathematics', isActive: true }] } }),
}));

const profile: StudentProfile = {
  id: 'p1',
  userId: 'u1',
  grade: 8,
  school: null,
  profilePictureUrl: null,
  subjectsOfInterest: [],
  academicLevel: null,
  learningGoals: null,
  preferredLanguage: null,
  learningSchedulePreference: null,
  teachingStylePreference: null,
  budgetPreference: null,
  formatPreference: null,
  accountStatus: 'ACTIVE',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useMyStudentProfile.mockReturnValue({ data: profile, isLoading: false, isError: false });
});

describe('AcademicProfilePage', () => {
  it('loads the self view without a studentId', () => {
    render(<AcademicProfilePage />);
    expect(mocks.useMyStudentProfile).toHaveBeenCalledWith();
  });

  it('shows loading and error states', () => {
    mocks.useMyStudentProfile.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<AcademicProfilePage />);
    expect(screen.getByText(/loading/i)).toBeTruthy();

    mocks.useMyStudentProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(<AcademicProfilePage />);
    expect(screen.getByText(/couldn.t load/i)).toBeTruthy();
  });

  it('uploads a chosen picture file', () => {
    render(<AcademicProfilePage />);
    const file = new File(['x'], 'me.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Profile picture/), { target: { files: [file] } });
    expect(mocks.upload.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.upload.mutate.mock.calls[0][0]).toBe(file);
  });

  it('rejects a non-image picture without calling the API', () => {
    render(<AcademicProfilePage />);
    const file = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/Profile picture/), { target: { files: [file] } });
    expect(mocks.upload.mutate).not.toHaveBeenCalled();
  });

  it('saves the academic form without the picture, budget or level fields', async () => {
    render(<AcademicProfilePage />);
    fireEvent.change(screen.getByLabelText('School'), { target: { value: 'Bole' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save academic profile' }));
    await waitFor(() => expect(mocks.updateAcademic.mutate).toHaveBeenCalledTimes(1));
    const body = mocks.updateAcademic.mutate.mock.calls[0][0];
    expect(body).toMatchObject({ school: 'Bole', grade: 8 });
    expect(body).not.toHaveProperty('profilePictureUrl');
    expect(body).not.toHaveProperty('budgetPreference');
    expect(body).not.toHaveProperty('academicLevel');
    expect(mocks.upload.mutate).not.toHaveBeenCalled();
  });

  it('sends the language chosen from the dropdown', async () => {
    render(<AcademicProfilePage />);
    fireEvent.change(screen.getByLabelText('Preferred language'), { target: { value: 'Amharic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save academic profile' }));
    await waitFor(() => expect(mocks.updateAcademic.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.updateAcademic.mutate.mock.calls[0][0].preferredLanguage).toBe('Amharic');
  });

  it('sends selected subjects of interest', async () => {
    render(<AcademicProfilePage />);
    fireEvent.click(screen.getByLabelText('Mathematics'));
    fireEvent.click(screen.getByRole('button', { name: 'Save academic profile' }));
    await waitFor(() => expect(mocks.updateAcademic.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.updateAcademic.mutate.mock.calls[0][0].subjectsOfInterest).toEqual(['s1']);
  });

  it('blocks an out-of-range grade', async () => {
    render(<AcademicProfilePage />);
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save academic profile' }));
    expect(await screen.findByText('Grade must be 1–12')).toBeTruthy();
    expect(mocks.updateAcademic.mutate).not.toHaveBeenCalled();
  });
});
