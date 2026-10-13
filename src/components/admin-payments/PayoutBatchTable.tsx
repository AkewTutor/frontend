import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/money';
import type { PayoutBatch } from '@/types';

interface PayoutBatchTableProps {
  payouts: PayoutBatch[];
  onMarkPaid: (payoutId: string) => void;
  pendingId: string | null;
}

const date = (iso: string) => new Date(iso).toLocaleDateString();

export default function PayoutBatchTable({
  payouts,
  onMarkPaid,
  pendingId,
}: PayoutBatchTableProps) {
  if (payouts.length === 0) {
    return <EmptyState message="No payout batches yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tutor</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Action</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.map((payout) => (
          <TableRow key={payout.id}>
            <TableCell>{payout.tutorId}</TableCell>
            <TableCell>
              {date(payout.periodStart)} – {date(payout.periodEnd)}
            </TableCell>
            <TableCell>{formatMoney(payout.totalAmount)}</TableCell>
            <TableCell>
              <StatusBadge status={payout.status} />
            </TableCell>
            <TableCell>
              <Button
                type="button"
                size="sm"
                aria-label={`Mark payout ${payout.id} as paid`}
                disabled={payout.status === 'PAID' || pendingId === payout.id}
                onClick={() => onMarkPaid(payout.id)}
              >
                Mark paid
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
