import { Badge } from '@/components/ui/badge';

type Severity = 'default' | 'warning' | 'danger' | 'success';

// Closed map of known API statuses (spec 10-ui-foundation §0.2). Unknown => neutral.
const SEVERITY_BY_STATUS: Record<string, Severity> = {
  APPROVED: 'success',
  ACTIVE: 'success',
  PAID: 'success',
  COMPLETED: 'success',
  PENDING: 'warning',
  INVITED: 'warning',
  OVERDUE: 'danger',
  MISSING: 'danger',
  REJECTED: 'danger',
  REVOKED: 'danger',
  ESCALATED: 'danger',
};

function humanize(status: string): string {
  const text = status.replace(/_/g, ' ').trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

interface StatusBadgeProps {
  /** Raw API enum value, e.g. "PENDING_PAYMENT". Never throws on unknown values. */
  status: string;
  /** Overrides the mapped severity. */
  severity?: Severity;
  className?: string;
}

export default function StatusBadge({ status, severity, className }: StatusBadgeProps) {
  const raw = typeof status === 'string' ? status : '';
  const resolved: Severity = severity ?? SEVERITY_BY_STATUS[raw.toUpperCase()] ?? 'default';

  return (
    <Badge variant={resolved} className={className} data-status={raw}>
      {humanize(raw) || '—'}
    </Badge>
  );
}
