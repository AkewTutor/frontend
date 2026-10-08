import { useState } from 'react';
import { toast } from 'sonner';

import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSubject, useSetSubjectActive, useSubjects } from '@/hooks/useSubjects';

function createErrorMessage(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { message?: string } } };
  if (e.response?.status === 409) {
    return e.response.data?.message ?? 'A subject with this name already exists';
  }
  return 'Could not create the subject. Please try again.';
}

export default function SubjectManagementPage() {
  const { data, isLoading, isError } = useSubjects({ includeInactive: true });
  const create = useCreateSubject();
  const setActive = useSetSubjectActive();
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (isLoading) return <p className="p-6">Loading subjects…</p>;
  if (isError || !data) {
    return <p className="p-6">We couldn&apos;t load subjects. Please try again later.</p>;
  }

  const trimmed = newName.trim();

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    create.mutate(trimmed, {
      onSuccess: () => {
        setNewName('');
        setCreateError(null);
      },
      onError: (error) => setCreateError(createErrorMessage(error)),
    });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Subjects</h1>

      <form onSubmit={onCreate} className="flex flex-col gap-2">
        <Label htmlFor="newSubject">New subject</Label>
        <div className="flex gap-3">
          <Input
            id="newSubject"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setCreateError(null);
            }}
          />
          <Button type="submit" disabled={!trimmed || create.isPending}>
            Add subject
          </Button>
        </div>
        {createError && (
          <p role="alert" className="text-s text-destructive">
            {createError}
          </p>
        )}
      </form>

      {data.subjects.length === 0 ? (
        <EmptyState message="No subjects yet" />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.subjects.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-m border border-border p-3"
            >
              <span className="text-m">{s.name}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pendingId === s.id}
                  onClick={() => {
                    setPendingId(s.id);
                    setActive.mutate(
                      { id: s.id, isActive: !s.isActive },
                      {
                        onError: () => toast.error('Could not update this subject.'),
                        onSettled: () => setPendingId(null),
                      }
                    );
                  }}
                >
                  {s.isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
