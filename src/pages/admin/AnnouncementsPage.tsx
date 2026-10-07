import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useAdminAnnouncements';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

const ROLES: Role[] = ['STUDENT', 'PARENT', 'TUTOR', 'ADMIN'];

interface FormValues {
  title: string;
  body: string;
  audienceRoles: Role[];
}

export default function AnnouncementsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAnnouncements(page);
  const create = useCreateAnnouncement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { title: '', body: '', audienceRoles: [] } });

  useEffect(() => {
    register('audienceRoles', {
      validate: (v) => (v && v.length > 0) || 'Select at least one audience.',
    });
  }, [register]);

  if (role !== 'ADMIN') return <Navigate to={ROUTES.LANDING} replace />;

  const selected = watch('audienceRoles');
  const toggleRole = (r: Role, checked: boolean) => {
    const next = checked ? [...selected, r] : selected.filter((x) => x !== r);
    setValue('audienceRoles', next, { shouldValidate: true });
  };

  const onSubmit = (values: FormValues) => {
    create.mutate(values, { onSuccess: () => reset() });
  };

  const announcements = data?.announcements ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <section className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Announcements</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ann-title" className="block text-s font-semibold">
              Title
            </label>
            <input
              id="ann-title"
              className="mt-1 w-full rounded-md border px-3 py-2"
              {...register('title', { required: 'Title is required.' })}
            />
            {errors.title && (
              <p role="alert" className="text-xs text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ann-body" className="block text-s font-semibold">
              Message
            </label>
            <textarea
              id="ann-body"
              rows={4}
              className="mt-1 w-full rounded-md border px-3 py-2"
              {...register('body', { required: 'Message is required.' })}
            />
            {errors.body && (
              <p role="alert" className="text-xs text-red-600">
                {errors.body.message}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="text-s font-semibold">Audience</legend>
            <div className="mt-1 flex flex-wrap gap-4">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-s">
                  <input
                    type="checkbox"
                    checked={selected.includes(r)}
                    onChange={(e) => toggleRole(r, e.target.checked)}
                  />
                  {r}
                </label>
              ))}
            </div>
            {errors.audienceRoles && (
              <p role="alert" className="text-xs text-red-600">
                {errors.audienceRoles.message}
              </p>
            )}
          </fieldset>

          <Button type="submit" disabled={create.isPending}>
            Send announcement
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-l font-semibold">History</h2>
        {isLoading && <p role="status">Loading announcements...</p>}
        {isError && <p role="alert">Could not load announcements.</p>}
        {!isLoading && !isError && announcements.length === 0 && (
          <EmptyState message="No announcements yet." />
        )}
        {announcements.length > 0 && (
          <ul className="divide-y rounded-md border">
            {announcements.map((a) => (
              <li key={a.id} className="p-3">
                <span className="block font-semibold">{a.title}</span>
                {a.body && <span className="block text-s whitespace-pre-line">{a.body}</span>}
                <span className="block text-xs opacity-70">
                  {a.audienceRoles.join(', ')} · {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-s">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
