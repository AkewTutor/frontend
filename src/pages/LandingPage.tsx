import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faTrophy,
  faUserCheck,
  faUsers,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

const FEATURES = [
  { icon: faUserCheck, title: 'Verified tutors' },
  { icon: faUsers, title: 'One-to-one or small groups' },
  { icon: faVideo, title: 'Live online classes' },
  { icon: faTrophy, title: 'Progress and rewards' },
];

export default function LandingPage() {
  return (
    <>
      <section className="bg-linear-to-br from-hero-from via-hero-via to-hero-to pt-32 pb-40 text-white">
        <div className="mx-auto grid max-w-site items-center gap-space-lg px-space-gutter md:grid-cols-2">
          <div className="flex flex-col items-start gap-space-md">
            <p className="text-s font-semibold tracking-wide text-accent uppercase">
              Online tutoring
            </p>
            <h1 className="text-display font-bold">
              Find the <span className="text-accent">right</span> tutor, learn with confidence.
            </h1>
            <p className="max-w-[520px] text-m text-white/85">
              AKEWTutor connects students with verified tutors for one-to-one and small-group
              classes, online.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={ROUTES.REGISTER_STUDENT}>Get started</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to={ROUTES.REGISTER_TUTOR}>Become a tutor</Link>
              </Button>
            </div>
            <p className="text-s text-white/85">
              Parent?{' '}
              <Link to={ROUTES.REGISTER_PARENT} className="font-semibold text-accent underline">
                Create a parent account
              </Link>
            </p>
          </div>

          {/* Stand-in for the hero cut-out image (not supplied yet) */}
          <div className="hidden justify-center md:flex" aria-hidden="true">
            <div className="grid size-[320px] place-items-center rounded-full bg-accent text-accent-foreground">
              <FontAwesomeIcon icon={faGraduationCap} className="text-[110px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-16 max-w-site px-space-gutter pb-space-lg">
        <ul className="grid grid-cols-2 overflow-hidden rounded-m bg-white shadow-card md:grid-cols-4">
          {FEATURES.map(({ icon, title }) => (
            <li
              key={title}
              className="flex flex-col items-center gap-3 p-6 text-center text-ink transition-all duration-300 hover:bg-accent motion-safe:hover:-translate-y-[30px]"
            >
              <FontAwesomeIcon icon={icon} className="text-l text-primary" aria-hidden="true" />
              <span className="text-m font-semibold">{title}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
