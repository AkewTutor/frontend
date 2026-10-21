import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizBuilder from '@/components/class-delivery/QuizBuilder';
import { useCreateQuiz, useUpdateQuiz } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAssessmentQuiz');

describe('QuizBuilder blank options', () => {
  const createMutate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateQuiz).mockReturnValue({ mutate: createMutate, isPending: false } as never);
    vi.mocked(useUpdateQuiz).mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  });

  it('ignores empty option boxes and only sends the filled ones', () => {
    render(createElement(QuizBuilder, { cohortId: 'c1', defaultWeekStartDate: '2026-10-19' }));
    const submit = screen.getByRole('button', { name: 'Create quiz' });

    fireEvent.change(screen.getByLabelText('Instructions for students *'), {
      target: { value: 'Read chapter 3' },
    });
    fireEvent.change(screen.getByLabelText('Question 1'), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText('Question 1 option 1'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Question 1 option 2'), { target: { value: 'b' } });
    fireEvent.click(screen.getByLabelText('Question 1 option 1 is correct'));

    expect(submit).toBeEnabled(); // options 3 and 4 left blank
    fireEvent.click(submit);
    expect(createMutate.mock.calls[0][0].questions[0].options).toEqual([
      { text: 'a', isCorrect: true },
      { text: 'b', isCorrect: false },
    ]);
  });

  it('stays disabled when the only ticked option is blank', () => {
    render(createElement(QuizBuilder, { cohortId: 'c1', defaultWeekStartDate: '2026-10-19' }));
    fireEvent.change(screen.getByLabelText('Instructions for students *'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Question 1'), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText('Question 1 option 1'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Question 1 option 2'), { target: { value: 'b' } });
    fireEvent.click(screen.getByLabelText('Question 1 option 3 is correct'));
    expect(screen.getByRole('button', { name: 'Create quiz' })).toBeDisabled();
  });
});