import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import { useSelectTutor, useTutorFullProfile } from '@/hooks/useMatching';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function TutorProfileViewPage() {
  const { tutorId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useTutorFullProfile(tutorId);
  const selectTutor = useSelectTutor();

  if (isLoading) return <p className="p-6">Loading tutor profile…</p>;

  if (isError || !data) {
    const notFound = error?.response?.status === 404;
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p>
          {notFound
            ? 'This tutor is no longer available.'
            : "We couldn't load this tutor's profile. Please try again later."}
        </p>
        <Button asChild variant="outline">
          <Link to={ROUTES.STUDENT_FIND_TUTOR}>Back to tutor search</Link>
        </Button>
      </div>
    );
  }

  const handleSelect = () => {
    selectTutor.mutate(
      { tutorId: data.tutorId },
      {
        onSuccess: () => navigate(ROUTES.STUDENT_GROUP_STATUS),
        onError: (err) => {
          if (err.response?.status === 409) {
            toast.error(
              'This tutor is no longer available. Please review the list and choose again.'
            );
          } else {
            toast.error('Could not select this tutor. Please try again.');
          }
        },
      }
    );
  };

  return (
    <div className="flex max-w-2xl flex-col gap-space-md p-6">
      <div className="flex items-center gap-4">
        {data.profilePictureUrl ? (
          <img
            src={data.profilePictureUrl}
            alt=""
            className="size-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-20 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            {initials(data.name)}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-l font-bold">{data.name}</h1>
          <StatusBadge status={data.verificationStatus} />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <p>
            <strong>Institution:</strong> {data.educationInstitution}
          </p>
          {data.degree && (
            <p>
              <strong>Degree:</strong> {data.degree}
            </p>
          )}
          <p>
            <strong>Students taught:</strong> {data.uniqueStudentsTaught}
          </p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-m font-semibold">Subjects and grades</h2>
        <ul className="list-disc pl-6">
          {data.subjectsAndGrades.map((entry) => (
            <li key={entry.subjectName}>
              {entry.subjectName} (grades {entry.grades})
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-m font-semibold">Available slots</h2>
        {data.availableSlots.length === 0 ? (
          <p>No available slots listed.</p>
        ) : (
          <ul className="list-disc pl-6">
            {data.availableSlots.map((slot) => (
              <li key={slot.startTime}>
                {new Date(slot.startTime).toLocaleString()} –{' '}
                {new Date(slot.endTime).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <Button onClick={handleSelect} disabled={selectTutor.isPending}>
          Select this tutor
        </Button>
      </div>
    </div>
  );
}
