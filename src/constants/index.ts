export const ROUTES = {
  // ── template (removed in Phase 1) ──
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',

  // ── shared-config ──
  LANDING: '/',
  POLICY: '/policies/:type',
  REGISTER_STUDENT: '/register/student',
  REGISTER_PARENT: '/register/parent',
  REGISTER_TUTOR: '/register/tutor',
  VERIFY_CONTACT: '/verify-contact',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  NOTIFICATIONS: '/notifications',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_POLICIES: '/admin/policies',

  // ── accounts-guardianship ──
  INVITE_ACTIVATION: '/invite/:token/activate',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_GUARDIAN_INVITE: '/student/guardian-invite',
  PARENT_ADD_STUDENT: '/parent/add-student',
  PARENT_GUARDIAN_SETTINGS: '/parent/guardian-settings',
  TUTOR_PROFILE: '/tutor/profile',
  TUTOR_SUBJECTS: '/tutor/subjects',
  TUTOR_AVAILABILITY: '/tutor/availability',
  ADMIN_TUTOR_VERIFICATION: '/admin/tutor-verification',
  ADMIN_PEOPLE: '/admin/people',
  ADMIN_SUBJECTS: '/admin/subjects',

  // ── matching-cohorts ──
  STUDENT_FIND_TUTOR: '/student/find-tutor',
  STUDENT_RECOMMENDATIONS: '/student/recommendations',
  STUDENT_TUTOR_VIEW: '/student/tutors/:tutorId',
  STUDENT_GROUP_STATUS: '/student/group-status',
  STUDENT_FORMAT_SWITCH: '/student/format-switch',
  ADMIN_MATCHING_QUEUE: '/admin/matching-queue',
  ADMIN_MANUAL_ASSIGNMENT: '/admin/manual-assignment',

  // ── class-delivery-library ──
  STUDENT_UPCOMING_CLASSES: '/student/upcoming-classes',
  TUTOR_CONDUCT_CLASS: '/tutor/conduct-class/:sessionId',
  LIBRARY: '/library',
  RECORDING_CONSENT: '/recording-consent',
  RESCHEDULE: '/reschedule/:sessionId',
  TUTOR_ASSESSMENTS: '/tutor/assessments/:cohortId',
  STUDENT_PROGRESS: '/student/progress',
  ADMIN_RECORDING_COMPLIANCE: '/admin/recording-compliance',
  ADMIN_LIBRARY: '/admin/library', // ?cohortId=:id (query param)
  TUTOR_SESSION_MISSES: '/tutor/session-misses',
  ADMIN_SESSION_MISSES: '/admin/session-misses',

  // ── messaging ──
  MESSAGING: '/messaging',
  ADMIN_MESSAGE_THREAD: '/admin/messaging/:threadId',

  // ── gamification-engagement ──
  STUDENT_ACHIEVEMENTS: '/student/achievements',
  STUDENT_LEADERBOARD: '/student/leaderboard',
  STUDENT_CHALLENGES: '/student/challenges',
  ADMIN_BADGES: '/admin/badges',
  ADMIN_CHALLENGES: '/admin/challenges',

  // ── payments-earnings ──
  PAYMENTS: '/payments',
  PAYMENT_HISTORY: '/payments/history',
  PAYMENT_PAUSED: '/payments/paused',
  TUTOR_EARNINGS: '/tutor/earnings',
  ADMIN_PRICING: '/admin/pricing',
  ADMIN_REFUNDS: '/admin/refunds',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_PROMOTIONS: '/admin/promotions',

  // ── support-trust-admin ──
  COMPLAINTS: '/complaints',
  SUPPORT: '/support',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_REPORTS: '/admin/reports',
} as const;

export const QUERY_KEYS = {
  // ── template (removed in Phase 1) ──
  USERS: 'users',
  PRODUCTS: 'products',

  // ── shared-config ──
  NOTIFICATIONS: 'notifications',
  POLICY: 'policy',
  ANNOUNCEMENTS: 'announcements',

  // ── accounts-guardianship ──
  STUDENT_PROFILE: 'student-profile',
  TUTOR_PROFILE: 'tutor-profile',
  AVAILABILITY: 'availability',
  SUBJECTS: 'subjects',
  RELATIONSHIPS: 'relationships',
  PENDING_TUTORS: 'pending-tutors',
  ADMIN_PEOPLE: 'admin-people',

  // ── matching-cohorts ──
  TUTOR_SEARCH: 'tutor-search',
  RECOMMENDATIONS: 'recommendations',
  TUTOR_PROFILE_VIEW: 'tutor-profile-view',
  MATCH_REQUESTS: 'match-requests',
  MY_COHORTS: 'my-cohorts',
  COHORT_MEMBERS: 'cohort-members',
  MATCHING_QUEUE: 'matching-queue',

  // ── class-delivery-library ──
  SESSIONS: 'sessions',
  SESSION_DETAIL: 'session-detail',
  RECORDING_CONSENT: 'recording-consent',
  RECORDINGS: 'recordings',
  RECORDING_COMPLIANCE: 'recording-compliance',
  SIGNED_URL: 'signed-url',
  LIBRARY_MATERIALS: 'library-materials',
  ASSESSMENTS: 'assessments',
  SESSION_MISSES: 'session-misses',

  // ── messaging ──
  THREAD: 'thread',
  MESSAGES: 'messages',
  ADMIN_THREAD: 'admin-thread',

  // ── gamification-engagement ──
  XP_PROGRESS: 'xp-progress',
  LEADERBOARD: 'leaderboard',
  MY_BADGES: 'my-badges',
  ADMIN_BADGES: 'admin-badges',
  CHALLENGES: 'challenges',
  CHALLENGE_PROGRESS: 'challenge-progress',

  // ── payments-earnings ──
  PAYMENT_HISTORY: 'payment-history',
  PAUSE_STATUS: 'pause-status',
  PRICING: 'pricing',
  EARNINGS: 'earnings',
  REFUNDS: 'refunds',
  PAYOUTS: 'payouts',
  PROMOTIONS: 'promotions',

  // ── support-trust-admin ──
  MY_COMPLAINTS: 'my-complaints',
  COMPLAINT_DETAIL: 'complaint-detail',
  SUPPORT_CONTACT: 'support-contact',
  DISPUTE_QUEUE: 'dispute-queue',
  DISPUTE_DETAIL: 'dispute-detail',
  PLATFORM_HEALTH: 'platform-health',
  TUTOR_PERFORMANCE: 'tutor-performance',
  ACTIVITY_HISTORY: 'activity-history',
} as const;
