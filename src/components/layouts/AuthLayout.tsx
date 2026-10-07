import { Link, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

import { ROUTES } from '@/constants';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-space-lg bg-linear-to-br from-hero-from via-hero-via to-hero-to px-space-gutter py-space-lg">
      <Link to={ROUTES.LANDING} className="flex items-center gap-2 text-white">
        <FontAwesomeIcon icon={faGraduationCap} className="text-accent" aria-hidden="true" />
        <span className="text-l font-light">AKEWTutor</span>
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
