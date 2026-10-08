import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faUserCheck, faUsers, faVideo } from '@fortawesome/free-solid-svg-icons';

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
      <section
        data-surface="dark"
        className="bg-[#12535b] bg-[url('/hero-bg.webp')] bg-cover bg-center bg-no-repeat text-white font-sans min-h-screen flex flex-col justify-start pt-20 pb-12 relative overflow-x-hidden selection:bg-brand-accent selection:text-black antialiased"
      >
        <main
          className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex-1 flex flex-col justify-start relative py-0 lg:py-0"
          data-purpose="hero-section"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[580px]">
            {/* Left Column: Copy & CTAs */}
            <div className="lg:col-span-6 z-10 flex flex-col justify-center max-w-xl">
              {/* Subtitle / Eyebrow */}
              <p className="text-white/80 text-[15px] font-normal mb-4 tracking-normal">
                Online tutoring
              </p>

              {/* Main Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] leading-[1.12] font-normal tracking-tight text-white mb-6">
                Find the <span className="text-brand-accent font-normal">right</span> tutor, learn
                with confidence.
              </h1>

              {/* Supporting Body Text */}
              <p className="text-white/80 text-sm sm:text-[15px] leading-relaxed max-w-lg mb-8 font-light">
                AKEWTutor connects students with verified tutors for one-to-one and small-group
                classes, online.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-14">
                <Link
                  to={ROUTES.REGISTER_STUDENT}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-slate-900 font-medium px-7 py-3 rounded-full text-sm transition-transform active:scale-95 duration-150 shadow-sm text-center"
                >
                  Get started
                </Link>
                <Link
                  to={ROUTES.REGISTER_TUTOR}
                  className="bg-white/5 hover:bg-white/10 text-white font-normal px-7 py-3 rounded-full text-sm border border-white/30 backdrop-blur-sm transition duration-150 text-center"
                >
                  Become a tutor
                </Link>
              </div>

              {/* Social Proof Metric Badge (Mapped to Parent CTA) */}
              <div className="flex items-center gap-3.5" data-purpose="audience-indicators">
                {/* Overlapping Avatars */}
                <div className="flex -space-x-2.5 items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#d5f2e8] text-teal-900 font-semibold text-xs ring-2 ring-[#12535b]">
                    P
                  </span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#efc76d] text-amber-950 font-semibold text-xs ring-2 ring-[#12535b]">
                    S
                  </span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1b2528] text-white font-semibold text-xs ring-2 ring-[#12535b]">
                    T
                  </span>
                </div>
                {/* Description Text */}
                <div className="text-xs">
                  <p className="font-medium text-white tracking-tight">Parent?</p>
                  <Link
                    to={ROUTES.REGISTER_PARENT}
                    className="text-white/60 font-light text-[11px] underline hover:text-white transition-colors"
                  >
                    Create a parent account
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Student Visual & Glass Feature Floating Badges */}
            <div className="lg:col-span-6 relative flex items-center justify-center h-full min-h-[460px] lg:min-h-[580px]">
              {/* Center Character Image Container */}
              <div className="relative w-full max-w-[500px] flex justify-center items-end h-[500px] lg:h-[580px]">
                <div className="relative w-full h-full flex justify-center items-end overflow-visible">
                  <img
                    alt="Happy student giving thumbs up"
                    className="object-contain object-bottom w-auto h-[85%] sm:h-[90%] lg:h-[95%] max-h-[580px] pointer-events-none drop-shadow-2xl select-none translate-y-6"
                    src="/hero-student.webp"
                  />
                </div>

                {/* Glass Card 1: Top Right */}
                <div
                  className="absolute top-24 right-6 sm:right-12 glass-stat-card rounded-xl p-3.5 px-4 w-[120px] z-20 pointer-events-none -translate-y-12"
                  style={{ top: '26%' }}
                >
                  <svg
                    className="w-5 h-5 text-brand-accent mb-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span className="block text-[11px] text-white/70 font-light leading-tight">
                    Grades
                  </span>
                  <span className="block text-lg font-medium text-white tracking-wide">1–12</span>
                </div>

                {/* Glass Card 2: Mid Left */}
                <div
                  className="absolute bottom-8 left-4 sm:left-6 glass-stat-card rounded-xl p-3.5 px-4 w-[135px] z-20 pointer-events-none -translate-y-12"
                  style={{ bottom: '22%' }}
                >
                  <svg
                    className="w-5 h-5 text-brand-accent mb-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span className="block text-[11px] text-white/70 font-light leading-tight">
                    Matches approved
                  </span>
                  <span className="block text-base font-medium text-white tracking-tight">
                    Every one
                  </span>
                </div>

                {/* Glass Card 3: Bottom Right */}
                <div
                  className="absolute glass-stat-card rounded-xl p-3.5 px-4 w-[125px] z-20 pointer-events-none -translate-y-12 translate-x-8"
                  style={{ bottom: '8%', right: '10%' }}
                >
                  <svg
                    className="w-5 h-5 text-brand-accent mb-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <span className="block text-[11px] text-white/70 font-light leading-tight">
                    Class formats
                  </span>
                  <span className="block text-xl font-medium text-white tracking-tight">3</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12 pb-24 -mt-8 relative z-30">
        <ul className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-card md:grid-cols-4">
          {FEATURES.map(({ icon, title }) => (
            <li
              key={title}
              className="flex flex-col items-center gap-3 p-6 text-center text-ink transition-all duration-300 hover:bg-brand-accent/10 motion-safe:hover:-translate-y-[10px]"
            >
              <FontAwesomeIcon icon={icon} className="text-xl text-brand-teal" aria-hidden="true" />
              <span className="text-sm font-semibold">{title}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
