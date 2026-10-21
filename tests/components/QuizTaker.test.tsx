import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizTaker from '@/components/class-delivery/QuizTaker';
import { useSubmitAttempt, type Quiz } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAssessmentQuiz');

const baseQuiz: Quiz = {
  id: 'q1',
  weekStartDate: '2026-10-19T00:00:00.000Z',
  instructions: 'Do your best',
  questions: [{ text: 'Capital of France?', options: [{ text: 'Paris' }, { text: 'Rome' }] }],
};

describe('QuizTaker', () => {
  const mutate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubmitAttempt).mockReturnValue({ mutate, isPending: false } as never);
  });

  it('submits the selected option indexes', () => {
    render(createElement(QuizTaker, { quiz: baseQuiz, cohortId: 'c1', canSubmit: true }));
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Paris'));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(mutate).toHaveBeenCalledWith({ quizId: 'q1', cohortId: 'c1', answers: [[0]] });
  });

  it('keeps Submit disabled when the membership is not active', () => {
    render(createElement(QuizTaker, { quiz: baseQuiz, cohortId: 'c1', canSubmit: false }));
    fireEvent.click(screen.getByLabelText('Paris'));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('shows the score and correct answers after an attempt, with no Submit button', () => {
    const done: Quiz = {
      ...baseQuiz,
      questions: [
        {
          text: 'Capital of France?',
          options: [
            { text: 'Paris', isCorrect: true },
            { text: 'Rome', isCorrect: false },
          ],
        },
      ],
      myAttempt: { answers: [[1]], score: 0, total: 1, submittedAt: '2026-10-20T00:00:00Z' },
    };
    render(createElement(QuizTaker, { quiz: done, cohortId: 'c1', canSubmit: true }));
    expect(screen.getByText('Score: 0 / 1')).toBeInTheDocument();
    expect(screen.getByText(/Paris \(correct\)/)).toBeInTheDocument();
    expect(screen.getByText(/your answer, incorrect/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();
  });
});