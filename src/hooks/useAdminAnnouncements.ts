import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Announcement, Role } from '@/types';

export interface AnnouncementsResponse {
  announcements: Announcement[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateAnnouncementBody {
  title: string;
  body: string;
  audienceRoles: Role[];
}

export function useAnnouncements(page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.ANNOUNCEMENTS, page],
    queryFn: () =>
      api
        .get<AnnouncementsResponse>('/admin/announcements', { params: { page, limit: 20 } })
        .then((r) => r.data),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAnnouncementBody) =>
      api.post<Announcement>('/admin/announcements', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] }),
  });
}
