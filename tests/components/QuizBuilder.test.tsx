import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizBuilder from '@/components/class-delivery/QuizBuilder';
import { useCreateQuiz, useUpdateQuiz, type Quiz } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAssessmentQuiz');

describe('QuizBuilder', () => {
  const createMutate = vi.fn();
  const updateMutate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateQuiz).mockReturnValue({ mutate: createMutate, isPending: false } as never);
    vi.mocked(useUpdateQuiz).mockReturnValue({ mutate: updateMutate, isPending: false } as never);
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
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0][0]).toMatchObject({
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

  it('numbers questions automatically and renumbers after removal', () => {
    render(createElement(QuizBuilder, { cohortId: 'c1', defaultWeekStartDate: '2026-10-19' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    expect(screen.getByLabelText('Question 2')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove question' })[0]);
    expect(screen.queryByLabelText('Question 2')).toBeNull();
    expect(screen.getByLabelText('Question 1')).toBeInTheDocument();
  });

  it('in edit mode with locked questions saves only title and instructions', () => {
    const quiz: Quiz = {
      id: 'q1',
      weekStartDate: '2026-10-19T00:00:00.000Z',
      title: 'T',
      instructions: 'Old',
      questions: [
        {
          text: 'Q',
          options: [
            { text: 'a', isCorrect: true },
            { text: 'b', isCorrect: false },
          ],
        },
      ],
    };
    render(
      createElement(QuizBuilder, {
        cohortId: 'c1',
        defaultWeekStartDate: '2026-10-19',
        editing: quiz,
        questionsLocked: true,
      })
    );
    fireEvent.change(screen.getByLabelText('Instructions for students *'), {
      target: { value: 'New' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const arg = updateMutate.mock.calls[0][0];
    expect(arg).toMatchObject({ quizId: 'q1', cohortId: 'c1', instructions: 'New' });
    expect(arg.questions).toBeUndefined();
  });
});