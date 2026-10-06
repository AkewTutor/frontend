import SidebarNav, { type SidebarProps } from '@/components/common/SidebarNav';
import { TUTOR_NAV } from '@/components/common/navItems';

export default function TutorSidebar(props: SidebarProps) {
  return <SidebarNav items={TUTOR_NAV} label="Tutor navigation" {...props} />;
}
