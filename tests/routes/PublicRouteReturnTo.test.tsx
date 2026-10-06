import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import PublicRoute from '@/routes/PublicRoute';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import type { AuthUser } from '@/types';

function Loc() {
  const l = useLocation();
  return <div data-testid="location">{l.pathname + l.search}</div>;
}

function setup(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<div data-testid="public-content" />} />
        </Route>
        <Route path="/student/profile" element={<Loc />} />
        <Route path={ROUTES.STUDENT_HOME} element={<Loc />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicRoute returnTo', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'x', refreshToken: 'r', user: { role: 'STUDENT' } as AuthUser });
  });

  it('authenticated with a safe returnTo — redirects to it, not the role home', () => {
    setup(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent('/student/profile?filter=1')}`);
    expect(screen.getByTestId('location')).toHaveTextContent('/student/profile?filter=1');
  });

  it.each(['//evil.com', 'https://evil.com', '/\\evil'])(
    'authenticated with unsafe returnTo %s — falls back to the role home',
    (bad) => {
      setup(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(bad)}`);
      expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.STUDENT_HOME);
    }
  );
});
