import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMyCohorts } from '@/hooks/useCohort';
import { useMyRecordings, useKeepPermanently } from '@/hooks/useRecordings';
import { useCohortMaterials } from '@/hooks/useLibrary';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import RecordingPlayer from '@/components/class-delivery/RecordingPlayer';
import MaterialUploadForm from '@/components/class-delivery/MaterialUploadForm';

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

  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

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

      {user?.role === 'TUTOR' && cohortId && <MaterialUploadForm cohortId={cohortId} />}

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Recordings</h2>
        {recordingsLoading ? (
          <p>Loading recordings...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredRecordings.map((rec) => (
              <li key={rec.id} className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-semibold">Recording for Session {rec.sessionId}</p>
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

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Materials</h2>
        {materialsLoading ? (
          <p>Loading materials...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(materialsData?.materials || []).map((mat) => (
              <li key={mat.id} className="flex items-center justify-between rounded-md border p-4">
                <p className="font-semibold">
                  {mat.title} <StatusBadge status={mat.fileType} />
                </p>
                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Download
                </a>
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
    </div>
  );
}
