import { useQuery } from '@tanstack/react-query';
import UserCard from '@/components/common/UserCard';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants';
import type { User } from '@/types';

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (isError) return <p className="text-destructive">Failed to load users.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.map((user) => (
        <UserCard key={user.id} name={user.email} email={user.email} />
      ))}
    </div>
  );
}
