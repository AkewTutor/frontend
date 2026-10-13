import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RecordingConsentPage from '@/pages/RecordingConsentPage';
import { useConsentStatus, useAcknowledgeConsent } from '@/hooks/useRecordingConsent';

vi.mock('@/hooks/useRecordingConsent', () => ({
  useConsentStatus: vi.fn(),
  useAcknowledgeConsent: vi.fn(),
}));

const mockUseConsentStatus = vi.mocked(useConsentStatus);
const mockUseAcknowledgeConsent = vi.mocked(useAcknowledgeConsent);

function renderPage(search = '?tutorId=t1&studentId=s1') {
  return render(
    <MemoryRouter initialEntries={[`/recording-consent${search}`]}>
      <Routes>
        <Route path="/recording-consent" element={<RecordingConsentPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RecordingConsentPage', () => {
  beforeEach(() => {
    mockUseAcknowledgeConsent.mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  });

  it('acknowledged renders confirmation with timestamp', () => {
    mockUseConsentStatus.mockReturnValue({
      isLoading: false,
      data: { consentComplete: true, tutorAcknowledgedAt: '2026-10-08T10:00:00Z' },
    } as never);
    renderPage();
    expect(screen.getByText(/Acknowledged at:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Acknowledge/i })).not.toBeInTheDocument();
  });

  it('not acknowledged renders the action', () => {
    mockUseConsentStatus.mockReturnValue({
      isLoading: false,
      data: { consentComplete: false },
    } as never);
    renderPage();
    expect(screen.getByRole('button', { name: /Acknowledge/i })).toBeInTheDocument();
  });
});
