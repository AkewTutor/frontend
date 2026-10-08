import { generatePath, Link, useSearchParams } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import TutorSearchFilters from '@/components/matching/TutorSearchFilters';
import { ROUTES } from '@/constants';
import { useSearchTutors, type TutorSearchFiltersValue } from '@/hooks/useMatching';
import { useSubjects } from '@/hooks/useSubjects';

const KEYS = ['subjectId', 'grade', 'day', 'budgetMax', 'language'] as const;

function readFilters(params: URLSearchParams): TutorSearchFiltersValue {
  const filters: Record<string, string | number> = {};
  for (const key of KEYS) {
    const raw = params.get(key);
    if (!raw) continue;
    if (key === 'grade') {
      const grade = Number(raw);
      if (!Number.isNaN(grade)) filters.grade = grade;
    } else {
      filters[key] = raw;
    }
  }
  return filters as TutorSearchFiltersValue;
}

export default function FindTutorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const isIdle = Object.keys(filters).length === 0;

  const subjects = useSubjects();
  const search = useSearchTutors(filters);

  const handleChange = (next: TutorSearchFiltersValue) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-space-md p-6">
      <h1 className="text-l font-bold">Find a tutor</h1>

      <TutorSearchFilters
        value={filters}
        onChange={handleChange}
        subjects={subjects.data?.subjects ?? []}
      />

      {isIdle ? (
        <EmptyState message="Start by selecting a filter to see tutors." />
      ) : search.isLoading ? (
        <p>Searching…</p>
      ) : search.isError ? (
        <p>We couldn&apos;t load tutors. Please try again later.</p>
      ) : !search.data || search.data.tutors.length === 0 ? (
        <EmptyState message="No tutors match these filters." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {search.data.tutors.map((tutor) => (
            <li key={tutor.tutorId}>
              <Link
                to={generatePath(ROUTES.STUDENT_TUTOR_VIEW, { tutorId: tutor.tutorId })}
                className="block rounded-m border bg-white p-4 shadow-card transition-colors hover:bg-accent/20"
              >
                <p className="text-m font-semibold">{tutor.name}</p>
                <p className="text-s text-muted-foreground">
                  {tutor.pricePerStudentPerHour} per student per hour
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
