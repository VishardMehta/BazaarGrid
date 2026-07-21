import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui";
import { PortalSidebar, type PortalNavItem } from "./PortalSidebar";
import { Logo } from "./Logo";

interface PortalLayoutProps {
  portalName: string;
  items: PortalNavItem[];
  user: { name: string; meta?: string; avatarUrl?: string };
  action?: { label: string; to: string; icon?: string };
  children: ReactNode;
}

/** Two-pane portal shell (sidebar + content) used by all dashboards. */
export function PortalLayout({ portalName, items, user, action, children }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-low">
      <PortalSidebar portalName={portalName} items={items} user={user} action={action} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (sidebar is desktop-only) */}
        <div className="flex items-center justify-between border-b border-surface-highest bg-surface-lowest px-token-md py-3 md:hidden">
          <div>
            <Logo />
            <p className="text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              {portalName}
            </p>
          </div>
          <Link to="/" aria-label="Back to marketplace" className="text-on-surface-variant">
            <Icon name="storefront" size={24} />
          </Link>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 px-token-md py-token-md md:px-token-lg"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
