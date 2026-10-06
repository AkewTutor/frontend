// API response shape matching your backend's ApiResponse class
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

// User type
export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

// ── shared-config ──────────────────────────────────────────
export type Role = 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  role: Role;
  email: string | null;
  phone: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  userId: string;
  role: Role;
  studentProfileId?: string;
  parentProfileId?: string;
  tutorProfileId?: string;
  grade?: number; // student only
  accountStatus?: string; // student only
  onboardingStatus?: string; // parent only
  verificationStatus?: string; // tutor only
  verificationRequired: boolean;
}

export interface AppNotification {
  id: string;
  type: string; // CLASS_REMINDER | NEW_MESSAGE | COMPLAINT_RESOLVED | etc.
  payload: Record<string, unknown>;
  channel: 'PUSH' | 'EMAIL' | 'SMS';
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export type PolicyType = 'PRIVACY' | 'TERMS' | 'SAFETY' | 'REFUND' | 'RULES';

export interface PolicyDocument {
  type: PolicyType;
  version: number;
  content: string; // markdown
  publishedAt: string;
}

export interface PolicyPublishResult {
  type: PolicyType;
  version: number;
  publishedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  audienceRoles: Role[];
  createdAt: string;
}

// ── accounts-guardianship ──────────────────────────────────
export interface StudentProfile {
  id: string;
  userId: string;
  grade: number;
  school: string | null;
  profilePictureUrl: string | null;
  subjectsOfInterest: string[]; // subject UUIDs
  academicLevel: string | null;
  learningGoals: string | null;
  preferredLanguage: string | null;
  learningSchedulePreference: { days: string[]; timeOfDay: string } | null;
  teachingStylePreference: string | null;
  budgetPreference: string | null; // Decimal-as-string
  formatPreference: 'ONE_TO_ONE' | 'ONE_TO_THREE' | 'ONE_TO_FIVE' | null;
  accountStatus: string;
}

export interface ParentStudentRelationship {
  id: string;
  studentId: string;
  parentId: string;
  status: 'INVITED' | 'ACTIVE' | 'REVOKED';
  createdAt: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  qualifications: string | null;
  experienceYears: number | null;
  education: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface TutorSubjectRanking {
  subjectId: string;
  subjectName: string;
  rank: 1 | 2;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface Subject {
  id: string;
  name: string;
  isActive: boolean;
}

// ── matching-cohorts ───────────────────────────────────────
export type CohortFormat = 'ONE_TO_ONE' | 'ONE_TO_THREE' | 'ONE_TO_FIVE';

export interface TutorRecommendation {
  tutorId: string;
  name: string;
  profilePictureUrl: string | null;
  matchPercentage: number;
}

export interface MatchRequest {
  id: string;
  format: CohortFormat;
  status: 'SEARCHING' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'REJECTED';
  zeroMatchSince: string | null;
}

export interface Cohort {
  cohortId: string;
  format: CohortFormat;
  status: 'FORMING' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ENDED';
  targetGroupSize: number;
  groupFormationWindowExpiresAt: string | null;
  membershipStatus: 'PENDING_PAYMENT' | 'ACTIVE' | 'ENDED';
}

export interface CohortMember {
  // Full detail only for the 1-to-1 tutor's own profile view;
  // group-format members are always name + photo only.
  id: string;
  role: 'TUTOR' | 'STUDENT';
  displayName: string;
  profilePictureUrl: string | null;
}
