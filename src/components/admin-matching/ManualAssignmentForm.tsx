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
  tutors: PickerOption[];
  students: PickerOption[];
  onSubmit: (values: { tutorId: string; studentIds: string[]; format: CohortFormat }) => void;
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

const matches = (option: PickerOption, term: string) =>
  option.label.toLowerCase().includes(term.trim().toLowerCase());

export default function ManualAssignmentForm({
  tutors,
  students,
  onSubmit,
  isSubmitting = false,
}: ManualAssignmentFormProps) {
  const [tutorId, setTutorId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [format, setFormat] = useState<CohortFormat>('ONE_TO_ONE');
  const [tutorFilter, setTutorFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  const { min, max } = LIMITS[format];
  const count = studentIds.length;
  const canAssign = tutorId !== '' && count >= min && count <= max && !isSubmitting;

  // The chosen tutor stays in the list even when the typed filter would hide it.
  const visibleTutors = tutors.filter((tutor) => tutor.id === tutorId || matches(tutor, tutorFilter));
  const chosenStudents = studentIds
    .map((id) => students.find((student) => student.id === id))
    .filter((student): student is PickerOption => Boolean(student));
  const availableStudents = students.filter(
    (student) => !studentIds.includes(student.id) && matches(student, studentFilter)
  );

  const addStudent = (id: string) => {
    if (id && !studentIds.includes(id)) setStudentIds((current) => [...current, id]);
  };
  const removeStudent = (id: string) => {
    setStudentIds((current) => current.filter((s) => s !== id));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canAssign) onSubmit({ tutorId, studentIds, format });
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
        <Label htmlFor="manual-tutor-filter">Find tutor</Label>
        <Input
          id="manual-tutor-filter"
          placeholder="Type to filter tutors"
          value={tutorFilter}
          onChange={(e) => setTutorFilter(e.target.value)}
        />
        <Label htmlFor="manual-tutor">Tutor</Label>
        <select
          id="manual-tutor"
          className={selectClass}
          value={tutorId}
          onChange={(e) => setTutorId(e.target.value)}
        >
          <option value="">Select a tutor</option>
          {visibleTutors.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.label}
            </option>
          ))}
        </select>
        {tutorFilter.trim() !== '' && visibleTutors.length === 0 && (
          <p className="text-sm text-muted-foreground">No tutors match.</p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          {`Students (${count} selected, ${min === max ? `exactly ${max}` : `${min} to ${max}`})`}
        </legend>
        <Label htmlFor="manual-student-filter">Find student</Label>
        <Input
          id="manual-student-filter"
          placeholder="Type to filter students"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
        />
        <Label htmlFor="manual-student">Add student</Label>
        <select
          id="manual-student"
          className={selectClass}
          value=""
          disabled={count >= max}
          onChange={(e) => addStudent(e.target.value)}
        >
          <option value="">Select a student</option>
          {availableStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </select>
        {studentFilter.trim() !== '' && availableStudents.length === 0 && (
          <p className="text-sm text-muted-foreground">No students match.</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {chosenStudents.map((student) => (
            <li key={student.id} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
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
      </fieldset>

      <Button type="submit" disabled={!canAssign}>
        Assign
      </Button>
    </form>
  );
}
