export const ROUTES = {
  // HOME stays until useAuth/PublicRoute use roleDefaultRoute (Dev A, Phase 1), then delete
  HOME: '/',
  LOGIN: '/login',

  // â”€â”€ shared-config â”€â”€
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

  // role landing paths (target of roleDefaultRoute, doc 8-1)
  STUDENT_HOME: '/student',
  PARENT_HOME: '/parent',
  TUTOR_HOME: '/tutor',
  ADMIN_HOME: '/admin',

  // â”€â”€ accounts-guardianship â”€â”€
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

  // â”€â”€ matching-cohorts â”€â”€
  STUDENT_FIND_TUTOR: '/student/find-tutor',
  STUDENT_RECOMMENDATIONS: '/student/recommendations',
  STUDENT_TUTOR_VIEW: '/student/tutors/:tutorId',
  STUDENT_GROUP_STATUS: '/student/group-status',
  STUDENT_FORMAT_SWITCH: '/student/format-switch',
  ADMIN_MATCHING_QUEUE: '/admin/matching-queue',
  ADMIN_MANUAL_ASSIGNMENT: '/admin/manual-assignment',

  // â”€â”€ class-delivery-library â”€â”€
  STUDENT_UPCOMING_CLASSES: '/student/upcoming-classes',
  TUTOR_MY_CLASSES: '/tutor/classes',
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

  // â”€â”€ messaging â”€â”€
  MESSAGING: '/messaging',
  ADMIN_MESSAGE_THREAD: '/admin/messaging/:threadId',

  // â”€â”€ gamification-engagement â”€â”€
  STUDENT_ACHIEVEMENTS: '/student/achievements',
  STUDENT_LEADERBOARD: '/student/leaderboard',
  STUDENT_CHALLENGES: '/student/challenges',
  ADMIN_BADGES: '/admin/badges',
  ADMIN_CHALLENGES: '/admin/challenges',

  // â”€â”€ payments-earnings â”€â”€
  PAYMENTS: '/payments',
  PAYMENT_HISTORY: '/payments/history',
  PAYMENT_PAUSED: '/payments/paused',
  TUTOR_EARNINGS: '/tutor/earnings',
  ADMIN_PRICING: '/admin/pricing',
  ADMIN_REFUNDS: '/admin/refunds',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_PROMOTIONS: '/admin/promotions',

  // â”€â”€ support-trust-admin â”€â”€
  COMPLAINTS: '/complaints',
  SUPPORT: '/support',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_REPORTS: '/admin/reports',
} as const;

export const QUERY_KEYS = {
  // â”€â”€ shared-config â”€â”€
  NOTIFICATIONS: 'notifications',
  POLICY: 'policy',
  ANNOUNCEMENTS: 'announcements',

  // â”€â”€ accounts-guardianship â”€â”€
  STUDENT_PROFILE: 'student-profile',
  TUTOR_PROFILE: 'tutor-profile',
  AVAILABILITY: 'availability',
  SUBJECTS: 'subjects',
  RELATIONSHIPS: 'relationships',
  PENDING_TUTORS: 'pending-tutors',
  ADMIN_PEOPLE: 'admin-people',

  // â”€â”€ matching-cohorts â”€â”€
  TUTOR_SEARCH: 'tutor-search',
  RECOMMENDATIONS: 'recommendations',
  TUTOR_PROFILE_VIEW: 'tutor-profile-view',
  MATCH_REQUESTS: 'match-requests',
  MY_COHORTS: 'my-cohorts',
  COHORT_MEMBERS: 'cohort-members',
  MATCHING_QUEUE: 'matching-queue',

  // â”€â”€ class-delivery-library â”€â”€
  SESSIONS: 'sessions',
  SESSION_DETAIL: 'session-detail',
  RECORDING_CONSENT: 'recording-consent',
  RECORDINGS: 'recordings',
  RECORDING_COMPLIANCE: 'recording-compliance',
  SIGNED_URL: 'signed-url',
  LIBRARY_MATERIALS: 'library-materials',
  ASSESSMENTS: 'assessments',
  SESSION_MISSES: 'session-misses',

  // â”€â”€ messaging â”€â”€
  THREAD: 'thread',
  MESSAGES: 'messages',
  ADMIN_THREAD: 'admin-thread',

  // â”€â”€ gamification-engagement â”€â”€
  XP_PROGRESS: 'xp-progress',
  LEADERBOARD: 'leaderboard',
  MY_BADGES: 'my-badges',
  ADMIN_BADGES: 'admin-badges',
  CHALLENGES: 'challenges',
  CHALLENGE_PROGRESS: 'challenge-progress',

  // â”€â”€ payments-earnings â”€â”€
  PAYMENT_HISTORY: 'payment-history',
  PAUSE_STATUS: 'pause-status',
  PRICING: 'pricing',
  EARNINGS: 'earnings',
  REFUNDS: 'refunds',
  PAYOUTS: 'payouts',
  PROMOTIONS: 'promotions',

  // â”€â”€ support-trust-admin â”€â”€
  MY_COMPLAINTS: 'my-complaints',
  COMPLAINT_DETAIL: 'complaint-detail',
  SUPPORT_CONTACT: 'support-contact',
  DISPUTE_QUEUE: 'dispute-queue',
  DISPUTE_DETAIL: 'dispute-detail',
  PLATFORM_HEALTH: 'platform-health',
  TUTOR_PERFORMANCE: 'tutor-performance',
  ACTIVITY_HISTORY: 'activity-history',
} as const;
