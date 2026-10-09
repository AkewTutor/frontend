import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LibraryPage from '@/pages/LibraryPage';
import { useAuthStore } from '@/store/auth.store';
import { useMyCohorts } from '@/hooks/useCohort';
import { useMyRecordings } from '@/hooks/useRecordings';

vi.mock('@/hooks/useCohort', () => ({ useMyCohorts: vi.fn() }));
vi.mock('@/hooks/useRecordings', () => ({
  useMyRecordings: vi.fn(),
  useKeepPermanently: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));
vi.mock('@/hooks/useLibrary', () => ({
  useCohortMaterials: vi.fn(() => ({ data: { materials: [] }, isLoading: false })),
  useUploadMaterial: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));
vi.mock('@/components/class-delivery/RecordingPlayer', () => ({
  default: () => <div data-testid="recording-player" />,
}));

const mockUseMyCohorts = vi.mocked(useMyCohorts);
const mockUseMyRecordings = vi.mocked(useMyRecordings);

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyRecordings.mockReturnValue({
      data: { recordings: [] },
      isLoading: false,
    } as never);
  });

  it('no cohorts yet renders a prompt, not the recordings/materials sections', () => {
    useAuthStore.setState({ user: { role: 'STUDENT', id: 's1' } as never });
    mockUseMyCohorts.mockReturnValue({ data: { cohorts: [] }, isLoading: false } as never);
    render(<LibraryPage />);
    expect(screen.getByText(/check back once enrolled/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recordings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Materials/i)).not.toBeInTheDocument();
  });

  it('upload form gated on role === "TUTOR"', () => {
    mockUseMyCohorts.mockReturnValue({
      data: { cohorts: [{ cohortId: 'c1' }] },
      isLoading: false,
    } as never);

    useAuthStore.setState({ user: { role: 'STUDENT', id: 's1' } as never });
    const { unmount } = render(<LibraryPage />);
    expect(screen.queryByText(/Upload Material/i)).not.toBeInTheDocument();
    unmount();

    useAuthStore.setState({ user: { role: 'TUTOR', id: 't1' } as never });
    render(<LibraryPage />);
    expect(screen.getByText(/Upload Material/i)).toBeInTheDocument();
  });

  it('"Keep permanently" visible to any participant, not tutor-only', () => {
    mockUseMyCohorts.mockReturnValue({
      data: { cohorts: [{ cohortId: 'c1' }] },
      isLoading: false,
    } as never);
    useAuthStore.setState({ user: { role: 'STUDENT', id: 's1' } as never });
    mockUseMyRecordings.mockReturnValue({
      data: { recordings: [{ id: 'r1', cohortId: 'c1', keepPermanently: false }] },
      isLoading: false,
    } as never);

    render(<LibraryPage />);
    expect(screen.getByRole('button', { name: /Keep permanently/i })).toBeInTheDocument();
  });
});
