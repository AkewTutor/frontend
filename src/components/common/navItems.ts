import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
  faBell,
  faBook,
  faBullhorn,
  faCalendarDays,
  faChartLine,
  faChartPie,
  faClockRotateLeft,
  faClipboardList,
  faComments,
  faCreditCard,
  faFileLines,
  faFlag,
  faGavel,
  faHouse,
  faLifeRing,
  faListCheck,
  faMagnifyingGlass,
  faMedal,
  faMoneyBill,
  faPause,
  faPercent,
  faReceipt,
  faStar,
  faTag,
  faTrophy,
  faUser,
  faUserCheck,
  faUserPlus,
  faUsers,
  faVideo,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';

import { ROUTES } from '@/constants';

export interface NavItem {
  label: string;
  to: string;
  icon: IconDefinition;
  /** Exact match only (role home links). */
  end?: boolean;
}

const shared: NavItem[] = [
  { label: 'Messages', to: ROUTES.MESSAGING, icon: faComments },
  { label: 'Library', to: ROUTES.LIBRARY, icon: faBook },
  { label: 'Complaints', to: ROUTES.COMPLAINTS, icon: faFlag },
  { label: 'Support', to: ROUTES.SUPPORT, icon: faLifeRing },
];

export const STUDENT_NAV: NavItem[] = [
  { label: 'Home', to: ROUTES.STUDENT_HOME, icon: faHouse, end: true },
  { label: 'Profile', to: ROUTES.STUDENT_PROFILE, icon: faUser },
  { label: 'Find a tutor', to: ROUTES.STUDENT_FIND_TUTOR, icon: faMagnifyingGlass },
  { label: 'Recommendations', to: ROUTES.STUDENT_RECOMMENDATIONS, icon: faStar },
  { label: 'Group status', to: ROUTES.STUDENT_GROUP_STATUS, icon: faUsers },
  { label: 'Upcoming classes', to: ROUTES.STUDENT_UPCOMING_CLASSES, icon: faCalendarDays },
  { label: 'Progress', to: ROUTES.STUDENT_PROGRESS, icon: faChartLine },
  { label: 'Achievements', to: ROUTES.STUDENT_ACHIEVEMENTS, icon: faMedal },
  { label: 'Leaderboard', to: ROUTES.STUDENT_LEADERBOARD, icon: faTrophy },
  { label: 'Challenges', to: ROUTES.STUDENT_CHALLENGES, icon: faBolt },
  { label: 'Guardian invite', to: ROUTES.STUDENT_GUARDIAN_INVITE, icon: faUserPlus },
  { label: 'Payments', to: ROUTES.PAYMENTS, icon: faCreditCard, end: true },
  { label: 'Payment history', to: ROUTES.PAYMENT_HISTORY, icon: faReceipt },
  ...shared,
];

export const PARENT_NAV: NavItem[] = [
  { label: 'Home', to: ROUTES.PARENT_HOME, icon: faHouse, end: true },
  { label: 'Add student', to: ROUTES.PARENT_ADD_STUDENT, icon: faUserPlus },
  { label: 'Guardian settings', to: ROUTES.PARENT_GUARDIAN_SETTINGS, icon: faUserCheck },
  { label: 'Payments', to: ROUTES.PAYMENTS, icon: faCreditCard, end: true },
  { label: 'Payment history', to: ROUTES.PAYMENT_HISTORY, icon: faReceipt },
  { label: 'Paused payments', to: ROUTES.PAYMENT_PAUSED, icon: faPause },
  ...shared,
];

export const TUTOR_NAV: NavItem[] = [
  { label: 'Home', to: ROUTES.TUTOR_HOME, icon: faHouse, end: true },
  { label: 'Profile', to: ROUTES.TUTOR_PROFILE, icon: faUser },
  { label: 'Subjects', to: ROUTES.TUTOR_SUBJECTS, icon: faListCheck },
  { label: 'Availability', to: ROUTES.TUTOR_AVAILABILITY, icon: faClockRotateLeft },
  { label: 'Session misses', to: ROUTES.TUTOR_SESSION_MISSES, icon: faClipboardList },
  { label: 'Earnings', to: ROUTES.TUTOR_EARNINGS, icon: faMoneyBill },
  ...shared,
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Home', to: ROUTES.ADMIN_HOME, icon: faHouse, end: true },
  { label: 'Tutor verification', to: ROUTES.ADMIN_TUTOR_VERIFICATION, icon: faUserCheck },
  { label: 'People', to: ROUTES.ADMIN_PEOPLE, icon: faUsers },
  { label: 'Subjects', to: ROUTES.ADMIN_SUBJECTS, icon: faBook },
  { label: 'Matching queue', to: ROUTES.ADMIN_MATCHING_QUEUE, icon: faListCheck },
  { label: 'Manual assignment', to: ROUTES.ADMIN_MANUAL_ASSIGNMENT, icon: faUserPlus },
  { label: 'Recording compliance', to: ROUTES.ADMIN_RECORDING_COMPLIANCE, icon: faVideo },
  { label: 'Library', to: ROUTES.ADMIN_LIBRARY, icon: faFileLines },
  { label: 'Session misses', to: ROUTES.ADMIN_SESSION_MISSES, icon: faClipboardList },
  { label: 'Badges', to: ROUTES.ADMIN_BADGES, icon: faMedal },
  { label: 'Challenges', to: ROUTES.ADMIN_CHALLENGES, icon: faBolt },
  { label: 'Pricing', to: ROUTES.ADMIN_PRICING, icon: faTag },
  { label: 'Promotions', to: ROUTES.ADMIN_PROMOTIONS, icon: faPercent },
  { label: 'Refunds', to: ROUTES.ADMIN_REFUNDS, icon: faReceipt },
  { label: 'Payouts', to: ROUTES.ADMIN_PAYOUTS, icon: faMoneyBill },
  { label: 'Disputes', to: ROUTES.ADMIN_DISPUTES, icon: faGavel },
  { label: 'Reports', to: ROUTES.ADMIN_REPORTS, icon: faChartPie },
  { label: 'Announcements', to: ROUTES.ADMIN_ANNOUNCEMENTS, icon: faBullhorn },
  { label: 'Policies', to: ROUTES.ADMIN_POLICIES, icon: faFileLines },
];

// Re-exported so the bell can reuse it later without another import.
export const NOTIFICATION_ICON = faBell;
