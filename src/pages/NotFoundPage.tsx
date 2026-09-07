import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <p className="text-foreground text-2xl font-semibold">404</p>
      <p className="text-muted-foreground text-sm">Page not found</p>
      <Link to={ROUTES.HOME}>
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
