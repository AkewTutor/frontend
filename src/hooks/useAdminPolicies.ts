import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { PolicyPublishResult, PolicyType } from '@/types';

export interface PublishPolicyBody {
  type: PolicyType;
  content: string;
}

// POST /policies/:type (UC-85, admin only; type is in the path, body is { content }). Creates a NEW immutable version; never edits in place.
export function usePublishPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, content }: PublishPolicyBody) =>
      api.post<PolicyPublishResult>(`/policies/${type}`, { content }).then((r) => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [QUERY_KEYS.POLICY, vars.type] }),
  });
}
