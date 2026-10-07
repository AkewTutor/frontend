import { ROUTES } from '@/constants';
import type { Role } from '@/types';

/** Single source of truth for where each role lands (doc 8-1). Throws on an unknown role. */
export function roleDefaultRoute(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return ROUTES.STUDENT_HOME;
    case 'PARENT':
      return ROUTES.PARENT_HOME;
    case 'TUTOR':
      return ROUTES.TUTOR_HOME;
    case 'ADMIN':
      return ROUTES.ADMIN_HOME;
    default:
      throw new Error(`roleDefaultRoute: unknown role "${String(role)}"`);
  }
}
