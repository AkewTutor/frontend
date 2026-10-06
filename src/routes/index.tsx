import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/constants';
import type { Role } from '@/types';
import PublicLayout from '@/components/layouts/PublicLayout';

// ── shared / public / auth ──
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const PolicyPage = lazy(() => import('@/pages/PolicyPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage')); // moves to @/pages/LoginPage in Phase 1
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const VerifyContactPage = lazy(() => import('@/pages/VerifyContactPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const InviteActivationPage = lazy(() => import('@/pages/InviteActivationPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const RoleHomePage = lazy(() => import('@/pages/RoleHomePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const MessagingPage = lazy(() => import('@/pages/MessagingPage'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const RecordingConsentPage = lazy(() => import('@/pages/RecordingConsentPage'));
const RequestReschedulePage = lazy(() => import('@/pages/RequestReschedulePage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const PaymentHistoryPage = lazy(() => import('@/pages/PaymentHistoryPage'));
const PaymentPausedPage = lazy(() => import('@/pages/PaymentPausedPage'));
const SubmitComplaintPage = lazy(() => import('@/pages/SubmitComplaintPage'));
const SupportContactPage = lazy(() => import('@/pages/SupportContactPage'));

// ── student ──
const AcademicProfilePage = lazy(() => import('@/pages/student/AcademicProfilePage'));
const FindTutorPage = lazy(() => import('@/pages/student/FindTutorPage'));
const TutorRecommendationsPage = lazy(() => import('@/pages/student/TutorRecommendationsPage'));
const TutorProfileViewPage = lazy(() => import('@/pages/student/TutorProfileViewPage'));
const GroupFormatStatusPage = lazy(() => import('@/pages/student/GroupFormatStatusPage'));
const FormatSwitchPage = lazy(() => import('@/pages/student/FormatSwitchPage'));
const UpcomingClassesPage = lazy(() => import('@/pages/student/UpcomingClassesPage'));
const ProgressPage = lazy(() => import('@/pages/student/ProgressPage'));
const AchievementsPage = lazy(() => import('@/pages/student/AchievementsPage'));
const LeaderboardPage = lazy(() => import('@/pages/student/LeaderboardPage'));
const ChallengesPage = lazy(() => import('@/pages/student/ChallengesPage'));

// ── parent ──
const AddStudentPage = lazy(() => import('@/pages/parent/AddStudentPage'));
const GuardianSettingsPage = lazy(() => import('@/pages/parent/GuardianSettingsPage'));

// ── tutor ──
const TutorProfilePage = lazy(() => import('@/pages/tutor/TutorProfilePage'));
const SubjectRankingPage = lazy(() => import('@/pages/tutor/SubjectRankingPage'));
const AvailabilityPage = lazy(() => import('@/pages/tutor/AvailabilityPage'));
const ConductClassPage = lazy(() => import('@/pages/tutor/ConductClassPage'));
const WeeklyAssessmentPage = lazy(() => import('@/pages/tutor/WeeklyAssessmentPage'));
const TutorSessionMissesPage = lazy(() => import('@/pages/tutor/TutorSessionMissesPage'));
const EarningsPage = lazy(() => import('@/pages/tutor/EarningsPage'));

// ── admin ──
const AnnouncementsPage = lazy(() => import('@/pages/admin/AnnouncementsPage'));
const PolicyManagementPage = lazy(() => import('@/pages/admin/PolicyManagementPage'));
const TutorVerificationPage = lazy(() => import('@/pages/admin/TutorVerificationPage'));
const PeopleManagementPage = lazy(() => import('@/pages/admin/PeopleManagementPage'));
const SubjectManagementPage = lazy(() => import('@/pages/admin/SubjectManagementPage'));
const MatchingQueuePage = lazy(() => import('@/pages/admin/MatchingQueuePage'));
const ManualAssignmentPage = lazy(() => import('@/pages/admin/ManualAssignmentPage'));
const RecordingComplianceQueuePage = lazy(
  () => import('@/pages/admin/RecordingComplianceQueuePage')
);
const AdminLibraryPage = lazy(() => import('@/pages/admin/AdminLibraryPage'));
const AdminSessionMissesPage = lazy(() => import('@/pages/admin/AdminSessionMissesPage'));
const MessageThreadReviewPage = lazy(() => import('@/pages/admin/MessageThreadReviewPage'));
const BadgeManagementPage = lazy(() => import('@/pages/admin/BadgeManagementPage'));
const ChallengeManagementPage = lazy(() => import('@/pages/admin/ChallengeManagementPage'));
const PricingConfigPage = lazy(() => import('@/pages/admin/PricingConfigPage'));
const RefundReviewPage = lazy(() => import('@/pages/admin/RefundReviewPage'));
const PayoutManagementPage = lazy(() => import('@/pages/admin/PayoutManagementPage'));
const PromotionManagementPage = lazy(() => import('@/pages/admin/PromotionManagementPage'));
const DisputeQueuePage = lazy(() => import('@/pages/admin/DisputeQueuePage'));
const PlatformReportsPage = lazy(() => import('@/pages/admin/PlatformReportsPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

type Page = LazyExoticComponent<ComponentType>;

const leaf = (path: string, Page: Page): RouteObject => ({
  path,
  element: withSuspense(<Page />),
});

// One guard + DashboardLayout per role set (each leaf is guarded individually per
// its feature spec; no blanket /student/* lock).
// TODO(Phase 1, Dev A): pass roles into the guard -> <ProtectedRoute roles={roles} />
const guarded = (roles: Role[] | 'any', children: RouteObject[]): RouteObject => ({
  element: <ProtectedRoute />,
  handle: { roles },
  children: [{ element: <DashboardLayout />, children }],
});

const router = createBrowserRouter([
  // Public (no auth concept)
  {
    element: <PublicLayout />,
    children: [leaf(ROUTES.LANDING, LandingPage), leaf(ROUTES.POLICY, PolicyPage)],
  },

  // Guest actions
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          leaf(ROUTES.LOGIN, LoginPage),
          leaf(ROUTES.REGISTER_STUDENT, RegisterPage),
          leaf(ROUTES.REGISTER_PARENT, RegisterPage),
          leaf(ROUTES.REGISTER_TUTOR, RegisterPage),
          leaf(ROUTES.VERIFY_CONTACT, VerifyContactPage),
          leaf(ROUTES.FORGOT_PASSWORD, ForgotPasswordPage),
          leaf(ROUTES.RESET_PASSWORD, ResetPasswordPage),
          leaf(ROUTES.INVITE_ACTIVATION, InviteActivationPage),
        ],
      },
    ],
  },

  // Student only
  guarded(
    ['STUDENT'],
    [
      leaf(ROUTES.STUDENT_HOME, RoleHomePage),
      leaf(ROUTES.STUDENT_PROFILE, AcademicProfilePage),
      leaf(ROUTES.STUDENT_GUARDIAN_INVITE, GuardianSettingsPage),
    ]
  ),

  // Parent only
  guarded(
    ['PARENT'],
    [
      leaf(ROUTES.PARENT_HOME, RoleHomePage),
      leaf(ROUTES.PARENT_ADD_STUDENT, AddStudentPage),
      leaf(ROUTES.PARENT_GUARDIAN_SETTINGS, GuardianSettingsPage),
    ]
  ),

  // Student or Parent (parent acts for a Grade 1-5 child)
  guarded(
    ['STUDENT', 'PARENT'],
    [
      leaf(ROUTES.STUDENT_FIND_TUTOR, FindTutorPage),
      leaf(ROUTES.STUDENT_RECOMMENDATIONS, TutorRecommendationsPage),
      leaf(ROUTES.STUDENT_TUTOR_VIEW, TutorProfileViewPage),
      leaf(ROUTES.STUDENT_GROUP_STATUS, GroupFormatStatusPage),
      leaf(ROUTES.STUDENT_FORMAT_SWITCH, FormatSwitchPage),
      leaf(ROUTES.STUDENT_UPCOMING_CLASSES, UpcomingClassesPage),
      leaf(ROUTES.STUDENT_PROGRESS, ProgressPage),
      leaf(ROUTES.STUDENT_LEADERBOARD, LeaderboardPage),
      leaf(ROUTES.PAYMENTS, PaymentPage),
      leaf(ROUTES.PAYMENT_HISTORY, PaymentHistoryPage),
      leaf(ROUTES.PAYMENT_PAUSED, PaymentPausedPage),
    ]
  ),

  // Tutor only
  guarded(
    ['TUTOR'],
    [
      leaf(ROUTES.TUTOR_HOME, RoleHomePage),
      leaf(ROUTES.TUTOR_PROFILE, TutorProfilePage),
      leaf(ROUTES.TUTOR_SUBJECTS, SubjectRankingPage),
      leaf(ROUTES.TUTOR_AVAILABILITY, AvailabilityPage),
      leaf(ROUTES.TUTOR_CONDUCT_CLASS, ConductClassPage),
      leaf(ROUTES.TUTOR_ASSESSMENTS, WeeklyAssessmentPage),
      leaf(ROUTES.TUTOR_SESSION_MISSES, TutorSessionMissesPage),
      leaf(ROUTES.TUTOR_EARNINGS, EarningsPage),
    ]
  ),

  // Admin only
  guarded(
    ['ADMIN'],
    [
      leaf(ROUTES.ADMIN_HOME, RoleHomePage),
      leaf(ROUTES.ADMIN_ANNOUNCEMENTS, AnnouncementsPage),
      leaf(ROUTES.ADMIN_POLICIES, PolicyManagementPage),
      leaf(ROUTES.ADMIN_TUTOR_VERIFICATION, TutorVerificationPage),
      leaf(ROUTES.ADMIN_PEOPLE, PeopleManagementPage),
      leaf(ROUTES.ADMIN_SUBJECTS, SubjectManagementPage),
      leaf(ROUTES.ADMIN_MATCHING_QUEUE, MatchingQueuePage),
      leaf(ROUTES.ADMIN_MANUAL_ASSIGNMENT, ManualAssignmentPage),
      leaf(ROUTES.ADMIN_RECORDING_COMPLIANCE, RecordingComplianceQueuePage),
      leaf(ROUTES.ADMIN_LIBRARY, AdminLibraryPage),
      leaf(ROUTES.ADMIN_SESSION_MISSES, AdminSessionMissesPage),
      leaf(ROUTES.ADMIN_MESSAGE_THREAD, MessageThreadReviewPage),
      leaf(ROUTES.ADMIN_BADGES, BadgeManagementPage),
      leaf(ROUTES.ADMIN_CHALLENGES, ChallengeManagementPage),
      leaf(ROUTES.ADMIN_PRICING, PricingConfigPage),
      leaf(ROUTES.ADMIN_REFUNDS, RefundReviewPage),
      leaf(ROUTES.ADMIN_PAYOUTS, PayoutManagementPage),
      leaf(ROUTES.ADMIN_PROMOTIONS, PromotionManagementPage),
      leaf(ROUTES.ADMIN_DISPUTES, DisputeQueuePage),
      leaf(ROUTES.ADMIN_REPORTS, PlatformReportsPage),
    ]
  ),

  // Any logged-in role
  guarded('any', [
    leaf(ROUTES.NOTIFICATIONS, NotificationsPage),
    leaf(ROUTES.MESSAGING, MessagingPage),
    leaf(ROUTES.LIBRARY, LibraryPage),
    leaf(ROUTES.RECORDING_CONSENT, RecordingConsentPage),
    leaf(ROUTES.RESCHEDULE, RequestReschedulePage),
    leaf(ROUTES.STUDENT_ACHIEVEMENTS, AchievementsPage),
    leaf(ROUTES.STUDENT_CHALLENGES, ChallengesPage),
    leaf(ROUTES.COMPLAINTS, SubmitComplaintPage),
    leaf(ROUTES.SUPPORT, SupportContactPage),
  ]),

  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

export default router;
