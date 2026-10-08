import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { AvailabilitySlot } from '@/types';

export function useMyAvailability() {
  return useQuery({
    queryKey: [QUERY_KEYS.AVAILABILITY],
    queryFn: () =>
      api.get<{ slots: AvailabilitySlot[] }>('/tutors/me/availability').then((r) => r.data),
  });
}

// dayOfWeek is only required when isRecurring is true. startTime/endTime are ISO 8601 datetimes.
export function useAddSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      dayOfWeek?: number;
      startTime: string;
      endTime: string;
      isRecurring: boolean;
    }) => api.post<AvailabilitySlot>('/tutors/me/availability', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.AVAILABILITY] }),
  });
}

export function useRemoveSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) =>
      api.delete(`/tutors/me/availability/${slotId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.AVAILABILITY] }),
  });
}
