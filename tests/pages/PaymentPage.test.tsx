import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentPage from '@/pages/PaymentPage';
import { formatMoney } from '@/lib/money';
import { useAuthStore } from '@/store/auth.store';

const mocks = vi.hoisted(() => ({
  cohorts: vi.fn(),
  pricing: vi.fn(),
  payments: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock('@/hooks/useCohort', () => ({ useMyCohorts: (id?: string) => mocks.cohorts(id) }));
vi.mock('@/hooks/usePricing', () => ({ useActivePricing: () => mocks.pricing() }));
vi.mock('@/hooks/usePayments', () => ({
  useMyPayments: () => mocks.payments(),
  useInitiatePayment: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isSuccess: false,
    error: null,
  }),
}));

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false });
const cohort = (membership: string, status: string) => ({
  cohortId: 'c1',
  cohortMembershipId: membership,
  format: 'ONE_TO_ONE',
  status: 'FORMING',
  targetGroupSize: 1,
  groupFormationWindowExpiresAt: null,
  membershipStatus: status,
});

function setup(cohorts: unknown[]) {
  useAuthStore.setState({ user: { id: 'u1', email: 'a@b.co', phone: null, role: 'STUDENT' } });
  mocks.cohorts.mockReturnValue(ok({ cohorts }));
  mocks.pricing.mockReturnValue(
    ok({ pricing: [{ format: 'ONE_TO_ONE', pricePerStudentPerHour: '120.00' }] })
  );
  mocks.payments.mockReturnValue(ok({ payments: [], page: 1, limit: 20, total: 0 }));
  render(<PaymentPage />);
}

describe('PaymentPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists only PENDING_PAYMENT cohorts with the price via formatMoney', () => {
    setup([cohort('m1', 'PENDING_PAYMENT'), cohort('m2', 'ACTIVE')]);
    expect(screen.getAllByRole('button', { name: /pay with chapa/i })).toHaveLength(1);
    expect(screen.getByText(`${formatMoney('120.00')} per hour`)).toBeInTheDocument();
  });

  it('initiates with cohortMembershipId and the promo code', () => {
    setup([cohort('m1', 'PENDING_PAYMENT')]);
    fireEvent.change(screen.getByLabelText(/promotion code/i), { target: { value: 'SAVE10' } });
    fireEvent.click(screen.getByRole('button', { name: /pay with chapa/i }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { cohortMembershipId: 'm1', promotionCode: 'SAVE10' },
      expect.any(Object)
    );
  });

  it('shows the empty state when nothing is due', () => {
    setup([cohort('m2', 'ACTIVE')]);
    expect(screen.getByText('Nothing to pay right now.')).toBeInTheDocument();
  });
});
