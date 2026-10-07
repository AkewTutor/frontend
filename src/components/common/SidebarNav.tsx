import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/common/navItems';

export interface SidebarProps {
  /** Called after a link is clicked (used to close the mobile drawer). */
  onNavigate?: () => void;
}

interface SidebarNavProps extends SidebarProps {
  items: NavItem[];
  label: string;
}

export default function SidebarNav({ items, label, onNavigate }: SidebarNavProps) {
  return (
    <nav
      aria-label={label}
      className="h-full w-64 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent',
                  isActive
                    ? 'border-sidebar-primary bg-sidebar-accent font-bold text-sidebar-foreground'
                    : 'border-transparent'
                )
              }
            >
              <FontAwesomeIcon icon={item.icon} className="w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
