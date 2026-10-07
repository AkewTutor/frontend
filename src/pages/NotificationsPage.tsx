import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useMarkRead, useMyNotifications } from '@/hooks/useNotifications';

function labelFor(type: string): string {
  const text = type.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyNotifications(unreadOnly, page);
  const markRead = useMarkRead();

  const notifications = data?.notifications ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const toggleUnread = (checked: boolean) => {
    setUnreadOnly(checked);
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <label className="flex items-center gap-2 text-s">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => toggleUnread(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {isLoading && <p role="status">Loading notifications...</p>}
      {isError && <p role="alert">Could not load notifications.</p>}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState message="You have no notifications." />
      )}

      {notifications.length > 0 && (
        <ul className="divide-y rounded-md border">
          {notifications.map((n) => {
            const unread = n.readAt === null;
            const content = (
              <>
                <span className="block font-semibold">
                  {unread && (
                    <span className="mr-2 text-accent" aria-label="Unread">
                      ●
                    </span>
                  )}
                  {labelFor(n.type)}
                </span>
                <span className="block text-xs opacity-70">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </>
            );
            return (
              <li key={n.id} className="flex items-center justify-between gap-3 p-3">
                {unread ? (
                  <button
                    type="button"
                    data-testid={`row-${n.id}`}
                    onClick={() => markRead.mutate(n.id)}
                    className="flex-1 text-left"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex-1 opacity-70">{content}</div>
                )}
                {unread && (
                  <Button variant="secondary" size="sm" onClick={() => markRead.mutate(n.id)}>
                    Mark read
                  </Button>
                )}
              </li>
            );
          })}
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
    </section>
  );
}
