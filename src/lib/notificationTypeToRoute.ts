import { ROUTES } from '@/constants';

const TYPE_ROUTES: Record<string, string> = {
  NEW_MESSAGE: ROUTES.MESSAGING,
  COMPLAINT_RESOLVED: ROUTES.COMPLAINTS,
};

export function notificationTypeToRoute(type: string): string {
  return TYPE_ROUTES[type] ?? ROUTES.NOTIFICATIONS;
}
