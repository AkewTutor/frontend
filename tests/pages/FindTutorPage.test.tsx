import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FindTutorPage from '@/pages/student/FindTutorPage';
import { useSearchTutors } from '@/hooks/useMatching';

vi.mock('@/hooks/useMatching', () => ({ useSearchTutors: vi.fn() }));
vi.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => ({ data: { subjects: [{ id: 's1', name: 'Maths', isActive: true }] } }),
}));

const mockedSearch = vi.mocked(useSearchTutors);

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
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedSearch.mockReturnValue(result({}));
});

describe('FindTutorPage', () => {
  it('shows the idle prompt and searches with empty filters when the URL has none', () => {
    renderAt('/student/find-tutor');
    expect(screen.getByText('Start by selecting a filter to see tutors.')).toBeInTheDocument();
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

  it('shows loading while searching', () => {
    mockedSearch.mockReturnValue(result({ isLoading: true }));
    renderAt('/student/find-tutor?language=English');
    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('shows the empty state when filters return no tutors', () => {
    mockedSearch.mockReturnValue(result({ data: { tutors: [] } }));
    renderAt('/student/find-tutor?language=English');
    expect(screen.getByText('No tutors match these filters.')).toBeInTheDocument();
  });

  it('shows an error line when the search fails', () => {
    mockedSearch.mockReturnValue(result({ isError: true }));
    renderAt('/student/find-tutor?language=English');
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
    renderAt('/student/find-tutor?language=English');
    const link = screen.getByRole('link', { name: /Abebe K\./ });
    expect(link).toHaveAttribute('href', '/student/tutors/t1');
    await userEvent.click(link);
    expect(screen.getByText('Tutor view')).toBeInTheDocument();
  });
});
