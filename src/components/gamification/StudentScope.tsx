import { useState, type ReactNode } from 'react';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';

import EmptyState from '@/components/common/EmptyState';
import { Label } from '@/components/ui/label';
import { useMyRelationships } from '@/hooks/useGuardianship';
import { useAuthStore } from '@/store/auth.store';

type Render = (studentId: string | undefined) => ReactNode;

// Student: render with no studentId (server resolves self). Parent: resolve an ACTIVE child first,
// so no gamification request fires until a studentId exists. Options come only from the caller's own relationships.
export default function StudentScope({ children }: { children: Render }) {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'PARENT') return <ParentScope>{children}</ParentScope>;
  return <>{children(undefined)}</>;
}

function ParentScope({ children }: { children: Render }) {
  const { data, isLoading, isError } = useMyRelationships();
  const [picked, setPicked] = useState<string>();

  if (isLoading) return <p role="status">Loading…</p>;
  if (isError) return <p role="alert">Could not load your linked students.</p>;

  const active = (data?.relationships ?? []).filter((r) => r.status === 'ACTIVE');
  if (active.length === 0) {
    return <EmptyState icon={faUserGroup} message="No linked students yet." />;
  }

  const selected = active.find((r) => r.studentId === picked)?.studentId ?? active[0].studentId;

  return (
    <div className="flex flex-col gap-space-md">
      {active.length > 1 && (
        <div className="flex items-center gap-2">
          <Label htmlFor="student-select">Student</Label>
          <select
            id="student-select"
            value={selected}
            onChange={(e) => setPicked(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {active.map((r, i) => (
              <option key={r.id} value={r.studentId}>
                {`Student ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      {children(selected)}
    </div>
  );
}
