import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import NoExactMatchButton from '@/components/matching/NoExactMatchButton';
import TutorRecommendationCard from '@/components/matching/TutorRecommendationCard';
import { ROUTES } from '@/constants';
import { useNoExactMatch, useRecommendations, useSelectTutor } from '@/hooks/useMatching';

export default function TutorRecommendationsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRecommendations();
  const selectTutor = useSelectTutor();
  const noExactMatch = useNoExactMatch();

  if (isLoading) return <p className="p-6">Loading recommendations…</p>;
  if (isError || !data) {
    return (
      <p className="p-6">We couldn&apos;t load your recommendations. Please try again later.</p>
    );
  }

  const handleSelect = (tutorId: string) => {
    selectTutor.mutate(
      { tutorId },
      {
        onSuccess: () => navigate(ROUTES.STUDENT_GROUP_STATUS),
        onError: (error) => {
          if (error.response?.status === 409) {
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

  const handleNoExactMatch = () => {
    noExactMatch.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.STUDENT_GROUP_STATUS),
      onError: () => toast.error('Could not start the wider search. Please try again.'),
    });
  };

  return (
    <div className="flex flex-col gap-space-md p-6">
      <h1 className="text-l font-bold">Recommended tutors</h1>
      {data.recommendations.length === 0 ? (
        <NoExactMatchButton zeroMatchSince={data.zeroMatchSince} onTrigger={handleNoExactMatch} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.recommendations.map((recommendation) => (
            <li key={recommendation.tutorId}>
              <TutorRecommendationCard
                recommendation={recommendation}
                onSelect={handleSelect}
                isSelecting={selectTutor.isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
