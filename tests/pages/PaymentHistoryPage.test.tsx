import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentHistoryPage from '@/pages/PaymentHistoryPage';
import { formatMoney } from '@/lib/money';
import { useAuthStore } from '@/store/auth.store';
import type { ParentStudentRelationship, PaymentRecord, Role } from '@/types';

const mocks = vi.hoisted(() => ({ payments: vi.fn(), rels: vi.fn() }));

vi.mock('@/hooks/usePayments', () => ({
  useMyPayments: (page: number, id?: string) => mocks.payments(page, id),
}));
vi.mock('@/hooks/useGuardianship', () => ({ useMyRelationships: () => mocks.rels() }));

const payment: PaymentRecord = {
  id: 'pay1',
  amount: '350.00',
  status: 'SUCCESS',
  billingPeriodStart: '2026-09-01T00:00:00Z',
  billingPeriodEnd: '2026-09-30T23:59:59Z',
  createdAt: '2026-09-01T09:00:00Z',
};

const rel = (id: string, studentId: string): ParentStudentRelationship => ({
  id,
  studentId,
  parentId: 'p1',
  status: 'ACTIVE',
  createdAt: '2026-01-05T10:00:00.000Z',
});

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false });

function setup(
  role: Role,
  payments: PaymentRecord[] = [payment],
  relationships = [rel('r1', 's1')]
) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role } });
  mocks.payments.mockReturnValue(ok({ payments, page: 1, limit: 20, total: payments.length }));
  mocks.rels.mockReturnValue(ok({ relationships }));
  render(<PaymentHistoryPage />);
}

describe('PaymentHistoryPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a Student their own payments with the amount via formatMoney', () => {
    setup('STUDENT');
    expect(mocks.payments).toHaveBeenLastCalledWith(1, undefined);
    expect(screen.getByText(formatMoney('350.00'))).toBeInTheDocument();
  });

  it('scopes a Parent to the linked child', () => {
    setup('PARENT');
    expect(mocks.payments).toHaveBeenLastCalledWith(1, 's1');
  });

  it('shows the empty state when there is no history', () => {
    setup('STUDENT', []);
    expect(screen.getByText('No payments yet.')).toBeInTheDocument();
  });

  it('shows an error when payments cannot load', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role: 'STUDENT' } });
    mocks.payments.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PaymentHistoryPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load payments.');
  });
});
