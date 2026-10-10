import { faMedal } from '@fortawesome/free-solid-svg-icons';

import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import type { Badge } from '@/types';

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return <EmptyState icon={faMedal} message="No badges earned yet." />;
  }

  return (
    <ul className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <li key={badge.badgeId}>
          <Card className="h-full">
            <CardContent className="flex flex-col gap-1 p-4">
              <p className="font-semibold">{badge.name}</p>
              <p className="text-s text-muted-foreground">{badge.description}</p>
              <p className="text-s text-muted-foreground">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
