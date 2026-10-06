import SidebarNav, { type SidebarProps } from '@/components/common/SidebarNav';
import { PARENT_NAV } from '@/components/common/navItems';

export default function ParentSidebar(props: SidebarProps) {
  return <SidebarNav items={PARENT_NAV} label="Parent navigation" {...props} />;
}
