import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateQuiz } from '@/hooks/useAssessmentQuiz';

interface DraftOption {
  text: string;
  isCorrect: boolean;
}
interface DraftQuestion {
  text: string;
  options: DraftOption[];
}

const emptyQuestion = (): DraftQuestion => ({
  text: '',
  options: [0, 1, 2, 3].map(() => ({ text: '', isCorrect: false })),
});

export interface QuizBuilderProps {
  cohortId: string;
  defaultWeekStartDate: string;
  onCreated?: () => void;
}

export default function QuizBuilder({ cohortId, defaultWeekStartDate, onCreated }: QuizBuilderProps) {
  const { mutate, isPending } = useCreateQuiz();
  const [weekStartDate, setWeekStartDate] = useState(defaultWeekStartDate);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  const updateQuestion = (qi: number, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateOption = (qi: number, oi: number, patch: Partial<DraftOption>) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i !== qi
          ? q
          : { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
      )
    );

  const addOption = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi && q.options.length < 6
          ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
          : q
      )
    );

  const removeOption = (qi: number, oi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi && q.options.length > 2
          ? { ...q, options: q.options.filter((_, j) => j !== oi) }
          : q
      )
    );

  const valid =
    instructions.trim() !== '' &&
    /^\d{4}-\d{2}-\d{2}$/.test(weekStartDate) &&
    questions.every(
      (q) =>
        q.text.trim() !== '' &&
        q.options.every((o) => o.text.trim() !== '') &&
        q.options.some((o) => o.isCorrect)
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    mutate(
      {
        cohortId,
        weekStartDate,
        title: title.trim() || undefined,
        instructions: instructions.trim(),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
        })),
      },
      {
        onSuccess: () => {
          setTitle('');
          setInstructions('');
          setQuestions([emptyQuestion()]);
          onCreated?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Create this week&apos;s quiz</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="quiz-week" className="block text-sm font-medium">
            Week starting
          </label>
          <input
            id="quiz-week"
            type="date"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="quiz-title" className="block text-sm font-medium">
            Title (optional)
          </label>
          <input
            id="quiz-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="quiz-instructions" className="block text-sm font-medium">
          Instructions for students *
        </label>
        <textarea
          id="quiz-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          placeholder="What should students review or do before answering?"
          className="mt-1 w-full rounded border p-2"
        />
      </div>

      <p className="text-sm text-gray-600">
        Tick the box next to every correct answer. Students are scored automatically.
      </p>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded border p-3">
          <div className="flex items-center gap-2">
            <input
              aria-label={`Question ${qi + 1}`}
              type="text"
              value={q.text}
              placeholder={`Question ${qi + 1}`}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              className="w-full rounded border p-2"
            />
            {questions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
              >
                Remove
              </Button>
            )}
          </div>
          {q.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input
                type="checkbox"
                aria-label={`Question ${qi + 1} option ${oi + 1} is correct`}
                checked={o.isCorrect}
                onChange={(e) => updateOption(qi, oi, { isCorrect: e.target.checked })}
              />
              <input
                aria-label={`Question ${qi + 1} option ${oi + 1}`}
                type="text"
                value={o.text}
                placeholder={`Option ${oi + 1}`}
                onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                className="w-full rounded border p-2"
              />
              {q.options.length > 2 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(qi, oi)}>
                  x
                </Button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => addOption(qi)}>
              Add option
            </Button>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
        >
          Add question
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={!valid || isPending}>
          {isPending ? 'Creating...' : 'Create quiz'}
        </Button>
      </div>
    </form>
  );
}