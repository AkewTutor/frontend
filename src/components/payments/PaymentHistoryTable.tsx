import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/money';
import type { PaymentRecord } from '@/types';

const date = (iso: string) => new Date(iso).toLocaleDateString();

export default function PaymentHistoryTable({ payments }: { payments: PaymentRecord[] }) {
  if (payments.length === 0) {
    return <EmptyState message="No payments yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Billing period</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {date(payment.billingPeriodStart)} – {date(payment.billingPeriodEnd)}
            </TableCell>
            <TableCell>{formatMoney(payment.amount)}</TableCell>
            <TableCell>
              <StatusBadge status={payment.status} />
            </TableCell>
            <TableCell>{date(payment.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
