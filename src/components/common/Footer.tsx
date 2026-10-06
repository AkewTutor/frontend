import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants';

const POLICIES = [
  { type: 'PRIVACY', label: 'Privacy policy' },
  { type: 'TERMS', label: 'Terms of service' },
  { type: 'SAFETY', label: 'Safety' },
  { type: 'REFUND', label: 'Refund policy' },
  { type: 'RULES', label: 'Platform rules' },
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto flex max-w-site flex-col gap-space-md px-space-gutter py-space-lg md:flex-row md:items-center md:justify-between">
        <p className="text-s text-white/70">© {new Date().getFullYear()} AKEWTutor</p>
        <nav aria-label="Policies" className="flex flex-wrap gap-x-6 gap-y-2">
          {POLICIES.map(({ type, label }) => (
            <Link
              key={type}
              to={ROUTES.POLICY.replace(':type', type)}
              className="text-s text-white transition-colors hover:text-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
