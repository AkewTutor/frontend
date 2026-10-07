import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faGraduationCap, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';

import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';

const policyPath = (type: string) => ROUTES.POLICY.replace(':type', type);

const NAV_LINKS = [
  { label: 'Home', to: ROUTES.LANDING },
  { label: 'Safety', to: policyPath('SAFETY') },
  { label: 'Privacy', to: policyPath('PRIVACY') },
  { label: 'Terms', to: policyPath('TERMS') },
  { label: 'Become a tutor', to: ROUTES.REGISTER_TUTOR },
];

interface TopNavBarProps {
  /** Transparent over a hero until the page scrolls; solid otherwise. */
  transparentAtTop?: boolean;
}

export default function TopNavBar({ transparentAtTop = false }: TopNavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const authed = !!token && !!user;
  const authTo = authed ? roleDefaultRoute(user.role) : ROUTES.LOGIN;
  const authLabel = authed ? 'Dashboard' : 'Log In';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const solid = !transparentAtTop || scrolled;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        solid ? 'bg-primary shadow-header' : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-site items-center justify-between px-space-gutter">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2 text-white">
          <FontAwesomeIcon icon={faGraduationCap} className="text-accent" aria-hidden="true" />
          <span className="text-l font-light">AKEWTutor</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'relative text-m font-light text-white/85 hover:text-white',
                  isActive && 'font-bold text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-0 h-[3px] w-[26px] rounded-pill bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to={authTo}
            className="hidden items-center gap-3 rounded-pill bg-dark py-1 pr-1 pl-4 text-s font-semibold text-white transition-colors hover:bg-black md:inline-flex"
          >
            {authLabel}
            <span className="grid size-[38px] place-items-center rounded-full bg-accent text-accent-foreground">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
            </span>
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center text-white md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute top-0 left-0 flex h-full w-[300px] flex-col gap-2 bg-white p-6">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="mb-4 grid size-10 place-items-center self-end text-dark"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            {[...NAV_LINKS, { label: authLabel, to: authTo }].map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('py-2 text-m text-dark', isActive && 'font-bold text-primary')
                }
              >
                {label}
              </NavLink>
            ))}
          </aside>
        </div>
      )}
    </header>
  );
}
