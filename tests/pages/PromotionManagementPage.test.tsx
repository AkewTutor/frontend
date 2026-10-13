import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromotionManagementPage from '@/pages/admin/PromotionManagementPage';
import { formatMoney } from '@/lib/money';
import type { ActivePromotion } from '@/types';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/usePromotions', () => ({
  useActivePromotions: () => mocks.list(),
  useCreatePromotion: () => mocks.create,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const percent: ActivePromotion = {
  code: 'BACKTOSCHOOL2026',
  discountType: 'PERCENT',
  discountValue: '10.00',
  validTo: '2026-09-30T23:59:59Z',
};
const fixed: ActivePromotion = {
  code: 'FLAT50',
  discountType: 'FIXED_ETB',
  discountValue: '50.00',
  validTo: '2026-09-30T23:59:59Z',
};

function setup(promotions: ActivePromotion[]) {
  mocks.list.mockReturnValue({ data: { promotions }, isLoading: false, isError: false });
  render(<PromotionManagementPage />);
}

describe('PromotionManagementPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists active codes with their discount', () => {
    setup([percent, fixed]);
    expect(screen.getByText('BACKTOSCHOOL2026')).toBeInTheDocument();
    expect(screen.getByText(/10\.00% off/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${formatMoney('50.00')} off`))).toBeInTheDocument();
  });

  it('shows the empty state when there are none', () => {
    setup([]);
    expect(screen.getByText('No active promotions.')).toBeInTheDocument();
  });

  it('creates a promotion through the form', () => {
    setup([]);
    fireEvent.click(screen.getByRole('button', { name: 'New promotion' }));
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'NEW10' } });
    fireEvent.change(screen.getByLabelText('Discount value'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Valid from'), {
      target: { value: '2026-10-01T00:00' },
    });
    fireEvent.change(screen.getByLabelText('Valid to'), { target: { value: '2026-10-31T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create promotion' }));
    expect(mocks.create.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NEW10', discountType: 'PERCENT', discountValue: '10' }),
      expect.any(Object)
    );
  });

  it('shows an error when promotions cannot load', () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PromotionManagementPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load promotions.');
  });
});
