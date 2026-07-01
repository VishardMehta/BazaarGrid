import type { PortalNavItem } from "@/components/layout";

export const PRODUCER_NAV: PortalNavItem[] = [
  { to: "/producer",            label: "Dashboard", icon: "dashboard",     end: true },
  { to: "/producer/inventory",  label: "Inventory", icon: "inventory_2" },
  { to: "/producer/orders",     label: "Orders",    icon: "receipt_long" },
  { to: "/producer/analytics",  label: "Analytics", icon: "insights" },
  { to: "/producer/settings",   label: "Settings",  icon: "settings" },
];

export const VILLAGE_ADMIN_NAV: PortalNavItem[] = [
  { to: "/village-admin",                label: "Dashboard",  icon: "dashboard",  end: true },
  { to: "/village-admin/producers",      label: "Producers",  icon: "groups" },
  { to: "/village-admin/storefront",     label: "Storefront", icon: "storefront" },
  { to: "/village-admin/campaigns",      label: "Campaigns",  icon: "campaign" },
  { to: "/village-admin/settings",       label: "Settings",   icon: "settings" },
];

export const OPERATOR_NAV: PortalNavItem[] = [
  { to: "/operator",              label: "Dashboard", icon: "dashboard",    end: true },
  { to: "/operator/villages",     label: "Villages",  icon: "cottage" },
  { to: "/operator/producers",    label: "Producers", icon: "groups" },
  { to: "/operator/inventory",    label: "Inventory", icon: "inventory_2" },
  { to: "/operator/analytics",    label: "Analytics", icon: "insights" },
];
