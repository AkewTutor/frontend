import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import MessageComposer from '@/components/messaging/MessageComposer';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';
import { useMessages, useThread } from '@/hooks/useMessaging';
import { useAuthStore } from '@/store/auth.store';

const ROLE_LABEL = { STUDENT: 'Student', PARENT: 'Parent', TUTOR: 'Tutor' } as const;

export default function MessageThreadView({ cohortId }: { cohortId: string }) {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const thread = useThread(cohortId);
  const messages = useMessages(cohortId, page);

  const forbidden =
    thread.error?.response?.status === 403 || messages.error?.response?.status === 403;

  if (forbidden) {
    return (
      <EmptyState
        message="Messaging is not available for this class yet."
        action={{
          label: 'Back to dashboard',
          onClick: () => navigate(user ? roleDefaultRoute(user.role) : ROUTES.LANDING),
        }}
      />
    );
  }

  if (thread.isLoading || messages.isLoading) return <p className="p-6">Loading messages…</p>;
  if (thread.isError || messages.isError || !thread.data || !messages.data) {
    return <p className="p-6">We couldn&apos;t load this conversation. Please try again later.</p>;
  }

  const { format, status } = thread.data;
  // Same component for pair and group threads; this is the only branch (8-5).
  const showSender = format !== 'ONE_TO_ONE';
  const { total, limit } = messages.data;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-4">
      <ul role="log" className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
        {messages.data.messages.length === 0 && <li>No messages yet.</li>}
        {messages.data.messages.map((message) => {
          const mine = message.senderId === user?.id;
          return (
            <li
              key={message.id}
              className={`flex max-w-[80%] flex-col gap-1 rounded-lg border p-3 ${
                mine ? 'self-end bg-accent' : 'self-start'
              }`}
            >
              {showSender && (
                <span className="text-s font-semibold">
                  {mine ? 'You' : ROLE_LABEL[message.senderRole]}
                </span>
              )}
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <time className="text-s text-muted-foreground" dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString()}
              </time>
            </li>
          );
        })}
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

      <MessageComposer cohortId={cohortId} threadStatus={status} />
    </div>
  );
}
