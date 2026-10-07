import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useMarkRead, useMyNotifications } from '@/hooks/useNotifications';
import { notificationTypeToRoute } from '@/lib/notificationTypeToRoute';
import { notificationText } from '@/lib/notificationText';

const MAX_ITEMS = 5;
const POLL_MS = 30_000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data } = useMyNotifications(true, 1, { refetchInterval: POLL_MS });
  const markRead = useMarkRead();

  const items = data?.notifications.slice(0, MAX_ITEMS) ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (id: string, type: string) => {
    markRead.mutate(id);
    navigate(notificationTypeToRoute(type));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-10 place-items-center text-white"
      >
        <FontAwesomeIcon icon={faBell} aria-hidden="true" />
        {total > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-pill bg-accent px-1 text-xs font-semibold text-dark"
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-md bg-white p-2 text-dark shadow-lg"
        >
          {items.length === 0 ? (
            <p className="px-3 py-2 text-s">No unread notifications</p>
          ) : (
            items.map((n) => {
              const { title, body } = notificationText(n);
              return (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(n.id, n.type)}
                  className="block w-full rounded px-3 py-2 text-left text-s hover:bg-black/5"
                >
                  <span className="block font-semibold">{title}</span>
                  {body && <span className="block text-xs line-clamp-2">{body}</span>}
                  <span className="block text-xs opacity-70">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              );
            })
          )}
          <Link
            to={ROUTES.NOTIFICATIONS}
            onClick={() => setOpen(false)}
            className="mt-1 block rounded px-3 py-2 text-center text-s font-semibold hover:bg-black/5"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
