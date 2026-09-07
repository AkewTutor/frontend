import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { User } from '@/types';

export function useUsers() {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => api.post<User>('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
    },
  });
}
