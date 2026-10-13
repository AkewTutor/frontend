import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AdminBadge, AdminBadgesResponse, XPAdjustment } from '@/types';

export function useAllBadges(category?: 'STUDENT' | 'TUTOR', page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_BADGES, category, page],
    queryFn: () =>
      api
        .get<AdminBadgesResponse>('/admin/badges', { params: { category, page, limit: 20 } })
        .then((r) => r.data),
  });
}

export function useAdjustBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      badgeId,
      ...body
    }: {
      badgeId: string;
      criteriaDescription?: string;
      isActive?: boolean;
    }) => api.patch<AdminBadge>(`/admin/badges/${badgeId}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BADGES] }),
  });
}

export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description: string;
      category: 'STUDENT' | 'TUTOR';
      criteriaDescription: string;
      isActive?: boolean;
    }) => api.post<AdminBadge>('/admin/badges', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BADGES] }),
  });
}

// Deliberately invalidates nothing: the Admin surface holds neither the leaderboard nor XP query (07-06 §6.5).
export function useAdjustStudentXP() {
  return useMutation({
    mutationFn: ({
      studentId,
      amount,
      note,
    }: {
      studentId: string;
      amount: number;
      note: string;
    }) =>
      api
        .post<XPAdjustment>(`/admin/students/${studentId}/xp-adjustments`, { amount, note })
        .then((r) => r.data),
  });
}
