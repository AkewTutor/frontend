import { useEffect, useState, type ComponentType } from 'react';
import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import AdminSidebar from '@/components/admin-support/AdminSidebar';
import AppHeader from '@/components/common/AppHeader';
import ParentSidebar from '@/components/common/ParentSidebar';
import type { SidebarProps } from '@/components/common/SidebarNav';
import StudentSidebar from '@/components/common/StudentSidebar';
import TutorSidebar from '@/components/common/TutorSidebar';
import { useAuth } from '@/hooks/useAuth';

const SIDEBARS: Record<string, ComponentType<SidebarProps>> = {
  STUDENT: StudentSidebar,
  PARENT: ParentSidebar,
  TUTOR: TutorSidebar,
  ADMIN: AdminSidebar,
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const Sidebar = user ? SIDEBARS[user.role] : undefined;
  if (user && !Sidebar && import.meta.env.DEV) {
    throw new Error(`DashboardLayout: no sidebar for role "${user.role}"`);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader menuOpen={drawerOpen} onMenuClick={() => setDrawerOpen(true)} />

      {Sidebar && (
        <aside className="fixed top-16 bottom-0 left-0 z-30 hidden md:block">
          <Sidebar />
        </aside>
      )}

      {Sidebar && drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 h-full pt-12">
            <div className="h-full bg-sidebar">
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-1 right-2 grid size-10 place-items-center text-white"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      )}

      <main className="pt-16 md:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
