import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useActiveChallenges, useCreateChallenge } from '@/hooks/useChallenges';
import type { Challenge } from '@/types';

interface ChallengeFormValues {
  title: string;
  description: string;
  period: 'WEEKLY' | 'MONTHLY';
  startsAt: string;
  endsAt: string;
  targetValue: number;
}

const DEFAULTS: ChallengeFormValues = {
  title: '',
  description: '',
  period: 'WEEKLY',
  startsAt: '',
  endsAt: '',
  targetValue: 1,
};

function apiMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } } };
  return e.response?.data?.message ?? fallback;
}

export default function ChallengeManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [sessionCreated, setSessionCreated] = useState<Challenge[]>([]);
  const { data, isLoading, isError } = useActiveChallenges();
  const create = useCreateChallenge();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChallengeFormValues>({ defaultValues: DEFAULTS });

  const onSubmit = (values: ChallengeFormValues) => {
    create.mutate(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        period: values.period,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        targetValue: values.targetValue,
      },
      {
        onSuccess: (created) => {
          toast.success('Challenge created.');
          setSessionCreated((prev) => [created, ...prev]);
          reset(DEFAULTS);
          setShowForm(false);
        },
        onError: (error) => toast.error(apiMessage(error, 'Could not create the challenge.')),
      }
    );
  };

  const renderList = () => {
    if (isLoading) return <p role="status">Loading challenges…</p>;

    const loaded = !isError && data ? data.challenges : null;
    const items = loaded ?? sessionCreated;

    return (
      <>
        {loaded === null && (
          <p role="alert" className="text-s text-muted-foreground">
            Could not load the full list. Showing challenges created in this session only.
          </p>
        )}
        {items.length === 0 ? (
          <EmptyState message="No active challenges." />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 rounded-m border border-border p-3">
                <span className="text-m font-semibold">{c.title}</span>
                <span className="text-s text-muted-foreground">
                  {c.period === 'WEEKLY' ? 'Weekly' : 'Monthly'} ·{' '}
                  {new Date(c.startsAt).toLocaleDateString()} –{' '}
                  {new Date(c.endsAt).toLocaleDateString()} · target {c.targetValue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-md p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-l font-bold">Challenges</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          Create challenge
        </Button>
      </div>

      {showForm && (
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-m border border-border p-4"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-title">Title</Label>
            <Input
              id="ch-title"
              {...register('title', {
                validate: (v) => v.trim() !== '' || 'Title is required.',
              })}
            />
            {errors.title && (
              <p role="alert" className="text-s text-danger">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-description">Description</Label>
            <Textarea
              id="ch-description"
              {...register('description', {
                validate: (v) => v.trim() !== '' || 'Description is required.',
              })}
            />
            {errors.description && (
              <p role="alert" className="text-s text-danger">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-period">Period</Label>
            <select
              id="ch-period"
              {...register('period')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-starts">Starts at</Label>
            <Input
              id="ch-starts"
              type="datetime-local"
              {...register('startsAt', { required: 'Start time is required.' })}
            />
            {errors.startsAt && (
              <p role="alert" className="text-s text-danger">
                {errors.startsAt.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-ends">Ends at</Label>
            <Input
              id="ch-ends"
              type="datetime-local"
              {...register('endsAt', {
                required: 'End time is required.',
                validate: (v, all) =>
                  !all.startsAt ||
                  new Date(v) > new Date(all.startsAt) ||
                  'End time must be after start time.',
              })}
            />
            {errors.endsAt && (
              <p role="alert" className="text-s text-danger">
                {errors.endsAt.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ch-target">Target value</Label>
            <Input
              id="ch-target"
              type="number"
              step={1}
              {...register('targetValue', {
                valueAsNumber: true,
                validate: (v) =>
                  (Number.isInteger(v) && v > 0) || 'Target must be a whole number above 0.',
              })}
            />
            {errors.targetValue && (
              <p role="alert" className="text-s text-danger">
                {errors.targetValue.message}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending}>
              Save challenge
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {renderList()}
    </div>
  );
}
