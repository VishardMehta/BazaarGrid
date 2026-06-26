import type { PortalNavItem } from "@/components/layout";

/** Shared producer-portal navigation (one consistent sidebar everywhere). */
export const PRODUCER_NAV: PortalNavItem[] = [
  { to: "/producer", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/producer", label: "Inventory", icon: "inventory_2" },
  { to: "/producer", label: "Orders", icon: "receipt_long" },
  { to: "/producer", label: "Analytics", icon: "insights" },
  { to: "/producer", label: "Settings", icon: "settings" },
];

export const VILLAGE_ADMIN_NAV: PortalNavItem[] = [
  { to: "/village-admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/village-admin", label: "Producers", icon: "groups" },
  { to: "/village-admin", label: "Storefront", icon: "storefront" },
  { to: "/village-admin", label: "Campaigns", icon: "campaign" },
  { to: "/village-admin", label: "Settings", icon: "settings" },
];
