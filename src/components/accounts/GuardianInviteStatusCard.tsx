import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import type { ParentStudentRelationship } from '@/types';

interface GuardianInviteStatusCardProps {
  relationship: ParentStudentRelationship;
  onResend: () => void;
}

// The parent page owns useResendInvite and its toast; this card only reports the click.
export default function GuardianInviteStatusCard({
  relationship,
  onResend,
}: GuardianInviteStatusCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-m border border-border p-4">
      <StatusBadge status={relationship.status} />
      {relationship.status === 'INVITED' && (
        <Button type="button" variant="secondary" size="sm" onClick={onResend}>
          Resend
        </Button>
      )}
    </div>
  );
}
