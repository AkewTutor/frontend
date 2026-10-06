import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faGraduationCap, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/common/NotificationBell';

interface AppHeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

export default function AppHeader({ menuOpen, onMenuClick }: AppHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 bg-primary shadow-header">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={onMenuClick}
            className="grid size-10 place-items-center text-white md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <Link to={ROUTES.LANDING} className="flex items-center gap-2 text-white">
            <FontAwesomeIcon icon={faGraduationCap} className="text-accent" aria-hidden="true" />
            <span className="text-l font-light">AKEWTutor</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          {user && <span className="hidden text-s text-white/85 sm:inline">{user.email}</span>}{' '}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-pill bg-dark px-4 py-2 text-s font-semibold text-white transition-colors hover:bg-black"
          >
            <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
