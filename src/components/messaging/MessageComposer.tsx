import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage } from '@/hooks/useMessaging';
import type { MessageThread } from '@/types';

const MAX_LENGTH = 2000;

interface MessageComposerProps {
  cohortId: string;
  threadStatus: MessageThread['status'];
}

const DISABLED_COPY: Partial<Record<MessageThread['status'], string>> = {
  CLOSED_BY_ADMIN: 'This conversation has been closed.',
  ARCHIVED: 'This conversation is archived.',
};

export default function MessageComposer({ cohortId, threadStatus }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useSendMessage(cohortId);

  const disabledCopy = DISABLED_COPY[threadStatus];
  const length = body.trim().length;
  const valid = length >= 1 && body.length <= MAX_LENGTH;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || disabledCopy || isPending) return;
    setError(null);
    mutate(body.trim(), {
      onSuccess: () => setBody(''),
      onError: (err) =>
        setError(
          err.response?.status === 403
            ? 'Messaging is no longer available for this conversation.'
            : 'Your message could not be sent. Please try again.'
        ),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {disabledCopy && <p role="status">{disabledCopy}</p>}
      <Textarea
        aria-label="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={!!disabledCopy}
        placeholder="Write a message…"
      />
      <div className="flex items-center justify-between gap-3">
        <span className={body.length > MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}>
          {body.length}/{MAX_LENGTH}
        </span>
        <Button type="submit" disabled={!!disabledCopy || !valid || isPending}>
          Send
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
