import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionCard from '@/components/class-delivery/SessionCard';
import type { ScheduledSession } from '@/types';

const defaultSession: ScheduledSession = {
  id: 's1',
  cohortId: 'c1',
  scheduledStart: new Date(Date.now() + 86400000).toISOString(),
  scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
  jitsiLinkUrl: null,
  jitsiLinkSentAt: null,
  status: 'SCHEDULED',
  isMakeup: false,
  makeupForSessionId: null,
  recordingStatus: 'PENDING',
};

function renderCard(session: Partial<ScheduledSession>) {
  return render(
    <BrowserRouter>
      <SessionCard session={{ ...defaultSession, ...session }} />
    </BrowserRouter>
  );
}

describe('SessionCard', () => {
  it('"Join" disabled until jitsiLinkUrl is non-null', () => {
    renderCard({ jitsiLinkUrl: null });
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled();
  });

  it('"Join" enabled once a link exists, with no separate time-window check', () => {
    renderCard({
      jitsiLinkUrl: 'https://jitsi',
      scheduledStart: new Date(Date.now() + 864000000).toISOString(),
    });
    expect(screen.getByRole('button', { name: /join/i })).toBeEnabled();
  });

  it('"Request reschedule" link hidden once status is COMPLETED/MISSED', () => {
    const { unmount } = renderCard({ status: 'COMPLETED' });
    expect(screen.queryByText(/request reschedule/i)).not.toBeInTheDocument();
    unmount();

    const { unmount: u2 } = renderCard({ status: 'MISSED' });
    expect(screen.queryByText(/request reschedule/i)).not.toBeInTheDocument();
    u2();

    renderCard({ status: 'SCHEDULED' });
    expect(screen.getByText(/request reschedule/i)).toBeInTheDocument();
  });
});
