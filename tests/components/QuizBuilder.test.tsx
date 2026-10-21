import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizBuilder from '@/components/class-delivery/QuizBuilder';
import { useCreateQuiz } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAssessmentQuiz');

describe('QuizBuilder', () => {
  const mutate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateQuiz).mockReturnValue({ mutate, isPending: false } as never);
  });

  it('disables Create quiz until instructions, question, options and a correct answer exist', () => {
    render(createElement(QuizBuilder, { cohortId: 'c1', defaultWeekStartDate: '2026-10-19' }));
    const submit = screen.getByRole('button', { name: 'Create quiz' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Instructions for students *'), {
      target: { value: 'Read chapter 3' },
    });
    fireEvent.change(screen.getByLabelText('Question 1'), { target: { value: 'Q' } });
    ['a', 'b', 'c', 'd'].forEach((v, i) =>
      fireEvent.change(screen.getByLabelText(`Question 1 option ${i + 1}`), { target: { value: v } })
    );
    expect(submit).toBeDisabled(); // no correct option yet

    fireEvent.click(screen.getByLabelText('Question 1 option 2 is correct'));
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toMatchObject({
      cohortId: 'c1',
      weekStartDate: '2026-10-19',
      instructions: 'Read chapter 3',
      questions: [
        {
          text: 'Q',
          options: [
            { text: 'a', isCorrect: false },
            { text: 'b', isCorrect: true },
            { text: 'c', isCorrect: false },
            { text: 'd', isCorrect: false },
          ],
        },
      ],
    });
  });
});