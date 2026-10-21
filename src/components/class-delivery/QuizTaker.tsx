import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubmitAttempt, type Quiz } from '@/hooks/useAssessmentQuiz';

export interface QuizTakerProps {
  quiz: Quiz;
  cohortId: string;
  canSubmit: boolean;
}

export default function QuizTaker({ quiz, cohortId, canSubmit }: QuizTakerProps) {
  const { mutate, isPending } = useSubmitAttempt();
  const [answers, setAnswers] = useState<number[][]>(() => quiz.questions.map(() => []));
  const attempt = quiz.myAttempt;

  const toggle = (qi: number, oi: number) =>
    setAnswers((prev) =>
      prev.map((sel, i) =>
        i !== qi ? sel : sel.includes(oi) ? sel.filter((x) => x !== oi) : [...sel, oi]
      )
    );

  const allAnswered = answers.every((a) => a.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || !canSubmit) return;
    mutate({ quizId: quiz.id, cohortId, answers });
  };

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">
        {quiz.title || 'Weekly assessment'} - week of {quiz.weekStartDate.slice(0, 10)}
      </h2>
      <div className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">{quiz.instructions}</div>

      {attempt ? (
        <div className="space-y-3">
          <p className="font-semibold">
            Score: {attempt.score} / {attempt.total}
          </p>
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="space-y-1">
              <p className="font-medium">
                {qi + 1}. {q.text}
              </p>
              {q.options.map((o, oi) => {
                const picked = attempt.answers[qi]?.includes(oi);
                return (
                  <p key={oi} className="text-sm">
                    {picked ? '[x] ' : '[ ] '}
                    {o.text}
                    {o.isCorrect ? ' (correct)' : ''}
                    {picked && !o.isCorrect ? ' (your answer, incorrect)' : ''}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {quiz.questions.map((q, qi) => (
            <fieldset key={qi} className="space-y-1">
              <legend className="font-medium">
                {qi + 1}. {q.text}
              </legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={answers[qi]?.includes(oi) ?? false}
                    onChange={() => toggle(qi, oi)}
                  />
                  {o.text}
                </label>
              ))}
            </fieldset>
          ))}
          {!canSubmit && (
            <p className="text-sm text-amber-700">
              Complete your payment to activate your membership before submitting.
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!allAnswered || !canSubmit || isPending}
          >
            {isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      )}
    </section>
  );
}