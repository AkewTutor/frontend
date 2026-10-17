import { useMutation } from '@tanstack/react-query';

import api from '@/lib/axios';
import type { CohortFormat } from '@/types';

// POST /format-switch. Fire-and-toast: no local list to invalidate.
// The API (06-api) takes { toFormat } (+ optional studentId for a parent); the student is the
// caller, so the page's cohortId is not sent. Sending { cohortId, targetFormat } was a 400.
export function useRequestFormatSwitch() {
  return useMutation({
    mutationFn: ({ targetFormat }: { cohortId: string; targetFormat: CohortFormat }) =>
      api.post('/format-switch', { toFormat: targetFormat }).then((r) => r.data),
  });
}
