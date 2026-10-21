import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuizTaker from '@/components/class-delivery/QuizTaker';
import { useSubmitAttempt, type Quiz } from '@/hooks/useAssessmentQuiz';

vi.mock('@/hooks/useAssessmentQuiz');

describe('QuizTaker earlier attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubmitAttempt).mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  });

  it('shows earlier scores after the tutor allowed a retry', () => {
    const quiz: Quiz = {
      id: 'q1',
      weekStartDate: '2026-10-19T00:00:00.000Z',
      instructions: 'Go',
      questions: [{ text: 'Q', options: [{ text: 'a' }, { text: 'b' }] }],
      myAttempt: null,
      previousAttempts: [{ score: 1, total: 3, submittedAt: '2026-10-20T00:00:00Z', supersededAt: '2026-10-21T00:00:00Z' }],
    };
    render(createElement(QuizTaker, { quiz, cohortId: 'c1', canSubmit: true }));
    expect(screen.getByText('Earlier attempts: 1/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});