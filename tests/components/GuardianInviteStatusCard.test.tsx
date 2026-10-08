import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GuardianInviteStatusCard from '@/components/accounts/GuardianInviteStatusCard';
import type { ParentStudentRelationship } from '@/types';

const rel = (status: ParentStudentRelationship['status']): ParentStudentRelationship => ({
  id: 'r1',
  studentId: 's1',
  parentId: 'p1',
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('GuardianInviteStatusCard', () => {
  it('shows Resend only when status is INVITED', () => {
    const { rerender } = render(
      <GuardianInviteStatusCard relationship={rel('ACTIVE')} onResend={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'Resend' })).toBeNull();

    rerender(<GuardianInviteStatusCard relationship={rel('REVOKED')} onResend={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Resend' })).toBeNull();

    rerender(<GuardianInviteStatusCard relationship={rel('INVITED')} onResend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Resend' })).toBeInTheDocument();
  });

  it('calls onResend (the parent owns the mutation)', () => {
    const onResend = vi.fn();
    render(<GuardianInviteStatusCard relationship={rel('INVITED')} onResend={onResend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Resend' }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});
