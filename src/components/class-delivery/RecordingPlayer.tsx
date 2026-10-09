import { useSignedUrl } from '@/hooks/useRecordings';
import EmptyState from '@/components/common/EmptyState';

interface Props {
  recordingId: string;
}

export default function RecordingPlayer({ recordingId }: Props) {
  const { data, isLoading, isError } = useSignedUrl(recordingId);

  if (isLoading) {
    return (
      <div
        data-testid="recording-skeleton"
        className="h-64 w-full animate-pulse rounded-md bg-accent/20"
      />
    );
  }

  if (isError || !data?.url) {
    return <EmptyState message="Recording no longer available" />;
  }

  return (
    <div className="w-full overflow-hidden rounded-md bg-black">
      <video src={data.url} controls className="h-auto w-full" />
    </div>
  );
}
