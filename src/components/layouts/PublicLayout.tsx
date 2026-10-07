import { Outlet, useLocation } from 'react-router-dom';

import Footer from '@/components/common/Footer';
import TopNavBar from '@/components/common/TopNavBar';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

export default function PublicLayout() {
  const isLanding = useLocation().pathname === ROUTES.LANDING;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNavBar transparentAtTop={isLanding} />
      <main className={cn('flex-1', !isLanding && 'pt-16')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
