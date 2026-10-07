import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCloseThread, useReviewThread } from '@/hooks/useAdminMessaging';

export default function MessageThreadReviewPage() {
  const { threadId = '' } = useParams();
  const [page, setPage] = useState(1);
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState('');
  const { data, isLoading, isError, error } = useReviewThread(threadId, page);
  const closeThread = useCloseThread();

  if (isLoading) return <p className="p-6">Loading conversation…</p>;
  if (isError || !data) {
    return (
      <p className="p-6">
        {error?.response?.status === 404
          ? 'Conversation not found.'
          : "We couldn't load this conversation. Please try again later."}
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const closed = data.status === 'CLOSED_BY_ADMIN';

  const handleConfirmClose = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    closeThread.mutate(
      { threadId, reason: trimmed },
      {
        onSuccess: () => {
          toast.success('Conversation closed.');
          setClosing(false);
          setReason('');
        },
        onError: () => toast.error('Could not close this conversation. Please try again.'),
      }
    );
  };

  return (
    <div className="flex flex-col gap-space-md p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-l font-bold">Conversation review</h1>
        <StatusBadge status={data.status} />
      </div>

      <ul role="log" className="flex flex-col gap-3">
        {data.messages.length === 0 && <li>No messages in this conversation.</li>}
        {data.messages.map((message) => (
          <li key={message.id} className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-s font-semibold">Sender {message.senderId.slice(0, 8)}</span>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <time className="text-s text-muted-foreground" dateTime={message.createdAt}>
              {new Date(message.createdAt).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {!closed &&
        (closing ? (
          <div className="flex max-w-md flex-col gap-2">
            <Label htmlFor="close-reason">Reason for closing</Label>
            <Textarea
              id="close-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={!reason.trim() || closeThread.isPending}
                onClick={handleConfirmClose}
              >
                Confirm close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setClosing(false);
                  setReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button variant="destructive" onClick={() => setClosing(true)}>
              Close conversation
            </Button>
          </div>
        ))}
    </div>
  );
}
