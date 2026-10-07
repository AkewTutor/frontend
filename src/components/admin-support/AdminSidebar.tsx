import SidebarNav, { type SidebarProps } from '@/components/common/SidebarNav';
import { ADMIN_NAV } from '@/components/common/navItems';

export default function AdminSidebar(props: SidebarProps) {
  return <SidebarNav items={ADMIN_NAV} label="Admin navigation" {...props} />;
}
