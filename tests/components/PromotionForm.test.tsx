import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PromotionForm from '@/components/admin-payments/PromotionForm';

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fill(value: string, validFrom = '2026-10-01T00:00', validTo = '2026-10-31T00:00') {
  type('Code', 'BACK2026');
  type('Discount value', value);
  type('Valid from', validFrom);
  type('Valid to', validTo);
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create promotion' }));

describe('PromotionForm', () => {
  const onSubmit = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  const renderForm = () => render(<PromotionForm onSubmit={onSubmit} isSubmitting={false} />);

  it.each(['0', '101'])('rejects a percent of %s before submit', (value) => {
    renderForm();
    fill(value);
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Percent must be between 1 and 100.');
  });

  it.each(['1', '100'])('accepts a percent of %s (inclusive boundary)', (value) => {
    renderForm();
    fill(value);
    submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('requires a code', () => {
    renderForm();
    fill('10');
    type('Code', '  ');
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Code is required.');
  });

  it('rejects a malformed value', () => {
    renderForm();
    fill('10,5');
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a fixed amount above 0', () => {
    renderForm();
    type('Discount type', 'FIXED_ETB');
    fill('0');
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be above 0.');
  });

  it('blocks submit when the end date is not after the start date', () => {
    renderForm();
    fill('10', '2026-10-31T00:00', '2026-10-01T00:00');
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('End date must be after start date.');
  });

  it('submits the API body with ISO dates and the value as a string', () => {
    renderForm();
    fill('10');
    submit();
    expect(onSubmit).toHaveBeenCalledWith({
      code: 'BACK2026',
      discountType: 'PERCENT',
      discountValue: '10',
      validFrom: new Date('2026-10-01T00:00').toISOString(),
      validTo: new Date('2026-10-31T00:00').toISOString(),
    });
  });
});
