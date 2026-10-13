import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';

import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { roleDefaultRoute } from '@/lib/roleDefaultRoute';

/**
 * Public nav. Until standalone pages (Subjects, Pricing, For Parents, FAQ & Contact)
 * exist, each link targets a landing-page section by id. When a page ships, replace
 * its `id` with a `to` route and drop the section id requirement.
 *
 * Required section ids in LandingPage: subjects, how-it-works, pricing,
 * for-parents, faq-contact.
 */
const NAV_LINKS = [
  { label: 'Subjects', id: 'subjects' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'For Parents', id: 'for-parents' },
  { label: 'FAQ & Contact', id: 'faq-contact' },
] as const;

const SIGNUP_OPTIONS = [
  { label: 'Student', hint: 'I want to learn', to: ROUTES.REGISTER_STUDENT },
  { label: 'Parent', hint: 'Register my child', to: ROUTES.REGISTER_PARENT },
  { label: 'Tutor', hint: 'I want to teach', to: ROUTES.REGISTER_TUTOR },
] as const;

const HEADER_OFFSET = 72; // fixed header (64px) + breathing room

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
  return true;
}

interface TopNavBarProps {
  /** Transparent over a hero until the page scrolls; solid otherwise. */
  transparentAtTop?: boolean;
}

export default function TopNavBar({ transparentAtTop = false }: TopNavBarProps) {
  const { pathname, hash } = useLocation();
  const onLanding = pathname === ROUTES.LANDING;

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const signupRef = useRef<HTMLDivElement>(null);

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

  // Scroll to the section named in the URL hash (also when arriving from another
  // public page). Retries briefly because LandingPage may still be lazy-loading.
  useEffect(() => {
    if (!onLanding || !hash) return;
    const id = hash.slice(1);
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (scrollToId(id) || tries >= 15) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [onLanding, hash]);

  // Close drawer + dropdown on Escape.
  useEffect(() => {
    if (!open && !signupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSignupOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, signupOpen]);

  // Close the Sign Up dropdown on outside click.
  useEffect(() => {
    if (!signupOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!signupRef.current?.contains(e.target as Node)) setSignupOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [signupOpen]);

  const solid = !transparentAtTop || scrolled;
  const isActive = (id: string) => onLanding && hash === `#${id}`;

  const onAnchorClick = (id: string) => {
    setOpen(false);
    // Same-hash clicks don't change the location, so scroll explicitly.
    if (onLanding && hash === `#${id}`) scrollToId(id);
  };

  const onLogoClick = () => {
    setOpen(false);
    if (onLanding) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        solid ? 'bg-[#12535b] shadow-header' : 'bg-transparent'
      )}
      data-purpose="site-header"
    >
      <div className="w-full max-w-7xl mx-auto px-6 min-[1024px]:px-8 min-[1100px]:px-12 h-16 flex items-center justify-between gap-6 z-20">
        <Link
          to={ROUTES.LANDING}
          onClick={onLogoClick}
          className="flex shrink-0 items-center gap-3 text-white font-medium text-xl tracking-tight transition hover:opacity-90"
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

        <nav aria-label="Main" className="hidden items-center gap-5 min-[1024px]:flex xl:gap-7">
          {NAV_LINKS.map(({ label, id }) => {
            const active = isActive(id);
            return (
              <Link
                key={id}
                to={{ pathname: ROUTES.LANDING, hash: `#${id}` }}
                onClick={() => onAnchorClick(id)}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'relative whitespace-nowrap text-m font-light text-white/85 hover:text-white transition-all duration-200',
                  active && 'font-bold text-white'
                )}
              >
                {label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-[3px] w-[26px] rounded-pill bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            to={authTo}
            className="hidden min-[1024px]:flex items-center gap-2.5 bg-black hover:bg-neutral-900 transition-colors duration-150 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
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

          {!authed && (
            <div ref={signupRef} className="relative hidden min-[1024px]:block">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={signupOpen}
                onClick={() => setSignupOpen((v) => !v)}
                className="flex items-center gap-2 bg-brand-accent hover:brightness-95 transition px-4 py-2 rounded-full text-sm font-semibold text-black shadow-sm"
              >
                Sign Up
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={cn('text-[10px] transition-transform', signupOpen && 'rotate-180')}
                />
              </button>

              {signupOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-60 overflow-hidden rounded-xl bg-white py-2 shadow-xl"
                >
                  {SIGNUP_OPTIONS.map(({ label, hint, to }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={() => setSignupOpen(false)}
                      className="block px-4 py-2.5 hover:bg-black/5"
                    >
                      <span className="block text-sm font-semibold text-dark">
                        Sign up as {label.toLowerCase()}
                      </span>
                      <span className="block text-xs text-dark/60">{hint}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center text-white min-[1024px]:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 min-[1024px]:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute top-0 left-0 flex h-full w-[300px] flex-col gap-1 overflow-y-auto bg-white p-6">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="mb-4 grid size-10 place-items-center self-end text-dark"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            {NAV_LINKS.map(({ label, id }) => (
              <Link
                key={id}
                to={{ pathname: ROUTES.LANDING, hash: `#${id}` }}
                onClick={() => onAnchorClick(id)}
                className={cn('py-2 text-m text-dark', isActive(id) && 'font-bold text-primary')}
              >
                {label}
              </Link>
            ))}

            <div className="my-3 h-px bg-black/10" />

            <NavLink
              to={authTo}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn('py-2 text-m text-dark', isActive && 'font-bold text-primary')
              }
            >
              {authLabel}
            </NavLink>

            {!authed && (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                  Sign up
                </p>
                {SIGNUP_OPTIONS.map(({ label, hint, to }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="py-2 text-m text-dark"
                  >
                    {label} <span className="text-xs text-dark/50">· {hint}</span>
                  </Link>
                ))}
              </>
            )}
          </aside>
        </div>
      )}
    </header>
  );
}
