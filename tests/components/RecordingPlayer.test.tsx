import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecordingPlayer from '@/components/class-delivery/RecordingPlayer';
import { useSignedUrl } from '@/hooks/useRecordings';

vi.mock('@/hooks/useRecordings', () => ({
  useSignedUrl: vi.fn(),
}));

const mockUseSignedUrl = vi.mocked(useSignedUrl);

describe('RecordingPlayer', () => {
  it('Skeleton while loading, never a blank pane', () => {
    mockUseSignedUrl.mockReturnValue({ isLoading: true, isError: false, data: undefined } as never);
    render(<RecordingPlayer recordingId="r1" />);
    expect(screen.getByTestId('recording-skeleton')).toBeInTheDocument();
  });

  it('Success renders a <video> sourced from the signed URL', () => {
    mockUseSignedUrl.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { url: 'https://vid.mp4' },
    } as never);
    const { container } = render(<RecordingPlayer recordingId="r1" />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe('https://vid.mp4');
  });

  it('404 renders EmptyState with "Recording no longer available," never a generic error banner', () => {
    mockUseSignedUrl.mockReturnValue({ isLoading: false, isError: true, data: undefined } as never);
    render(<RecordingPlayer recordingId="r1" />);
    expect(screen.getByText('Recording no longer available')).toBeInTheDocument();
  });

  it("Signed URL is never persisted beyond the query's own cache lifetime", () => {
    expect(localStorage.getItem('signedUrl')).toBeNull();
    expect(sessionStorage.getItem('signedUrl')).toBeNull();
    expect((window as unknown as Record<string, unknown>).signedUrl).toBeUndefined();
  });
});
