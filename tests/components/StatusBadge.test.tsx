import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '@/components/common/StatusBadge';

describe('StatusBadge', () => {
  it.each([
    ['APPROVED', 'success'],
    ['PAID', 'success'],
    ['PENDING', 'warning'],
    ['INVITED', 'warning'],
    ['OVERDUE', 'danger'],
    ['ESCALATED', 'danger'],
  ])('maps %s to %s', (status, variant) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
  });

  it('renders unknown statuses neutral and never throws', () => {
    const { container } = render(<StatusBadge status="SOMETHING_NEW" />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'default');
    expect(container).toHaveTextContent('Something new');
  });

  it('severity overrides the mapped value', () => {
    const { container } = render(<StatusBadge status="PAID" severity="danger" />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'danger');
  });

  it('humanizes the raw enum', () => {
    const { container } = render(<StatusBadge status="PENDING_PAYMENT" />);
    expect(container).toHaveTextContent('Pending payment');
  });

  it('handles an empty status', () => {
    const { container } = render(<StatusBadge status="" />);
    expect(container).toHaveTextContent('—');
  });
});
