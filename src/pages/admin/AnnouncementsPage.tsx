import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '@/hooks/useAdminAnnouncements';
import { useAuthStore } from '@/store/auth.store';
import type { Announcement, Role } from '@/types';

const ROLES: Role[] = ['STUDENT', 'PARENT', 'TUTOR'];

interface FormValues {
  title: string;
  body: string;
  audienceRoles: Role[];
}

function AnnouncementRow({ announcement: a }: { announcement: Announcement }) {
  const update = useUpdateAnnouncement();
  const remove = useDeleteAnnouncement();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [body, setBody] = useState(a.body ?? '');

  const startEdit = () => {
    setTitle(a.title);
    setBody(a.body ?? '');
    setConfirming(false);
    setEditing(true);
  };
  const canSave = title.trim() !== '' && body.trim() !== '';

  const save = () =>
    update.mutate(
      { id: a.id, title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          toast.success('Announcement updated.');
          setEditing(false);
        },
        onError: () => toast.error('Could not update the announcement.'),
      }
    );

  const confirmDelete = () =>
    remove.mutate(a.id, {
      onSuccess: () => toast.success('Announcement deleted.'),
      onError: () => {
        toast.error('Could not delete the announcement.');
        setConfirming(false);
      },
    });

  if (editing) {
    return (
      <li className="space-y-2 p-3">
        <div>
          <label htmlFor={`ann-edit-title-${a.id}`} className="block text-s font-semibold">
            Edit title
          </label>
          <input
            id={`ann-edit-title-${a.id}`}
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`ann-edit-body-${a.id}`} className="block text-s font-semibold">
            Edit message
          </label>
          <textarea
            id={`ann-edit-body-${a.id}`}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <p className="text-xs opacity-70">
          The audience can&apos;t be changed. Saving also updates the text in notifications users
          already received.
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled={!canSave || update.isPending} onClick={save}>
            Save changes
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="p-3">
      <span className="block font-semibold">{a.title}</span>
      {a.body && <span className="block text-s whitespace-pre-line">{a.body}</span>}
      <span className="block text-xs opacity-70">
        {a.audienceRoles.join(', ')} · {new Date(a.createdAt).toLocaleString()}
      </span>
      {confirming ? (
        <div className="mt-2 space-y-2">
          <p role="alert" className="text-s">
            Delete this announcement? It will also disappear from users&apos; notifications.
          </p>
          <div className="flex gap-2">
            <Button size="sm" disabled={remove.isPending} onClick={confirmDelete}>
              Confirm delete
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="secondary" aria-label={`Edit ${a.title}`} onClick={startEdit}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`Delete ${a.title}`}
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
        </div>
      )}
    </li>
  );
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
              <AnnouncementRow key={a.id} announcement={a} />
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
