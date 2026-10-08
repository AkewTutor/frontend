import { faRankingStar } from '@fortawesome/free-solid-svg-icons';

import EmptyState from '@/components/common/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LeaderboardEntry } from '@/types';

// Privacy: renders displayName exactly as returned (first name + last initial). The props carry no
// lastName field, so a full name can never be spliced in, even for a Parent viewing their own child.
export default function LeaderboardTable({
  rankings,
  callerRank,
}: {
  rankings: LeaderboardEntry[];
  callerRank: number;
}) {
  if (rankings.length === 0) {
    return <EmptyState icon={faRankingStar} message="No rankings yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">XP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((entry) => {
          const isCaller = entry.rank === callerRank;
          return (
            <TableRow
              key={entry.rank}
              aria-current={isCaller ? 'true' : undefined}
              className={isCaller ? 'bg-accent font-semibold' : undefined}
            >
              <TableCell>{entry.rank}</TableCell>
              <TableCell>{entry.displayName}</TableCell>
              <TableCell className="text-right">{entry.xp}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
