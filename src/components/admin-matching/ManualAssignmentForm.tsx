import { useState } from 'react';

import { Button } from '@/components/ui/button';
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

export default function ManualAssignmentForm({
  tutors,
  students,
  onSubmit,
  isSubmitting = false,
}: ManualAssignmentFormProps) {
  const [tutorId, setTutorId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [format, setFormat] = useState<CohortFormat>('ONE_TO_ONE');

  const { min, max } = LIMITS[format];
  const count = studentIds.length;
  const canAssign = tutorId !== '' && count >= min && count <= max && !isSubmitting;

  const toggleStudent = (id: string, checked: boolean) => {
    setStudentIds((current) => (checked ? [...current, id] : current.filter((s) => s !== id)));
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
        <Label htmlFor="manual-tutor">Tutor</Label>
        <select
          id="manual-tutor"
          className={selectClass}
          value={tutorId}
          onChange={(e) => setTutorId(e.target.value)}
        >
          <option value="">Select a tutor</option>
          {tutors.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          {`Students (${count} selected, ${min === max ? `exactly ${max}` : `${min} to ${max}`})`}
        </legend>
        {students.map((student) => {
          const checked = studentIds.includes(student.id);
          return (
            <label key={student.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && count >= max}
                onChange={(e) => toggleStudent(student.id, e.target.checked)}
              />
              {student.label}
            </label>
          );
        })}
      </fieldset>

      <Button type="submit" disabled={!canAssign}>
        Assign
      </Button>
    </form>
  );
}
