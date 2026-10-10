import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { TutorEarningsResponse } from '@/types';

export function useMyEarnings(page = 1) {
  return useQuery({
    queryKey: [QUERY_KEYS.EARNINGS, page],
    queryFn: () =>
      api
        .get<TutorEarningsResponse>('/tutors/me/earnings', { params: { page, limit: 20 } })
        .then((r) => r.data),
  });
}
