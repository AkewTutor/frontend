import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { Subject } from '@/types';

// GET /subjects. Public catalog = ACTIVE only. `includeInactive` is for the Admin Subject Management page.
// Distinct keys, both under the [SUBJECTS] prefix, so one invalidation refreshes both.
export function useSubjects(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive === true;
  return useQuery({
    queryKey: includeInactive
      ? [QUERY_KEYS.SUBJECTS, { includeInactive: true }]
      : [QUERY_KEYS.SUBJECTS],
    queryFn: () =>
      api
        .get<{ subjects: Subject[] }>('/subjects', {
          params: includeInactive ? { includeInactive: true } : undefined,
        })
        .then((r) => r.data),
  });
}
