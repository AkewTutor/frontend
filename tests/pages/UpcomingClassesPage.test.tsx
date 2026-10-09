import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UpcomingClassesPage from '@/pages/student/UpcomingClassesPage';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useAuthStore } from '@/store/auth.store';

vi.mock('@/hooks/useSessions', () => ({
  useUpcomingSessions: vi.fn(),
}));

const mockUseUpcomingSessions = vi.mocked(useUpcomingSessions);

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/upcoming-classes${search}`]}>
      <Routes>
        <Route path="/upcoming-classes" element={<UpcomingClassesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('UpcomingClassesPage', () => {
  it('Parent needs studentId (show EmptyState if missing)', () => {
    useAuthStore.setState({ user: { role: 'PARENT', id: 'u1', email: null, phone: null } });
    const { unmount } = renderPage('');
    expect(screen.getByText('Please select a student')).toBeInTheDocument();
    unmount();

    mockUseUpcomingSessions.mockReturnValue({ isLoading: false, data: { sessions: [] } } as never);
    renderPage('?studentId=s1');
    expect(screen.getByText('No classes scheduled yet')).toBeInTheDocument();
  });
});
