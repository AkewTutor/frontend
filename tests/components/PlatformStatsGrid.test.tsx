import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PlatformStatsGrid from '@/components/admin-support/PlatformStatsGrid';

const health = {
  openDisputes: 4,
  overdueMatchApprovals: 7,
  recordingComplianceEscalations: 3,
  pendingPayoutBatches: 9,
  generatedAt: '2026-09-06T15:00:00Z',
};

describe('PlatformStatsGrid', () => {
  it('renders all four headline stats with the right values', () => {
    render(<PlatformStatsGrid health={health} />);

    const cases: [string, string][] = [
      ['Open disputes', '4'],
      ['Overdue match approvals', '7'],
      ['Recording compliance escalations', '3'],
      ['Pending payout batches', '9'],
    ];
    for (const [label, value] of cases) {
      expect(screen.getByText(label).closest('li')).toHaveTextContent(value);
    }
  });

  it('shows a last-updated timestamp from generatedAt', () => {
    render(<PlatformStatsGrid health={health} />);

    expect(
      screen.getByText(`Last updated ${new Date(health.generatedAt).toLocaleString()}`)
    ).toBeInTheDocument();
  });

  it('reflects refreshed values on re-render', () => {
    const { rerender } = render(<PlatformStatsGrid health={health} />);
    rerender(
      <PlatformStatsGrid
        health={{ ...health, openDisputes: 5, generatedAt: '2026-09-06T15:01:00Z' }}
      />
    );

    expect(screen.getByText('Open disputes').closest('li')).toHaveTextContent('5');
    expect(
      screen.getByText(`Last updated ${new Date('2026-09-06T15:01:00Z').toLocaleString()}`)
    ).toBeInTheDocument();
  });
});
