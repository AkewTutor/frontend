import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FindTutorPage from '@/pages/student/FindTutorPage';
import { useNoExactMatch, useSearchTutors } from '@/hooks/useMatching';

vi.mock('@/hooks/useMatching', () => ({ useSearchTutors: vi.fn(), useNoExactMatch: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => ({ data: { subjects: [{ id: 's1', name: 'Maths', isActive: true }] } }),
}));

const mockedSearch = vi.mocked(useSearchTutors);
const mockedNoExactMatch = vi.mocked(useNoExactMatch);
const mutate = vi.fn();

function result(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useSearchTutors>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/student/find-tutor" element={<FindTutorPage />} />
        <Route path="/student/tutors/:tutorId" element={<p>Tutor view</p>} />
        <Route path="/student/group-status" element={<p>Group status</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedSearch.mockReturnValue(result({}));
  mockedNoExactMatch.mockReturnValue({ mutate } as unknown as ReturnType<typeof useNoExactMatch>);
});

describe('FindTutorPage', () => {
  it('shows the idle prompt and searches with empty filters when the URL has none', () => {
    renderAt('/student/find-tutor');
    expect(screen.getByText('Select a subject to see tutors.')).toBeInTheDocument();
    expect(mockedSearch).toHaveBeenCalledWith({});
  });

  it('reads filters from the URL query params', () => {
    renderAt('/student/find-tutor?subjectId=s1&grade=9&day=1');
    expect(mockedSearch).toHaveBeenCalledWith({ subjectId: 's1', grade: 9, day: '1' });
    expect(screen.getByLabelText('Subject')).toHaveValue('s1');
  });

  it('writes a changed filter back to the URL and re-searches', async () => {
    renderAt('/student/find-tutor?subjectId=s1');
    await userEvent.selectOptions(screen.getByLabelText('Day'), '2');
    expect(mockedSearch).toHaveBeenLastCalledWith({ subjectId: 's1', day: '2' });
  });

  it('keeps prompting for a subject while only other filters are set', () => {
    renderAt('/student/find-tutor?grade=9');
    expect(screen.getByText('Select a subject to see tutors.')).toBeInTheDocument();
  });

  it('shows loading while searching', () => {
    mockedSearch.mockReturnValue(result({ isLoading: true }));
    renderAt('/student/find-tutor?subjectId=s1');
    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('shows the empty state when filters return no tutors', () => {
    mockedSearch.mockReturnValue(result({ data: { tutors: [] } }));
    renderAt('/student/find-tutor?subjectId=s1');
    expect(screen.getByText('No tutors match these filters.')).toBeInTheDocument();
  });

  it('offers the no-exact-match option on an empty result and hands over to the status page', async () => {
    mutate.mockImplementation((_arg, options) => options.onSuccess());
    mockedSearch.mockReturnValue(result({ data: { tutors: [] } }));
    renderAt('/student/find-tutor?subjectId=s1');

    await userEvent.click(screen.getByRole('button', { name: /no exact match/i }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({ subjectId: 's1' }, expect.any(Object));
    expect(screen.getByText('Group status')).toBeInTheDocument();
  });

  it('hints to clear the day or budget filter when one is set and nothing matches', () => {
    mockedSearch.mockReturnValue(result({ data: { tutors: [] } }));
    renderAt('/student/find-tutor?subjectId=s1&day=1');
    expect(screen.getByText(/may be hiding tutors/i)).toBeInTheDocument();
  });

  it('shows no filter hint when only the subject is set', () => {
    mockedSearch.mockReturnValue(result({ data: { tutors: [] } }));
    renderAt('/student/find-tutor?subjectId=s1');
    expect(screen.queryByText(/may be hiding tutors/i)).not.toBeInTheDocument();
  });

  it('shows an error line when the search fails', () => {
    mockedSearch.mockReturnValue(result({ isError: true }));
    renderAt('/student/find-tutor?subjectId=s1');
    expect(screen.getByText(/couldn.t load tutors/i)).toBeInTheDocument();
  });

  it('renders result cards linking to the tutor view', async () => {
    mockedSearch.mockReturnValue(
      result({
        data: {
          tutors: [
            {
              tutorId: 't1',
              name: 'Abebe K.',
              profilePictureUrl: null,
              verificationStatus: 'VERIFIED',
              pricePerStudentPerHour: '120.00',
            },
          ],
        },
      })
    );
    renderAt('/student/find-tutor?subjectId=s1');
    const link = screen.getByRole('link', { name: /Abebe K\./ });
    expect(link).toHaveAttribute('href', '/student/tutors/t1?subjectId=s1');
    await userEvent.click(link);
    expect(screen.getByText('Tutor view')).toBeInTheDocument();
  });

  it('shows the price, or a fallback when no price is configured', () => {
    mockedSearch.mockReturnValue(
      result({
        data: {
          tutors: [
            {
              tutorId: 't1',
              name: 'Abebe K.',
              profilePictureUrl: null,
              verificationStatus: 'VERIFIED',
              pricePerStudentPerHour: '120.00',
            },
            {
              tutorId: 't2',
              name: 'Selam T.',
              profilePictureUrl: null,
              verificationStatus: 'VERIFIED',
              pricePerStudentPerHour: null,
            },
          ],
        },
      })
    );
    renderAt('/student/find-tutor?subjectId=s1');
    expect(screen.getByText('120.00 per student per hour')).toBeInTheDocument();
    expect(screen.getByText('Price not available yet')).toBeInTheDocument();
  });
});
