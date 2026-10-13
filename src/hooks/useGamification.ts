import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Badge, Leaderboard, XPProgress } from '@/types';

// `studentId` is only for a Parent viewing a child (FR-SP-014); the server ignores it for a Student.
export function useMyProgress(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.XP_PROGRESS, studentId],
    queryFn: () =>
      api.get<XPProgress>('/gamification/xp/me', { params: { studentId } }).then((r) => r.data),
  });
}

// Live server-computed view: plain non-optimistic read (07-06 §6.8).
export function useLeaderboard(period: 'WEEKLY' | 'MONTHLY', studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEADERBOARD, period, studentId],
    queryFn: () =>
      api
        .get<Leaderboard>('/gamification/leaderboard', { params: { period, studentId } })
        .then((r) => r.data),
  });
}

export function useMyBadges(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.MY_BADGES, studentId],
    queryFn: () =>
      api
        .get<{ badges: Badge[] }>('/gamification/badges/me', { params: { studentId } })
        .then((r) => r.data),
  });
}
