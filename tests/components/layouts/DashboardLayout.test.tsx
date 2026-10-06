import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/store/auth.store';

vi.mock('@/components/common/NotificationBell', () => ({ default: () => null }));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/student']}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<p>child page</p>} />
        </Route>
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function signIn(role: string) {
  useAuthStore.setState({
    token: 't',
    user: { id: '1', email: 'a@b.co', role, createdAt: '' },
  });
}

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('DashboardLayout', () => {
  it('renders the sidebar for the user role and the child route', () => {
    signIn('STUDENT');
    renderLayout();
    expect(screen.getByRole('navigation', { name: 'Student navigation' })).toBeInTheDocument();
    expect(screen.getByText('child page')).toBeInTheDocument();
    expect(screen.getByText('a@b.co')).toBeInTheDocument();
  });

  it.each([
    ['PARENT', 'Parent navigation'],
    ['TUTOR', 'Tutor navigation'],
    ['ADMIN', 'Admin navigation'],
  ])('maps %s to its sidebar', (role, name) => {
    signIn(role);
    renderLayout();
    expect(screen.getByRole('navigation', { name })).toBeInTheDocument();
  });

  it('opens the mobile drawer and closes it on link click', () => {
    signIn('STUDENT');
    renderLayout();
    expect(screen.getAllByRole('navigation', { name: 'Student navigation' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('navigation', { name: 'Student navigation' })).toHaveLength(2);

    const drawerNav = screen.getAllByRole('navigation', { name: 'Student navigation' })[1];
    fireEvent.click(drawerNav.querySelector('a')!);
    expect(screen.getAllByRole('navigation', { name: 'Student navigation' })).toHaveLength(1);
  });

  it('closes the drawer with Escape', () => {
    signIn('STUDENT');
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getAllByRole('navigation', { name: 'Student navigation' })).toHaveLength(1);
  });

  it('logs out and goes to /login', () => {
    signIn('STUDENT');
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('throws in dev for a role with no sidebar', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    signIn('GHOST');
    expect(() => renderLayout()).toThrow(/no sidebar for role/);
    spy.mockRestore();
  });
});
