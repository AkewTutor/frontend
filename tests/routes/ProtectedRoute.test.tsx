import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import type { AuthUser } from '@/types';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
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
          <Route
            path={initialEntry.split('?')[0]}
            element={<div data-testid="protected-content" />}
          />
        </Route>
        <Route path={ROUTES.LOGIN} element={<LocationDisplay />} />
        <Route path={ROUTES.TUTOR_HOME} element={<LocationDisplay />} />
        <Route path={ROUTES.STUDENT_HOME} element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, refreshToken: null, user: null });
  });

  it('No session — redirects to login', () => {
    useAuthStore.setState({ token: null, user: null });
    const targetPath = '/student/profile?filter=1';
    render(
      <TestSetup initialEntry={targetPath}>
        <ProtectedRoute roles={['STUDENT']} />
      </TestSetup>
    );

    const expectedReturnTo = encodeURIComponent(targetPath);
    expect(screen.getByTestId('location')).toHaveTextContent(
      `${ROUTES.LOGIN}?returnTo=${expectedReturnTo}`
    );
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it('Valid session, role in allow-list', () => {
    useAuthStore.setState({ token: 'x', user: { role: 'STUDENT' } as AuthUser });
    render(
      <TestSetup initialEntry="/student/profile">
        <ProtectedRoute roles={['STUDENT']} />
      </TestSetup>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('Valid session, role NOT in allow-list', () => {
    useAuthStore.setState({ token: 'x', user: { role: 'TUTOR' } as AuthUser });
    render(
      <TestSetup initialEntry="/student/profile">
        <ProtectedRoute roles={['STUDENT']} />
      </TestSetup>
    );

    // Should redirect to TUTOR_HOME
    expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.TUTOR_HOME);
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });

  it("roles: 'any' — any authenticated role passes", () => {
    useAuthStore.setState({ token: 'x', user: { role: 'PARENT' } as AuthUser });
    render(
      <TestSetup initialEntry="/notifications">
        <ProtectedRoute roles="any" />
      </TestSetup>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('Malformed/partial store state (token present, user null)', () => {
    useAuthStore.setState({ token: 'x', user: null });
    const targetPath = '/student/profile';
    render(
      <TestSetup initialEntry={targetPath}>
        <ProtectedRoute roles={['STUDENT']} />
      </TestSetup>
    );

    const expectedReturnTo = encodeURIComponent(targetPath);
    expect(screen.getByTestId('location')).toHaveTextContent(
      `${ROUTES.LOGIN}?returnTo=${expectedReturnTo}`
    );
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });
});
