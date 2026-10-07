import SidebarNav, { type SidebarProps } from '@/components/common/SidebarNav';
import { STUDENT_NAV } from '@/components/common/navItems';

export default function StudentSidebar(props: SidebarProps) {
  return <SidebarNav items={STUDENT_NAV} label="Student navigation" {...props} />;
}
