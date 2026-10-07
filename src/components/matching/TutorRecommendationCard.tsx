import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import type { TutorRecommendation } from '@/types';

interface TutorRecommendationCardProps {
  recommendation: TutorRecommendation;
  onSelect: (tutorId: string) => void;
  isSelecting?: boolean;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function TutorRecommendationCard({
  recommendation,
  onSelect,
  isSelecting = false,
}: TutorRecommendationCardProps) {
  const { tutorId, name, profilePictureUrl, matchPercentage } = recommendation;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt=""
              className="size-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground"
            >
              {initials(name)}
            </span>
          )}
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{`${matchPercentage}% match`}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Link
            to={ROUTES.STUDENT_TUTOR_VIEW.replace(':tutorId', tutorId)}
            className="text-sm font-semibold text-primary underline"
          >
            View profile
          </Link>
          <Button onClick={() => onSelect(tutorId)} disabled={isSelecting}>
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
