import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { usePublishPolicy } from '@/hooks/useAdminPolicies';
import { usePolicy } from '@/hooks/usePolicy';
import { useAuthStore } from '@/store/auth.store';
import type { PolicyType } from '@/types';

const POLICY_TYPES: PolicyType[] = ['PRIVACY', 'TERMS', 'SAFETY', 'REFUND', 'RULES'];

function PolicyEditor() {
  const [type, setType] = useState<PolicyType>('PRIVACY');
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, isError, error } = usePolicy(type);
  const publish = usePublishPolicy();
  const { register, reset, watch, getValues } = useForm<{ content: string }>({
    defaultValues: { content: '' },
  });

  const notPublished =
    isError && (error as { response?: { status?: number } } | null)?.response?.status === 404;
  const loadFailed = isError && !notPublished;
  const published = data?.content ?? '';
  const currentVersion = typeof data?.version === 'number' ? data.version : 0;
  const nextVersion = currentVersion + 1;
  const content = watch('content');

  // Pre-fill from the latest published text unless the admin has edited since the last sync.
  const lastPublished = useRef('');
  useEffect(() => {
    if (getValues('content') === lastPublished.current) reset({ content: published });
    lastPublished.current = published;
  }, [published, type, getValues, reset]);

  const canPublish = !isLoading && !loadFailed && content.trim() !== '' && content !== published;

  const onTypeChange = (next: PolicyType) => {
    if (content !== published && !window.confirm('Discard your unsaved edits?')) return;
    reset({ content: '' });
    lastPublished.current = '';
    setType(next);
  };

  const confirmPublish = () => {
    publish.mutate(
      { type, content },
      {
        onSuccess: (result) => {
          toast.success(`Published version ${result.version} of ${type}.`);
          reset({ content });
        },
        onError: () => toast.error('Could not publish. Your edits are kept.'),
      }
    );
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Policies</h1>

      <div>
        <label htmlFor="policy-type" className="block text-s font-semibold">
          Policy type
        </label>
        <select
          id="policy-type"
          value={type}
          onChange={(e) => onTypeChange(e.target.value as PolicyType)}
          className="mt-1 rounded-md border px-3 py-2"
        >
          {POLICY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p role="status">Loading current version...</p>}
      {loadFailed && <p role="alert">Could not load the current version.</p>}
      {notPublished && <p>Nothing published yet.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canPublish) setShowConfirm(true);
          }}
        >
          <div>
            <label htmlFor="policy-content" className="block text-s font-semibold">
              Content (markdown)
            </label>
            <textarea
              id="policy-content"
              rows={16}
              disabled={isLoading || loadFailed}
              className="mt-1 w-full rounded-md border px-3 py-2 font-mono"
              {...register('content')}
            />
          </div>
          <Button type="submit" disabled={!canPublish || publish.isPending}>
            Publish
          </Button>
        </form>

        <div>
          <h2 className="mb-2 text-l font-semibold">Preview</h2>
          <div className="prose dark:prose-invert max-w-none rounded-md border p-4">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish policy?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This publishes version ${nextVersion} of ${type}. Published versions are never edited or deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>Confirm publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default function PolicyManagementPage() {
  const role = useAuthStore((s) => s.user?.role);
  if (role !== 'ADMIN') return <Navigate to={ROUTES.LANDING} replace />;
  return <PolicyEditor />;
}
