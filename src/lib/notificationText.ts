import type { AppNotification } from '@/types';

function labelFor(type: string): string {
  const text = type.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Title and optional body for a notification; announcements carry both in `payload`. */
export function notificationText(n: Pick<AppNotification, 'type' | 'payload'>): {
  title: string;
  body: string | null;
} {
  const payload = n.payload ?? {};
  const title =
    typeof payload.title === 'string' && payload.title ? payload.title : labelFor(n.type);
  const body = typeof payload.body === 'string' && payload.body ? payload.body : null;
  return { title, body };
}
