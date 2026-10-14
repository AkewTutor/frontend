import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnnouncementsPage from '@/pages/admin/AnnouncementsPage';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

const { mutate, useAnnouncementsMock, updateMutate, deleteMutate } = vi.hoisted(() => ({
  mutate: vi.fn(),
  useAnnouncementsMock: vi.fn(),
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
}));

vi.mock('@/hooks/useAdminAnnouncements', () => ({
  useAnnouncements: (...args: unknown[]) => useAnnouncementsMock(...args),
  useCreateAnnouncement: () => ({ mutate, isPending: false }),
  useUpdateAnnouncement: () => ({ mutate: updateMutate, isPending: false }),
  useDeleteAnnouncement: () => ({ mutate: deleteMutate, isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/announcements']}>
      <Routes>
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/" element={<p>landing page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function signIn(role: Role) {
  useAuthStore.setState({
    token: 't',
    user: { id: '1', email: 'a@b.co', phone: null, role },
  });
}

function mockList(total = 1) {
  useAnnouncementsMock.mockReturnValue({
    data: {
      announcements: [
        {
          id: 'a1',
          title: 'Maintenance',
          body: 'Down at 2am',
          audienceRoles: ['STUDENT'],
          createdAt: '2026-10-06T10:00:00.000Z',
        },
      ],
      page: 1,
      limit: 20,
      total,
    },
    isLoading: false,
    isError: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('AnnouncementsPage', () => {
  it('redirects a non-admin instead of rendering the composer', () => {
    signIn('STUDENT');
    renderPage();
    expect(screen.getByText('landing page')).toBeInTheDocument();
    expect(screen.queryByText('Send announcement')).toBeNull();
  });

  it('renders the history list for an admin', () => {
    signIn('ADMIN');
    renderPage();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('blocks submit when no audience role is selected', async () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Body text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));

    expect(await screen.findByText('Select at least one audience.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits title, body and selected roles', async () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Body text' } });
    fireEvent.click(screen.getByLabelText('STUDENT'));
    fireEvent.click(screen.getByLabelText('TUTOR'));
    fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0]).toEqual({
      title: 'Hello',
      body: 'Body text',
      audienceRoles: ['STUDENT', 'TUTOR'],
    });
  });

  it('requires title and message', async () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByLabelText('PARENT'));
    fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
  it('edits an announcement: prefilled fields, saves trimmed values', async () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Maintenance' }));
    expect(screen.getByLabelText('Edit title')).toHaveValue('Maintenance');
    expect(screen.getByLabelText('Edit message')).toHaveValue('Down at 2am');

    fireEvent.change(screen.getByLabelText('Edit title'), { target: { value: '  New title ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: 'a1',
      title: 'New title',
      body: 'Down at 2am',
    });
  });

  it('disables Save when the title or message is blank', () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Maintenance' }));
    fireEvent.change(screen.getByLabelText('Edit title'), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('cancels editing without saving', () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Maintenance' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Edit title')).not.toBeInTheDocument();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('asks for confirmation before deleting', () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Maintenance' }));
    expect(deleteMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(deleteMutate.mock.calls[0][0]).toBe('a1');
  });

  it('cancelling the delete confirmation deletes nothing', () => {
    signIn('ADMIN');
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Maintenance' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete Maintenance' })).toBeInTheDocument();
  });
});
