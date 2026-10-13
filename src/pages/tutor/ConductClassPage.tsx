import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSession, useProvideLink, useMarkCompleted } from '@/hooks/useSessions';
import { useUploadRecording } from '@/hooks/useRecordings';
import RecordingIndicatorBanner from '@/components/class-delivery/RecordingIndicatorBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConductClassPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading, isError } = useSession(sessionId || '');
  const { mutate: provideLink, isPending: providing } = useProvideLink();
  const { mutate: markComplete, isPending: completing } = useMarkCompleted();
  const { mutate: uploadRecording, isPending: uploading } = useUploadRecording();

  const [jitsiUrl, setJitsiUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (isError || !session) return <div>Error loading session</div>;

  const isStarted = now >= new Date(session.scheduledStart).getTime();
  const showBanner = isStarted && !['MISSING', 'ESCALATED'].includes(session.recordingStatus);
  const canComplete = now >= new Date(session.scheduledEnd).getTime();

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Conduct Class</h1>
      <RecordingIndicatorBanner visible={showBanner} />

      {!session.jitsiLinkUrl ? (
        <form
          className="flex max-w-sm flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (jitsiUrl && sessionId) provideLink({ sessionId, jitsiLinkUrl: jitsiUrl });
          }}
        >
          <div>
            <Label htmlFor="jitsiLink">Jitsi Link</Label>
            <Input
              id="jitsiLink"
              value={jitsiUrl}
              onChange={(e) => setJitsiUrl(e.target.value)}
              placeholder="https://meet.jit.si/..."
            />
          </div>
          <Button type="submit" disabled={providing || !jitsiUrl}>
            Generate & submit Jitsi link
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p>
            Link:{' '}
            <a
              href={session.jitsiLinkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {session.jitsiLinkUrl}
            </a>
          </p>
          <Button
            variant="secondary"
            className="w-fit"
            disabled={!canComplete || completing}
            onClick={() => sessionId && markComplete({ sessionId })}
          >
            Mark session completed
          </Button>
        </div>
      )}

      <div className="mt-8 max-w-sm border-t pt-4">
        <h3 className="mb-2 text-lg font-semibold">Manual Recording Upload</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (sessionId && file) uploadRecording({ sessionId, file });
          }}
          className="flex flex-col gap-2"
        >
          <Input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button type="submit" disabled={uploading || !file}>
            Upload
          </Button>
        </form>
      </div>
    </div>
  );
}
