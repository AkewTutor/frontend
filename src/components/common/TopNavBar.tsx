import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

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
        solid ? 'bg-[#12535b] shadow-header' : 'bg-transparent'
      )}
      data-purpose="site-header"
    >
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between z-20">
        <Link
          to={ROUTES.LANDING}
          className="flex items-center gap-3 text-white font-medium text-xl tracking-tight transition hover:opacity-90"
        >
          <svg
            aria-hidden="true"
            className="w-7 h-7 text-brand-accent fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"></path>
          </svg>
          <span className="font-normal text-[21px] tracking-wide">AKEWTutor</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'relative text-m font-light text-white/85 hover:text-white transition-all duration-200',
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
            className="hidden md:flex items-center gap-2.5 bg-black hover:bg-neutral-900 transition-colors duration-150 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
          >
            <span className="w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center text-black">
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </span>
            <span className="text-white pr-1">{authLabel}</span>
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
