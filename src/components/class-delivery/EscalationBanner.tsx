import { Button } from '@/components/ui/button';

export interface EscalationBannerProps {
  visible: boolean;
  tutorIds?: string[];
  onSelectTutor?: (id: string) => void;
}

export default function EscalationBanner({
  visible,
  tutorIds,
  onSelectTutor,
}: EscalationBannerProps) {
  if (!visible) return null;

  if (tutorIds && tutorIds.length > 0) {
    return (
      <div className="escalation-banner list-mode">
        <strong>Escalated Tutors:</strong>
        <div className="tutor-chips">
          {tutorIds.map((id) => (
            <Button key={id} variant="ghost" size="sm" onClick={() => onSelectTutor?.(id)}>
              {id}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="escalation-banner single-mode">
      <strong>Action Required:</strong> This tutor has exceeded the allowed missed sessions
      threshold.
    </div>
  );
}
