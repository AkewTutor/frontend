import { render, screen, fireEvent } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import EscalationBanner from '@/components/class-delivery/EscalationBanner';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) =>
    createElement('button', { onClick }, children),
}));

describe('EscalationBanner', () => {
  it('returns null (empty DOM) when visible is false', () => {
    const { container } = render(
      createElement(EscalationBanner, { visible: false, tutorIds: ['t1'] })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('single-tutor mode when visible and no tutorIds', () => {
    render(createElement(EscalationBanner, { visible: true }));
    expect(screen.getByText('Action Required:')).toBeInTheDocument();
  });

  it('list mode with one chip per id; chip click calls onSelectTutor', () => {
    const onSelectTutor = vi.fn();
    render(
      createElement(EscalationBanner, { visible: true, tutorIds: ['t1', 't2'], onSelectTutor })
    );
    expect(screen.getByText('Escalated Tutors:')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByText('t1'));
    expect(onSelectTutor).toHaveBeenCalledWith('t1');
  });
});
