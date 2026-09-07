import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data stays fresh
      retry: 1, // retry failed requests once
      refetchOnWindowFocus: false, // don't refetch when tab regains focus
    },
  },
});
