import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';

export interface PolicyResponse {
  title: string;
  content: string;
  [key: string]: unknown;
}

export function usePolicy(type: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.POLICY, type],
    queryFn: () => api.get<PolicyResponse>(`/policies/${type}`).then((res) => res.data),
  });
}
