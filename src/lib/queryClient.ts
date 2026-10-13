import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data stays fresh
      retry: 1, // retry failed requests once
      refetchOnWindowFocus: false, // don't refetch when tab regains focus
    },
  },
});

// Cached data belongs to one signed-in user. Drop the whole cache whenever the user
// changes (logout, login as someone else, failed token refresh), so one account never
// sees or re-saves another account's cached profile.
let currentUserId = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const nextUserId = state.user?.id ?? null;
  if (nextUserId !== currentUserId) {
    currentUserId = nextUserId;
    queryClient.clear();
  }
});
