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