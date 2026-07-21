import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon, Avatar } from "@/components/ui";
import { Logo } from "./Logo";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: string;
  /** Match the route exactly (for index/dashboard links). */
  end?: boolean;
}

interface PortalSidebarProps {
  /** Portal name shown under the logo, e.g. "Producer Portal". */
  portalName: string;
  items: PortalNavItem[];
  /** Identity shown at the bottom. */
  user: { name: string; meta?: string; avatarUrl?: string };
  /** Optional primary action (e.g. "Add Product"). */
  action?: { label: string; to: string; icon?: string };
}

/**
 * STANDARDISED portal sidebar. The Stitch exports drew the producer / village /
 * operator sidebars slightly differently — this single component unifies them
 * so every portal in the app is consistent. (Design-inconsistency decision.)
 */
export function PortalSidebar({ portalName, items, user, action }: PortalSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-surface-highest bg-surface-lowest md:flex">
      <div className="px-token-md py-token-md">
        <Logo />
        <p className="mt-1 text-label-sm font-medium uppercase tracking-[0.08em] text-on-surface-variant">
          {portalName}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-token-sm">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-body-md font-medium transition-colors",
                isActive
                  ? "bg-secondary-container text-secondary-on-container"
                  : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
              )
            }
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-surface-highest p-token-sm">
        {action && (
          <NavLink
            to={action.to}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-label-md font-semibold uppercase tracking-[0.05em] text-primary-on shadow-tinted transition-colors hover:bg-primary-container"
          >
            <Icon name={action.icon ?? "add"} size={18} />
            {action.label}
          </NavLink>
        )}
        <div className="flex items-center gap-2 px-1 py-1">
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-label-md font-semibold text-on-surface">{user.name}</span>
            {user.meta && <span className="truncate text-label-sm text-on-surface-variant">{user.meta}</span>}
          </span>
        </div>
      </div>
    </aside>
  );
}
