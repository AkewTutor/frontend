import { Card, CardContent } from '@/components/ui/card';
import type { CohortMember } from '@/types';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

// Group-format visibility floor (Doc 02 §5.6): name + photo only. Reads two named fields and
// never spreads the member, so extra API fields can never reach the DOM.
export default function GroupAssignmentCard({ member }: { member: CohortMember }) {
  const { displayName, profilePictureUrl } = member;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initials(displayName)}
          </span>
        )}
        <span className="font-semibold">{displayName}</span>
      </CardContent>
    </Card>
  );
}
