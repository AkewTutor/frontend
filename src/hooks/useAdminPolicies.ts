import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import api from '@/lib/axios';
import type { PolicyPublishResult, PolicyType } from '@/types';

export interface PublishPolicyBody {
  type: PolicyType;
  content: string;
}

// POST /admin/policies (UC-85). Creates a NEW immutable version; never edits in place.
export function usePublishPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PublishPolicyBody) =>
      api.post<PolicyPublishResult>('/admin/policies', body).then((r) => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [QUERY_KEYS.POLICY, vars.type] }),
  });
}
