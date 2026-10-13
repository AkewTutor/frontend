import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConductClassPage from '@/pages/tutor/ConductClassPage';
import { useSession } from '@/hooks/useSessions';

vi.mock('@/hooks/useSessions', () => ({
  useSession: vi.fn(),
  useProvideLink: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkCompleted: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useRecordings', () => ({
  useUploadRecording: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useRecordingConsent', () => ({
  useConsentStatus: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tutor/conduct-class/s1']}>
      <Routes>
        <Route path="/tutor/conduct-class/:sessionId" element={<ConductClassPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ConductClassPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('link-submission form shown only when jitsiLinkUrl is null', () => {
    mockUseSession.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        jitsiLinkUrl: null,
        scheduledStart: new Date(Date.now() - 10000).toISOString(),
        recordingStatus: 'PENDING',
      },
    } as never);
    const { unmount } = renderPage();
    expect(
      screen.getByRole('button', { name: /Generate & submit Jitsi link/i })
    ).toBeInTheDocument();
    unmount();

    mockUseSession.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        jitsiLinkUrl: 'https://jitsi',
        scheduledStart: new Date(Date.now() - 10000).toISOString(),
        recordingStatus: 'PENDING',
      },
    } as never);
    renderPage();
    expect(screen.getByRole('button', { name: /Mark session completed/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Generate & submit Jitsi link/i })
    ).not.toBeInTheDocument();
  });

  it('"Mark completed" disabled until scheduledEnd has passed', () => {
    mockUseSession.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        jitsiLinkUrl: 'https://jitsi',
        scheduledStart: new Date(Date.now() - 10000).toISOString(),
        scheduledEnd: new Date(Date.now() + 10000).toISOString(),
        recordingStatus: 'PENDING',
      },
    } as never);
    renderPage();
    expect(screen.getByRole('button', { name: /Mark session completed/i })).toBeDisabled();
  });

  it('RecordingIndicatorBanner visibility cross-references consent status (deviation: driven by session start + recordingStatus, no useConsentStatus)', () => {
    const past = new Date(Date.now() - 10000).toISOString();
    const future = new Date(Date.now() + 100000).toISOString();
    const cases = [
      { scheduledStart: past, recordingStatus: 'PENDING', visible: true },
      { scheduledStart: past, recordingStatus: 'MISSING', visible: false },
      { scheduledStart: past, recordingStatus: 'ESCALATED', visible: false },
      { scheduledStart: future, recordingStatus: 'PENDING', visible: false },
    ];
    for (const c of cases) {
      mockUseSession.mockReturnValue({
        isLoading: false,
        isError: false,
        data: {
          jitsiLinkUrl: 'https://jitsi',
          scheduledEnd: new Date(Date.now() + 200000).toISOString(),
          scheduledStart: c.scheduledStart,
          recordingStatus: c.recordingStatus,
        },
      } as never);
      const { unmount } = renderPage();
      expect(screen.queryByText(/This session is being recorded/i) !== null).toBe(c.visible);
      unmount();
    }
  });
});
