import { generatePath, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import EmptyState from '@/components/common/EmptyState';
import NoExactMatchButton from '@/components/matching/NoExactMatchButton';
import TutorSearchFilters from '@/components/matching/TutorSearchFilters';
import { ROUTES } from '@/constants';
import {
  useNoExactMatch,
  useSearchTutors,
  type TutorSearchFiltersValue,
} from '@/hooks/useMatching';
import { useSubjects } from '@/hooks/useSubjects';

const KEYS = ['subjectId', 'grade', 'day', 'budgetMax'] as const;

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
  // The API needs a subject; without one there is nothing to search yet.
  const isIdle = !filters.subjectId;

  const subjects = useSubjects();
  const search = useSearchTutors(filters);
  const noExactMatch = useNoExactMatch();
  const navigate = useNavigate();

  const handleChange = (next: TutorSearchFiltersValue) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    setSearchParams(params, { replace: true });
  };

  // UC-25: nothing fits, so hand the request to an admin for the subject that was searched
  // (searching is read-only and opens no request of its own).
  const handleNoExactMatch = () => {
    noExactMatch.mutate(
      { subjectId: filters.subjectId },
      {
        onSuccess: () => {
          toast.success('We will look wider and assign a tutor for you.');
          navigate(ROUTES.STUDENT_GROUP_STATUS);
        },
        onError: () => toast.error('Could not start the wider search. Please try again.'),
      }
    );
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
        <EmptyState message="Select a subject to see tutors." />
      ) : search.isLoading ? (
        <p>Searching…</p>
      ) : search.isError ? (
        <p>We couldn&apos;t load tutors. Please try again later.</p>
      ) : !search.data || search.data.tutors.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <EmptyState message="No tutors match these filters." />
          {(filters.day !== undefined || filters.budgetMax !== undefined) && (
            <p className="text-s text-muted-foreground">
              Your day or budget filter may be hiding tutors. Try clearing it before asking us to
              widen your search.
            </p>
          )}
          <NoExactMatchButton zeroMatchSince={null} onTrigger={handleNoExactMatch} />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {search.data.tutors.map((tutor) => (
            <li key={tutor.tutorId}>
              <Link
                to={`${generatePath(ROUTES.STUDENT_TUTOR_VIEW, { tutorId: tutor.tutorId })}?subjectId=${filters.subjectId}`}
                className="block rounded-m border bg-white p-4 shadow-card transition-colors hover:bg-accent/20"
              >
                <p className="text-m font-semibold">{tutor.name}</p>
                <p className="text-s text-muted-foreground">
                  {tutor.pricePerStudentPerHour
                    ? `${tutor.pricePerStudentPerHour} per student per hour`
                    : 'Price not available yet'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
