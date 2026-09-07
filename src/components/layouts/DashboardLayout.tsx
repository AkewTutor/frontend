import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <p className="font-semibold text-foreground">template-react</p>
        <div className="flex items-center gap-4">
          {user && <p className="text-muted-foreground text-sm">{user.email}</p>}
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
