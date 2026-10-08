import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GuardianSettingsPage from '@/pages/parent/GuardianSettingsPage';
import { useAuthStore } from '@/store/auth.store';
import type { ParentStudentRelationship, Role } from '@/types';

const mocks = vi.hoisted(() => ({
  rels: vi.fn(),
  resend: { mutate: vi.fn(), isPending: false },
  revoke: { mutate: vi.fn(), isPending: false },
  invite: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useGuardianship', () => ({
  useMyRelationships: () => mocks.rels(),
  useResendInvite: () => mocks.resend,
  useRevokeRelationship: () => mocks.revoke,
  useInviteGuardian: () => mocks.invite,
}));

const rel = (
  id: string,
  status: ParentStudentRelationship['status']
): ParentStudentRelationship => ({
  id,
  studentId: 's1',
  parentId: 'p1',
  status,
  createdAt: '2026-01-05T10:00:00.000Z',
});

function setup(role: Role, relationships: ParentStudentRelationship[]) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.rels.mockReturnValue({ data: { relationships }, isLoading: false, isError: false });
  render(
    <MemoryRouter>
      <GuardianSettingsPage />
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('GuardianSettingsPage', () => {
  it('parent mode lists a card per relationship and resends only INVITED', () => {
    setup('PARENT', [rel('r1', 'ACTIVE'), rel('r2', 'INVITED')]);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Invited')).toBeInTheDocument();
    const resend = screen.getAllByRole('button', { name: 'Resend' });
    expect(resend).toHaveLength(1);
    fireEvent.click(resend[0]);
    expect(mocks.resend.mutate.mock.calls[0][0]).toBe('r2');
  });

  it('revoke fires only after the dialog is confirmed', () => {
    setup('PARENT', [rel('r1', 'ACTIVE')]);
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mocks.revoke.mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm revoke' }));
    expect(mocks.revoke.mutate.mock.calls[0][0]).toBe('r1');
  });

  it('student mode shows the invite form, not revoke or resend', () => {
    setup('STUDENT', []);
    expect(screen.getByLabelText('Guardian email or phone')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revoke' })).toBeNull();
  });

  it('student mode shows an existing invite as status and warns before another', () => {
    setup('STUDENT', [rel('r1', 'INVITED')]);
    expect(screen.getByText('Invited')).toBeInTheDocument();
    expect(screen.getByText(/already have a guardian link/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend' })).toBeNull();
  });

  it('student mode sends the invite contact', () => {
    setup('STUDENT', []);
    fireEvent.change(screen.getByLabelText('Guardian email or phone'), {
      target: { value: 'g@b.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(mocks.invite.mutate.mock.calls[0][0]).toEqual({ inviteContact: 'g@b.co' });
  });
});
