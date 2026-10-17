import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CohortFormat } from '@/types';

export interface PickerOption {
  id: string;
  label: string;
}

interface ManualAssignmentFormProps {
  subjects: { id: string; name: string }[];
  /** Suggestions for the typed tutor search (already limited to the chosen subject). */
  tutors: PickerOption[];
  /** Suggestions for the typed student search (students waiting for the chosen subject). */
  students: PickerOption[];
  onSubjectChange: (subjectId: string) => void;
  onTutorSearch: (term: string) => void;
  onStudentSearch: (term: string) => void;
  onSubmit: (values: {
    tutorId: string;
    studentIds: string[];
    subjectId: string;
    format: CohortFormat;
  }) => void;
  isSubmitting?: boolean;
}

// ONE_TO_ONE is exact (1). Group formats: 2..N (min 2 inferred from the 9-3 gate test).
const LIMITS: Record<CohortFormat, { min: number; max: number }> = {
  ONE_TO_ONE: { min: 1, max: 1 },
  ONE_TO_THREE: { min: 2, max: 3 },
  ONE_TO_FIVE: { min: 2, max: 5 },
};

const FORMAT_LABELS: Record<CohortFormat, string> = {
  ONE_TO_ONE: 'One to one',
  ONE_TO_THREE: 'One to three',
  ONE_TO_FIVE: 'One to five',
};

const selectClass = 'h-9 w-full rounded-md border bg-background px-3 text-sm';
const suggestionClass = 'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted';

export default function ManualAssignmentForm({
  subjects,
  tutors,
  students,
  onSubjectChange,
  onTutorSearch,
  onStudentSearch,
  onSubmit,
  isSubmitting = false,
}: ManualAssignmentFormProps) {
  const [format, setFormat] = useState<CohortFormat>('ONE_TO_ONE');
  const [subjectId, setSubjectId] = useState('');
  const [tutor, setTutor] = useState<PickerOption | null>(null);
  const [chosen, setChosen] = useState<PickerOption[]>([]);
  const [tutorTerm, setTutorTerm] = useState('');
  const [studentTerm, setStudentTerm] = useState('');

  const { min, max } = LIMITS[format];
  const count = chosen.length;
  const canAssign =
    subjectId !== '' && tutor !== null && count >= min && count <= max && !isSubmitting;

  const selectSubject = (id: string) => {
    setSubjectId(id);
    setTutor(null);
    setChosen([]);
    setTutorTerm('');
    setStudentTerm('');
    onSubjectChange(id);
    onTutorSearch('');
    onStudentSearch('');
  };

  const changeTutorTerm = (term: string) => {
    setTutorTerm(term);
    onTutorSearch(term);
  };
  const changeStudentTerm = (term: string) => {
    setStudentTerm(term);
    onStudentSearch(term);
  };

  const pickTutor = (option: PickerOption) => {
    setTutor(option);
    changeTutorTerm('');
  };
  const pickStudent = (option: PickerOption) => {
    setChosen((current) =>
      current.some((s) => s.id === option.id) ? current : [...current, option]
    );
    changeStudentTerm('');
  };
  const removeStudent = (id: string) => setChosen((current) => current.filter((s) => s.id !== id));

  const studentSuggestions = students.filter((s) => !chosen.some((c) => c.id === s.id));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canAssign && tutor) {
          onSubmit({ tutorId: tutor.id, studentIds: chosen.map((s) => s.id), subjectId, format });
        }
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="manual-format">Format</Label>
        <select
          id="manual-format"
          className={selectClass}
          value={format}
          onChange={(e) => setFormat(e.target.value as CohortFormat)}
        >
          {(Object.keys(LIMITS) as CohortFormat[]).map((f) => (
            <option key={f} value={f}>
              {FORMAT_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="manual-subject">Subject</Label>
        <select
          id="manual-subject"
          className={selectClass}
          value={subjectId}
          onChange={(e) => selectSubject(e.target.value)}
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manual-tutor">Tutor</Label>
        {tutor ? (
          <p className="flex items-center gap-2 text-sm">
            {tutor.label}
            <button
              type="button"
              aria-label={`Remove tutor ${tutor.label}`}
              onClick={() => setTutor(null)}
            >
              ✕
            </button>
          </p>
        ) : (
          <>
            <Input
              id="manual-tutor"
              placeholder={subjectId ? 'Type to search tutors' : 'Choose a subject first'}
              disabled={!subjectId}
              value={tutorTerm}
              onChange={(e) => changeTutorTerm(e.target.value)}
            />
            {subjectId && (
              <ul aria-label="Tutor suggestions" className="space-y-1">
                {tutors.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={suggestionClass}
                      onClick={() => pickTutor(option)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
                {tutors.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    {tutorTerm.trim() ? 'No tutors match.' : 'No verified tutors teach this subject.'}
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          {`Students (${count} selected, ${min === max ? `exactly ${max}` : `${min} to ${max}`})`}
        </legend>
        <ul className="flex flex-wrap gap-2">
          {chosen.map((student) => (
            <li
              key={student.id}
              className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
            >
              {student.label}
              <button
                type="button"
                aria-label={`Remove ${student.label}`}
                onClick={() => removeStudent(student.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <Label htmlFor="manual-student">Student</Label>
        <Input
          id="manual-student"
          placeholder={subjectId ? 'Type to search students' : 'Choose a subject first'}
          disabled={!subjectId || count >= max}
          value={studentTerm}
          onChange={(e) => changeStudentTerm(e.target.value)}
        />
        {subjectId && count < max && (
          <ul aria-label="Student suggestions" className="space-y-1">
            {studentSuggestions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={suggestionClass}
                  onClick={() => pickStudent(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {studentSuggestions.length === 0 && (
              <li className="text-sm text-muted-foreground">
                {studentTerm.trim()
                  ? 'No students match.'
                  : 'No students are waiting for this subject.'}
              </li>
            )}
          </ul>
        )}
      </fieldset>

      <Button type="submit" disabled={!canAssign}>
        Assign
      </Button>
    </form>
  );
}
