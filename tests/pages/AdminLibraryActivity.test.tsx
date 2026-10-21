import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLibraryActivity from '@/pages/admin/AdminLibraryActivity';
import { useLibraryActivity } from '@/hooks/useLibrary';

vi.mock('@/hooks/useLibrary', () => ({ useLibraryActivity: vi.fn() }));
const mockHook = vi.mocked(useLibraryActivity);

const user = { name: 'Tutor T', email: 't@x.com', phone: '+251900000001' };

describe('AdminLibraryActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows search box and rows with Active and Removed statuses', () => {
    mockHook.mockReturnValue({
      data: {
        items: [
          { id: 'a', title: 'Alive', fileType: 'PDF', cohortId: 'c1', createdAt: '2026-10-01T00:00:00Z', removedAt: null, fileUrl: 'https://f', tutor: user, students: [user] },
          { id: 'b', title: 'Gone', fileType: 'VIDEO', cohortId: 'c1', createdAt: '2026-09-01T00:00:00Z', removedAt: '2026-10-02T00:00:00Z', fileUrl: 'https://g', tutor: user, students: [] },
        ],
      },
      isLoading: false,
      isError: false,
    } as never);
    render(
      <MemoryRouter>
        <AdminLibraryActivity />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Search library')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('Gone')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('empty result shows a message', () => {
    mockHook.mockReturnValue({ data: { items: [] }, isLoading: false, isError: false } as never);
    render(
      <MemoryRouter>
        <AdminLibraryActivity />
      </MemoryRouter>
    );
    expect(screen.getByText('No files found.')).toBeInTheDocument();
  });
});