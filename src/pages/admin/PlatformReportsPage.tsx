import ActivityHistoryTable from '@/components/admin-support/ActivityHistoryTable';
import PlatformStatsGrid from '@/components/admin-support/PlatformStatsGrid';
import TutorPerformanceTable from '@/components/admin-support/TutorPerformanceTable';
import { usePlatformHealth } from '@/hooks/useAdminReporting';

export default function PlatformReportsPage() {
  const { data: health, isLoading, isError } = usePlatformHealth();

  return (
    <div className="flex flex-col gap-space-lg p-6">
      <h1 className="text-l font-bold">Platform reports</h1>

      <section aria-label="Platform statistics">
        {isLoading && <p className="text-s text-muted-foreground">Loading statistics…</p>}
        {isError && (
          <p role="alert" className="text-s text-destructive">
            Could not load platform statistics.
          </p>
        )}
        {health && <PlatformStatsGrid health={health} />}
      </section>

      <TutorPerformanceTable />
      <ActivityHistoryTable />
    </div>
  );
}
