import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/types';

interface UserCardProps {
  name: User['email'];
  email: string;
}

export default function UserCard({ name, email }: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground text-sm">{email}</p>
      </CardContent>
    </Card>
  );
}
