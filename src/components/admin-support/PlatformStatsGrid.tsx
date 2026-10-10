import type { PlatformHealth } from '@/types';

interface PlatformStatsGridProps {
  health: PlatformHealth;
}

export default function PlatformStatsGrid({ health }: PlatformStatsGridProps) {
  const stats = [
    { label: 'Open disputes', value: health.openDisputes },
    { label: 'Overdue match approvals', value: health.overdueMatchApprovals },
    { label: 'Recording compliance escalations', value: health.recordingComplianceEscalations },
    { label: 'Pending payout batches', value: health.pendingPayoutBatches },
  ];

  return (
    <div className="flex flex-col gap-space-sm">
      <ul className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <li key={label} className="rounded-m bg-white p-6 shadow-card">
            <p className="text-s text-muted-foreground">{label}</p>
            <p className="text-l font-bold text-primary">{value}</p>
          </li>
        ))}
      </ul>
      <p className="text-s text-muted-foreground">
        Last updated {new Date(health.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
