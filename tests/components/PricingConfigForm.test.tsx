import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PricingConfigForm from '@/components/admin-payments/PricingConfigForm';
import type { FormatPricing } from '@/types';

const three: FormatPricing = {
  format: 'ONE_TO_THREE',
  pricePerStudentPerHour: '150.00',
  totalPerHour: '450.00',
  platformSharePerHour: '150.00',
  tutorSharePerHour: '300.00',
};

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('PricingConfigForm', () => {
  const onSave = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('uses raw text inputs, not number inputs', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    for (const label of [
      'Price per student per hour',
      'Platform share per hour',
      'Tutor share per hour',
    ]) {
      expect(screen.getByLabelText(label)).toHaveAttribute('type', 'text');
    }
  });

  it('is enabled when the current values reconcile', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('disables Save with a note when shares do not sum to the total', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    type('Tutor share per hour', '250.00');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent('must sum to the total per hour');
  });

  it('re-enables Save once the values sum correctly', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    type('Tutor share per hour', '250.00');
    type('Platform share per hour', '200.00');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('uses decimal-safe arithmetic (0.1 x 3 = 0.3 = 0.1 + 0.2)', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    type('Price per student per hour', '0.1');
    type('Platform share per hour', '0.1');
    type('Tutor share per hour', '0.2');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('rejects malformed amounts', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    type('Price per student per hour', '12,5');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent('Enter amounts like 350.00.');
  });

  it('submits all four fields as strings, with the derived total', () => {
    render(<PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({
      pricePerStudentPerHour: '150.00',
      totalPerHour: '450.00',
      platformSharePerHour: '150.00',
      tutorSharePerHour: '300.00',
    });
  });

  it('shows a server-side rejection even though the client check passed', () => {
    const { rerender } = render(
      <PricingConfigForm format="ONE_TO_THREE" current={three} onSave={onSave} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    rerender(
      <PricingConfigForm
        format="ONE_TO_THREE"
        current={three}
        onSave={onSave}
        serverError="Platform and tutor shares must sum to the total per hour"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('must sum to the total per hour');
  });
});
