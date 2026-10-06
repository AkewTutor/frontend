import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import StudentSidebar from '@/components/common/StudentSidebar';
import ParentSidebar from '@/components/common/ParentSidebar';
import TutorSidebar from '@/components/common/TutorSidebar';
import AdminSidebar from '@/components/admin-support/AdminSidebar';
import { ADMIN_NAV, PARENT_NAV, STUDENT_NAV, TUTOR_NAV } from '@/components/common/navItems';
import { ROUTES } from '@/constants';

const cases = [
  ['Student', StudentSidebar, STUDENT_NAV, ROUTES.STUDENT_HOME],
  ['Parent', ParentSidebar, PARENT_NAV, ROUTES.PARENT_HOME],
  ['Tutor', TutorSidebar, TUTOR_NAV, ROUTES.TUTOR_HOME],
  ['Admin', AdminSidebar, ADMIN_NAV, ROUTES.ADMIN_HOME],
] as const;

describe('role sidebars', () => {
  it.each(cases)('%s sidebar renders every nav item', (_n, Sidebar, items, home) => {
    render(
      <MemoryRouter initialEntries={[home]}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('link')).toHaveLength(items.length);
  });

  it.each(cases)('%s sidebar marks only the current link active', (_n, Sidebar, _i, home) => {
    render(
      <MemoryRouter initialEntries={[home]}>
        <Sidebar />
      </MemoryRouter>
    );
    const active = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('Home');
  });

  it('nav links are unique per sidebar', () => {
    for (const items of [STUDENT_NAV, PARENT_NAV, TUTOR_NAV, ADMIN_NAV]) {
      const tos = items.map((i) => i.to);
      expect(new Set(tos).size).toBe(tos.length);
    }
  });
});
