import { Link } from 'react-router-dom';

import CountdownTimer from '@/components/common/CountdownTimer';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import GroupAssignmentCard from '@/components/matching/GroupAssignmentCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants';
import { useCohortMembers, useMyCohorts } from '@/hooks/useCohort';
import { useMyMatchRequests } from '@/hooks/useMatching';

const WAITING_STATUSES = ['FORMING', 'PENDING_APPROVAL'];

function formatLabel(format: string) {
  return format.replace(/_/g, ' ').toLowerCase();
}

function CohortMembers({ cohortId }: { cohortId: string }) {
  const { data, isLoading } = useCohortMembers(cohortId);
  if (isLoading) return <p>Loading group…</p>;
  const members = data?.members ?? [];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {members.map((member) => (
        <li key={member.id}>
          <GroupAssignmentCard member={member} />
        </li>
      ))}
    </ul>
  );
}

export default function GroupFormatStatusPage() {
  const cohortsQuery = useMyCohorts();
  const requestsQuery = useMyMatchRequests();

  if (cohortsQuery.isLoading || requestsQuery.isLoading) {
    return <p className="p-6">Loading…</p>;
  }
  if (cohortsQuery.isError || requestsQuery.isError) {
    return <p className="p-6">We couldn&apos;t load your group status. Please try again later.</p>;
  }

  const cohorts = cohortsQuery.data?.cohorts ?? [];
  const requests = requestsQuery.data?.requests ?? [];

  if (cohorts.length === 0 && requests.length === 0) {
    return (
      <div className="p-6">
        <EmptyState message="You have no match requests or groups yet." />
      </div>
    );
  }

  // Derived on every render (8-3 §3.6): no separate tab state, no refresh control.
  const activeTab = cohorts.some((c) => WAITING_STATUSES.includes(c.status))
    ? 'waiting'
    : 'assigned';

  const waitingCohorts = cohorts.filter((c) => WAITING_STATUSES.includes(c.status));
  const activeCohorts = cohorts.filter((c) => c.status === 'ACTIVE');
  const switchCohort = activeCohorts[0] ?? cohorts[0];

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Group status</h1>

      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="flex flex-col gap-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <span>Match request ({formatLabel(request.format)})</span>
                <StatusBadge status={request.status} />
              </CardContent>
            </Card>
          ))}
          {waitingCohorts.map((cohort) => (
            <Card key={cohort.cohortId}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span>Group ({formatLabel(cohort.format)})</span>
                  <StatusBadge status={cohort.status} />
                </div>
                {cohort.groupFormationWindowExpiresAt && (
                  <p className="text-s text-muted-foreground">
                    Group formation window closes in{' '}
                    <CountdownTimer targetIso={cohort.groupFormationWindowExpiresAt} />
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assigned" className="flex flex-col gap-4">
          {activeCohorts.length === 0 ? (
            <p>No active group yet.</p>
          ) : (
            activeCohorts.map((cohort) => (
              <section key={cohort.cohortId} className="flex flex-col gap-2">
                <h2 className="text-m font-semibold">Group ({formatLabel(cohort.format)})</h2>
                <CohortMembers cohortId={cohort.cohortId} />
              </section>
            ))
          )}
        </TabsContent>
      </Tabs>

      {switchCohort && (
        <div>
          <Button asChild variant="outline">
            <Link
              to={ROUTES.STUDENT_FORMAT_SWITCH}
              state={{ cohortId: switchCohort.cohortId, format: switchCohort.format }}
            >
              Request format switch
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
