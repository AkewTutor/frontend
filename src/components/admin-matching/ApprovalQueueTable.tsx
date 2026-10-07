import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MatchingQueueItem } from '@/types';

interface ApprovalQueueTableProps {
  items: MatchingQueueItem[];
  onApprove: (cohortId: string) => void;
  onReject: (cohortId: string, reason: string) => void;
}

export default function ApprovalQueueTable({
  items,
  onApprove,
  onReject,
}: ApprovalQueueTableProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (items.length === 0) {
    return <EmptyState message="The approval queue is clear." />;
  }

  const closeReject = () => {
    setRejectingId(null);
    setReason('');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Path</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Tutor</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          // Overdue is read straight from the server flag (staleApproval.job.ts); never computed here.
          const overdue = item.adminOverdueNotifiedAt !== null;
          const rejecting = rejectingId === item.cohortId;
          return (
            <TableRow
              key={item.cohortId}
              data-overdue={overdue}
              className={overdue ? 'bg-danger/10' : undefined}
            >
              <TableCell>{item.path}</TableCell>
              <TableCell>{item.format}</TableCell>
              <TableCell>{item.tutorId}</TableCell>
              <TableCell>{item.studentIds.length}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <StatusBadge status={overdue ? 'OVERDUE' : 'PENDING'} />
              </TableCell>
              <TableCell>
                {rejecting ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      aria-label="Rejection reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        disabled={reason.trim() === ''}
                        onClick={() => {
                          onReject(item.cohortId, reason.trim());
                          closeReject();
                        }}
                      >
                        Confirm reject
                      </Button>
                      <Button variant="secondary" onClick={closeReject}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => onApprove(item.cohortId)}>Approve</Button>
                    <Button variant="secondary" onClick={() => setRejectingId(item.cohortId)}>
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
