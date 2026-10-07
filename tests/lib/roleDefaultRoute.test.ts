import { describe, it, expect } from 'vitest';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';
import { ROUTES } from '@/constants';
import type { Role } from '@/types';

describe('roleDefaultRoute', () => {
  it('maps STUDENT to STUDENT_HOME', () => {
    expect(roleDefaultRoute('STUDENT')).toBe(ROUTES.STUDENT_HOME);
  });

  it('maps PARENT to PARENT_HOME', () => {
    expect(roleDefaultRoute('PARENT')).toBe(ROUTES.PARENT_HOME);
  });

  it('maps TUTOR to TUTOR_HOME', () => {
    expect(roleDefaultRoute('TUTOR')).toBe(ROUTES.TUTOR_HOME);
  });

  it('maps ADMIN to ADMIN_HOME', () => {
    expect(roleDefaultRoute('ADMIN')).toBe(ROUTES.ADMIN_HOME);
  });

  it('unknown role throws', () => {
    expect(() => roleDefaultRoute('UNKNOWN' as Role)).toThrow('unknown role "UNKNOWN"');
  });
});
