import { useState } from 'react';
import { toast } from 'sonner';

import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import BadgeForm from '@/components/gamification/BadgeForm';
import XPAdjustmentForm from '@/components/gamification/XPAdjustmentForm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  useAdjustBadge,
  useAdjustStudentXP,
  useAllBadges,
  useCreateBadge,
} from '@/hooks/useAdminGamification';

type CategoryFilter = '' | 'STUDENT' | 'TUTOR';

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function BadgeManagementPage() {
  const [category, setCategory] = useState<CategoryFilter>('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [xpFormKey, setXpFormKey] = useState(0);

  const { data, isLoading, isError } = useAllBadges(category || undefined, page);
  const create = useCreateBadge();
  const adjust = useAdjustBadge();
  const adjustXp = useAdjustStudentXP();

  const renderList = () => {
    if (isLoading) return <p role="status">Loading badges…</p>;
    if (isError || !data || !Array.isArray(data.badges)) {
      return <p role="alert">Could not load badges.</p>;
    }
    if (data.badges.length === 0) return <EmptyState message="No badges found." />;

    const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

    return (
      <>
        <ul className="flex flex-col gap-2">
          {data.badges.map((badge) => (
            <li key={badge.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 rounded-m border border-border p-3">
                <div className="flex flex-col">
                  <span className="text-m font-semibold">{badge.name}</span>
                  <span className="text-s text-muted-foreground">
                    {badge.category} · {badge.criteriaDescription}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={badge.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit ${badge.name}`}
                    onClick={() => {
                      setShowCreate(false);
                      setEditingId(editingId === badge.id ? null : badge.id);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
              {editingId === badge.id && (
                <BadgeForm
                  mode="edit"
                  badge={badge}
                  isSubmitting={adjust.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(changes) =>
                    adjust.mutate(
                      { badgeId: badge.id, ...changes },
                      {
                        onSuccess: () => {
                          toast.success('Badge updated.');
                          setEditingId(null);
                        },
                        onError: (error) =>
                          toast.error(apiMessage(error, 'Could not update the badge.')),
                      }
                    )
                  }
                />
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-s text-muted-foreground">
            Page {data.page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-lg p-6">
      <section className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-l font-bold">Badges</h1>
          <Button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowCreate((v) => !v);
            }}
          >
            Create badge
          </Button>
        </div>

        {showCreate && (
          <BadgeForm
            mode="create"
            isSubmitting={create.isPending}
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) =>
              create.mutate(values, {
                onSuccess: () => {
                  toast.success('Badge created.');
                  setShowCreate(false);
                },
                onError: (error) => toast.error(apiMessage(error, 'Could not create the badge.')),
              })
            }
          />
        )}

        <div className="flex items-center gap-2">
          <Label htmlFor="badge-filter">Filter by category</Label>
          <select
            id="badge-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CategoryFilter);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            <option value="STUDENT">Student</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </div>

        {renderList()}
      </section>

      <section className="flex flex-col gap-space-md">
        <h2 className="text-m font-semibold">Adjust student XP</h2>
        <XPAdjustmentForm
          key={xpFormKey}
          isSubmitting={adjustXp.isPending}
          onSubmit={(values) =>
            adjustXp.mutate(values, {
              onSuccess: () => {
                toast.success('XP adjusted.');
                setXpFormKey((k) => k + 1);
              },
              onError: (error) => toast.error(apiMessage(error, 'Could not adjust XP.')),
            })
          }
        />
      </section>
    </div>
  );
}
