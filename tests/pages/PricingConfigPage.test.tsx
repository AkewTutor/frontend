import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PricingConfigPage from '@/pages/admin/PricingConfigPage';
import type { FormatPricing } from '@/types';

const mocks = vi.hoisted(() => ({
  pricing: vi.fn(),
  update: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/usePricing', () => ({
  useActivePricing: () => mocks.pricing(),
  useUpdatePricing: () => mocks.update,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const pricing: FormatPricing[] = [
  {
    format: 'ONE_TO_ONE',
    pricePerStudentPerHour: '350.00',
    totalPerHour: '350.00',
    platformSharePerHour: '100.00',
    tutorSharePerHour: '250.00',
  },
  {
    format: 'ONE_TO_THREE',
    pricePerStudentPerHour: '150.00',
    totalPerHour: '450.00',
    platformSharePerHour: '150.00',
    tutorSharePerHour: '300.00',
  },
  {
    format: 'ONE_TO_FIVE',
    pricePerStudentPerHour: '100.00',
    totalPerHour: '500.00',
    platformSharePerHour: '175.00',
    tutorSharePerHour: '325.00',
  },
];

describe('PricingConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pricing.mockReturnValue({ data: { pricing }, isLoading: false, isError: false });
  });

  it('renders one form per format', () => {
    render(<PricingConfigPage />);
    expect(screen.getAllByRole('button', { name: 'Save' })).toHaveLength(3);
    expect(screen.getByText('One-to-one')).toBeInTheDocument();
  });

  it('saves a format with its key and the full body', () => {
    render(<PricingConfigPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]);
    expect(mocks.update.mutate).toHaveBeenCalledWith(
      {
        format: 'ONE_TO_ONE',
        pricePerStudentPerHour: '350.00',
        totalPerHour: '350.00',
        platformSharePerHour: '100.00',
        tutorSharePerHour: '250.00',
      },
      expect.any(Object)
    );
  });

  it('shows an error when pricing cannot load', () => {
    mocks.pricing.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PricingConfigPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load pricing.');
  });
});
