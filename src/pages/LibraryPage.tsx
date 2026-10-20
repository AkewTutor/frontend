import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useMyCohorts } from '@/hooks/useCohort';
import { useMyRecordings, useKeepPermanently } from '@/hooks/useRecordings';
import { useCohortMaterials, useDeleteMaterial } from '@/hooks/useLibrary';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
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
import { formatDate } from '@/utils';
import RecordingPlayer from '@/components/class-delivery/RecordingPlayer';
import MaterialUploadForm from '@/components/class-delivery/MaterialUploadForm';

const LINK_CLASS = 'rounded-md border px-3 py-1 text-sm hover:bg-accent';
const VIEWABLE_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

function extOf(url: string) {
  try {
    return new URL(url).pathname.split('.').pop()?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}

export default function LibraryPage() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'PARENT') {
    return <EmptyState message="Please select a child to view their library." />;
  }
  return <LibraryContent />;
}

function LibraryContent() {
  const user = useAuthStore((s) => s.user);

  const { data: cohortsData, isLoading: cohortsLoading } = useMyCohorts();
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  const studentId = user?.role === 'STUDENT' ? user.id : undefined;
  const { data: recordingsData, isLoading: recordingsLoading } = useMyRecordings({ studentId });

  const cohortId = selectedCohortId || (cohortsData?.cohorts[0]?.cohortId ?? null);

  const { data: materialsData, isLoading: materialsLoading } = useCohortMaterials(
    cohortId || undefined
  );
  const { mutate: keepPermanently, isPending: keeping } = useKeepPermanently();
  const { mutate: deleteMaterial, isPending: deleting } = useDeleteMaterial();

  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  if (cohortsLoading)
    return (
      <div className="p-4" data-testid="loading">
        Loading...
      </div>
    );

  if (!cohortsData?.cohorts.length) {
    return (
      <div className="p-4">
        <p>check back once enrolled</p>
      </div>
    );
  }

  const filteredRecordings = (recordingsData?.recordings || []).filter(
    (r) => r.cohortId === cohortId
  );
  const materials = materialsData?.materials || [];
  const videos = materials.filter((m) => m.fileType === 'VIDEO');
  const documents = materials.filter((m) => m.fileType !== 'VIDEO');
  const isTutor = user?.role === 'TUTOR';

  const confirmDelete = () => {
    if (!pendingDelete || !cohortId) return;
    deleteMaterial(
      { id: pendingDelete.id, cohortId },
      {
        onSuccess: () => toast.success('Deleted.'),
        onError: (err) =>
          toast.error(
            (err.response?.data as { message?: string } | undefined)?.message ??
              'Delete failed. Please try again.'
          ),
      }
    );
    setPendingDelete(null);
  };

  const deleteButton = (id: string, title: string) =>
    isTutor ? (
      <Button
        variant="secondary"
        disabled={deleting}
        onClick={() => setPendingDelete({ id, title })}
        className="text-red-600"
      >
        Delete
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Library</h1>

      <div className="flex gap-2 border-b pb-2">
        {cohortsData.cohorts.map((cohort, idx) => (
          <Button
            key={cohort.cohortId}
            variant={cohortId === cohort.cohortId ? 'primary' : 'ghost'}
            onClick={() => setSelectedCohortId(cohort.cohortId)}
          >
            Class {idx + 1}
          </Button>
        ))}
      </div>

      {isTutor && cohortId && <MaterialUploadForm cohortId={cohortId} />}

      {(recordingsLoading || filteredRecordings.length > 0) && (
        <div className="mt-4 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Recordings</h2>
          {recordingsLoading ? (
            <p>Loading recordings...</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredRecordings.map((rec) => (
                <li key={rec.id} className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <p className="font-semibold">
                      {rec.sessionNumber ? `Session ${rec.sessionNumber}` : 'Class recording'}
                      {rec.sessionStart ? ` - ${formatDate(rec.sessionStart)}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {rec.sessionId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setPlayingRecordingId(rec.id)}>Play</Button>
                    {!rec.keepPermanently && (
                      <Button
                        variant="secondary"
                        disabled={keeping}
                        onClick={() => keepPermanently(rec.id)}
                      >
                        Keep permanently
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Videos</h2>
        {materialsLoading ? (
          <p>Loading videos...</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isTutor
              ? 'No videos yet. Use the form above to add MP4, WebM or MOV files (up to 100 MB each). You can add as many as you like.'
              : 'No videos yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {videos.map((mat) => (
              <li key={mat.id} className="flex flex-col gap-2 rounded-md border p-4">
                <p className="font-semibold">{mat.title}</p>
                <video
                  controls
                  preload="metadata"
                  src={mat.fileUrl}
                  className="w-full max-w-2xl rounded-md bg-black"
                />
                <div className="flex items-center gap-2">
                  <a href={mat.downloadUrl ?? mat.fileUrl} className={LINK_CLASS}>
                    Download video
                  </a>
                  {deleteButton(mat.id, mat.title)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Materials</h2>
        {materialsLoading ? (
          <p>Loading materials...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((mat) => (
              <li
                key={mat.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-4"
              >
                <p className="font-semibold">
                  {mat.title} <StatusBadge status={mat.fileType} />
                </p>
                <div className="flex items-center gap-2">
                  {VIEWABLE_EXT.includes(extOf(mat.fileUrl)) && (
                    <a href={mat.fileUrl} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                      Open
                    </a>
                  )}
                  <a href={mat.downloadUrl ?? mat.fileUrl} className={LINK_CLASS}>
                    Download
                  </a>
                  {deleteButton(mat.id, mat.title)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {playingRecordingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-md bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Playback</h3>
              <Button variant="ghost" onClick={() => setPlayingRecordingId(null)}>
                Close
              </Button>
            </div>
            <RecordingPlayer recordingId={playingRecordingId} />
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? '"' + pendingDelete.title + '"' : ''} will be removed from the
              library and students will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}