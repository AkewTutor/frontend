import { useMutation } from '@tanstack/react-query';

import api from '@/lib/axios';
import type { CohortFormat } from '@/types';

// POST /format-switch. Fire-and-toast: no local list to invalidate.
// NOTE: body follows 07 §3.5; the API doc lists { studentId, toFormat } (unresolved).
export function useRequestFormatSwitch() {
  return useMutation({
    mutationFn: (body: { cohortId: string; targetFormat: CohortFormat }) =>
      api.post('/format-switch', body).then((r) => r.data),
  });
}
