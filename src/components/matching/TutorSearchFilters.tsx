import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TutorSearchFiltersValue } from '@/hooks/useMatching';
import type { Subject } from '@/types';

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

interface TutorSearchFiltersProps {
  value: TutorSearchFiltersValue;
  onChange: (next: TutorSearchFiltersValue) => void;
  subjects: Subject[];
}

const selectClass = 'h-9 w-full rounded-md border bg-background px-3 text-sm';

// 1-to-1 only: never rendered for a group-format flow. Cleared fields are removed so the
// "no filters yet" guard in useSearchTutors keeps working.
export default function TutorSearchFilters({ value, onChange, subjects }: TutorSearchFiltersProps) {
  const patch = (changes: Partial<TutorSearchFiltersValue>) => {
    const next: Record<string, unknown> = { ...value, ...changes };
    for (const key of Object.keys(next)) {
      if (next[key] === undefined || next[key] === '' || Number.isNaN(next[key])) delete next[key];
    }
    onChange(next as TutorSearchFiltersValue);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1">
        <Label htmlFor="filter-subject">Subject</Label>
        <select
          id="filter-subject"
          className={selectClass}
          value={value.subjectId ?? ''}
          onChange={(e) => patch({ subjectId: e.target.value || undefined })}
        >
          <option value="">Any subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-grade">Grade</Label>
        <Input
          id="filter-grade"
          type="number"
          min={1}
          value={value.grade ?? ''}
          onChange={(e) =>
            patch({ grade: e.target.value === '' ? undefined : Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-day">Day</Label>
        <select
          id="filter-day"
          className={selectClass}
          value={value.day ?? ''}
          onChange={(e) => patch({ day: e.target.value || undefined })}
        >
          <option value="">Any day</option>
          {DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-budget">Maximum budget</Label>
        <Input
          id="filter-budget"
          inputMode="decimal"
          value={value.budgetMax ?? ''}
          onChange={(e) => patch({ budgetMax: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-language">Language</Label>
        <Input
          id="filter-language"
          value={value.language ?? ''}
          onChange={(e) => patch({ language: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
