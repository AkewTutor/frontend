import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateQuiz, useUpdateQuiz, type Quiz } from '@/hooks/useAssessmentQuiz';

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
  editing?: Quiz; // edit mode when set
  questionsLocked?: boolean; // true once a student has submitted
  onDone?: () => void; // called after save or cancel in edit mode
}

export default function QuizBuilder({
  cohortId,
  defaultWeekStartDate,
  onCreated,
  editing,
  questionsLocked = false,
  onDone,
}: QuizBuilderProps) {
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const isPending = create.isPending || update.isPending;

  const [weekStartDate, setWeekStartDate] = useState(
    editing ? editing.weekStartDate.slice(0, 10) : defaultWeekStartDate
  );
  const [title, setTitle] = useState(editing?.title ?? '');
  const [instructions, setInstructions] = useState(editing?.instructions ?? '');
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    editing
      ? editing.questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })),
        }))
      : [emptyQuestion()]
  );

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

  const questionsValid = questions.every(
    (q) =>
      q.text.trim() !== '' &&
      q.options.filter((o) => o.text.trim() !== '').length >= 2 &&
      q.options.some((o) => o.isCorrect && o.text.trim() !== '')
  );

  const valid =
    instructions.trim() !== '' &&
    /^\d{4}-\d{2}-\d{2}$/.test(weekStartDate) &&
    (questionsLocked || questionsValid);

  const cleanQuestions = () =>
    questions.map((q) => ({
      text: q.text.trim(),
      options: q.options
        .filter((o) => o.text.trim() !== '')
        .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;

    if (editing) {
      update.mutate(
        {
          quizId: editing.id,
          cohortId,
          title: title.trim(),
          instructions: instructions.trim(),
          questions: questionsLocked ? undefined : cleanQuestions(),
        },
        { onSuccess: () => onDone?.() }
      );
      return;
    }

    create.mutate(
      {
        cohortId,
        weekStartDate,
        title: title.trim() || undefined,
        instructions: instructions.trim(),
        questions: cleanQuestions(),
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
      <h2 className="text-lg font-semibold">
        {editing ? 'Edit quiz' : "Create this week's quiz"}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="quiz-week" className="block text-sm font-medium">
            Week starting
          </label>
          <input
            id="quiz-week"
            type="date"
            value={weekStartDate}
            disabled={!!editing}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="quiz-title" className="block text-sm font-medium">
            Title (optional, shared by all questions)
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

      {questionsLocked ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            Questions are locked because students have already submitted. You can still change the
            title and instructions.
          </p>
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="font-medium">
                Question {qi + 1}: {q.text}
              </p>
              {q.options.map((o, oi) => (
                <p key={oi} className="text-sm">
                  {o.isCorrect ? '[x] ' : '[ ] '}
                  {o.text}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Tick the box next to every correct answer. Students are scored automatically.
          </p>

          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2 rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Question {qi + 1}</p>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
                  >
                    Remove question
                  </Button>
                )}
              </div>
              <input
                aria-label={`Question ${qi + 1}`}
                type="text"
                value={q.text}
                placeholder="Type the question"
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                className="w-full rounded border p-2"
              />
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(qi, oi)}
                    >
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

          <div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
            >
              Add question
            </Button>
          </div>
        </>
      )}

      {!valid && (
        <p className="text-sm text-amber-700">
          To enable the button: add instructions, and give every question its text, at least 2 filled options and one ticked correct answer.
        </p>
      )}
      <div className="flex gap-2 border-t pt-4">
        {editing && (
          <Button type="button" variant="ghost" size="md" onClick={() => onDone?.()}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={!valid || isPending}
        >
          {isPending ? 'Saving...' : editing ? 'Save changes' : 'Create quiz'}
        </Button>
      </div>
    </form>
  );
}