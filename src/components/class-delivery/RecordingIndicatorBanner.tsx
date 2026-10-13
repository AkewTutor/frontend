import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';

interface Props {
  visible: boolean;
}

export default function RecordingIndicatorBanner({ visible }: Props) {
  if (!visible) return null;
  return (
    <div className="flex w-fit items-center gap-2 rounded-md bg-accent/20 px-4 py-2 text-sm text-ink">
      <FontAwesomeIcon icon={faCircle} className="animate-pulse text-danger" />
      This session is being recorded
    </div>
  );
}
