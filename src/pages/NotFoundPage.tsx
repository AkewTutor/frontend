import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-space-md px-space-gutter text-center">
      <p className="text-display font-bold text-primary">404</p>
      <p className="text-m text-muted-foreground">We couldn&apos;t find that page.</p>
      <Button asChild>
        <Link to={ROUTES.LANDING}>Go to home page</Link>
      </Button>
    </div>
  );
}
