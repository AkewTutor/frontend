import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import AssessmentForm from '@/components/class-delivery/AssessmentForm';
import { useSubmitAssessment } from '@/hooks/useWeeklyAssessment';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useWeeklyAssessment');
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
    type = 'button',
  }: {
    children?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
  }) => createElement('button', { disabled, onClick, type }, children),
}));

describe('AssessmentForm', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubmitAssessment).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as never);
  });

  it('renders read-only view if existingAssessment is provided', () => {
    render(
      createElement(AssessmentForm, {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        existingAssessment: {
          id: '1',
          cohortMembershipId: 'cm-1',
          weekStartDate: '2024-01-01',
          tutorFeedback: 'Great job!',
          scoreSummary: '90/100',
          createdAt: '2024-01-02',
        },
      })
    );

    expect(screen.getByText('Great job!')).toBeInTheDocument();
    expect(screen.getByText('90/100')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    expect(editBtn).toBeInTheDocument();
  });

  it('clicking Edit switches to form view and allows submission', () => {
    const { getByRole, getByLabelText } = render(
      createElement(AssessmentForm, {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        existingAssessment: {
          id: '1',
          cohortMembershipId: 'cm-1',
          weekStartDate: '2024-01-01',
          tutorFeedback: 'Great job!',
          createdAt: '2024-01-02',
        },
      })
    );

    fireEvent.click(getByRole('button', { name: 'Edit' }));

    // Now form is visible
    const feedbackInput = getByLabelText(/Tutor Feedback/i) as HTMLTextAreaElement;
    expect(feedbackInput.value).toBe('Great job!');

    fireEvent.change(feedbackInput, { target: { value: 'Even better!' } });

    fireEvent.click(getByRole('button', { name: /Submit Assessment/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'Even better!',
        scoreSummary: undefined,
      },
      expect.any(Object)
    );
  });

  it('renders empty form if no existingAssessment', () => {
    const { getByRole, getByLabelText } = render(
      createElement(AssessmentForm, {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
      })
    );

    const feedbackInput = getByLabelText(/Tutor Feedback/i) as HTMLTextAreaElement;
    expect(feedbackInput.value).toBe('');

    const submitBtn = getByRole('button', { name: /Submit Assessment/i });
    expect(submitBtn).toBeDisabled(); // empty feedback -> disabled

    fireEvent.change(feedbackInput, { target: { value: 'New feedback' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        cohortMembershipId: 'cm-1',
        weekStartDate: '2024-01-01',
        tutorFeedback: 'New feedback',
        scoreSummary: undefined, // empty string turns to undefined
      },
      expect.any(Object)
    );
  });
});
