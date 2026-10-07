import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import PublicRoute from '@/routes/PublicRoute';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import type { AuthUser } from '@/types';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function TestSetup({
  initialEntry,
  children,
}: {
  initialEntry: string;
  children: React.ReactNode;
}) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={children}>
          <Route path={initialEntry} element={<div data-testid="public-content" />} />
        </Route>
        <Route path={ROUTES.TUTOR_HOME} element={<LocationDisplay />} />
        <Route path={ROUTES.STUDENT_HOME} element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, refreshToken: null, user: null });
  });

  it('No session — renders the public/auth page', () => {
    useAuthStore.setState({ token: null, user: null });
    render(
      <TestSetup initialEntry={ROUTES.LOGIN}>
        <PublicRoute />
      </TestSetup>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
  });

  it('Already authenticated — redirects away', () => {
    useAuthStore.setState({ token: 'x', user: { role: 'TUTOR' } as AuthUser });
    render(
      <TestSetup initialEntry={ROUTES.LOGIN}>
        <PublicRoute />
      </TestSetup>
    );

    expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.TUTOR_HOME);
    expect(screen.queryByTestId('public-content')).toBeNull();
  });

  it('token present but user null -> renders Outlet (not a redirect)', () => {
    useAuthStore.setState({ token: 'x', user: null });
    render(
      <TestSetup initialEntry={ROUTES.LOGIN}>
        <PublicRoute />
      </TestSetup>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
  });
});
