import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type {
  ActivityEventType,
  ActivityHistoryPage,
  PlatformHealth,
  TutorPerformancePage,
} from '@/types';

// GET /admin/reports/platform-health (UC-90/91). Polled every 60s.
export function usePlatformHealth() {
  return useQuery({
    queryKey: [QUERY_KEYS.PLATFORM_HEALTH],
    queryFn: () => api.get<PlatformHealth>('/admin/reports/platform-health').then((r) => r.data),
    refetchInterval: 60_000,
  });
}

// GET /admin/reports/tutor-performance (UC-91, FR-AD-022). No polling.
export function useTutorPerformance(params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  verificationStatus?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.TUTOR_PERFORMANCE, params],
    queryFn: () =>
      api
        .get<TutorPerformancePage>('/admin/reports/tutor-performance', { params })
        .then((r) => r.data),
  });
}

// GET /admin/reports/activity (UC-91, FR-AD-021). Server defaults: dateRange=30d, all types. No polling.
export function useActivityHistory(params: {
  page?: number;
  limit?: number;
  dateRange?: '7d' | '30d' | '90d' | 'all';
  eventType?: ActivityEventType;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVITY_HISTORY, params],
    queryFn: () =>
      api.get<ActivityHistoryPage>('/admin/reports/activity', { params }).then((r) => r.data),
  });
}
