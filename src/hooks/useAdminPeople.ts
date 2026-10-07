import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AdminPeopleResponse, Role } from '@/types';

// GET /admin/people (Admin). `role` and `search` are optional filters.
export function useUsers(page = 1, role?: Role, search?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_PEOPLE, page, role, search],
    queryFn: () =>
      api
        .get<AdminPeopleResponse>('/admin/people', { params: { page, limit: 20, role, search } })
        .then((r) => r.data),
  });
}
