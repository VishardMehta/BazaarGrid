import { Card, Icon } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { formatPrice } from "@/lib/format";
import { PRODUCER_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";
import { useSellerOrders } from "@/lib/hooks/useOrders";
import { useAllSellerProducts } from "@/lib/hooks/useProducts";

const MONTHLY = [
  { month: "Jan", revenue: 1240, orders: 14 },
  { month: "Feb", revenue: 1580, orders: 18 },
  { month: "Mar", revenue: 2100, orders: 24 },
  { month: "Apr", revenue: 1890, orders: 21 },
  { month: "May", revenue: 2430, orders: 28 },
  { month: "Jun", revenue: 2780, orders: 32 },
];

export function ProducerAnalyticsPage() {
  const { profile }             = useAuth();
  const { data: seller }        = useMySellerProfile(profile?.id ?? null);
  const { data: myOrders   = [] } = useSellerOrders(seller?.id ?? null);
  const { data: myProducts = [] } = useAllSellerProducts(seller?.id ?? null);

  const liveProducts  = myProducts.filter((p) => p.status === "LIVE");
  const totalRevenue  = myOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = myOrders.length ? totalRevenue / myOrders.length : 0;
  const maxRevenue    = Math.max(...MONTHLY.map((m) => m.revenue));

  const topProducts = [...liveProducts]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <PortalLayout
      portalName="Producer Portal"
      items={PRODUCER_NAV}
      user={{ name: seller?.name ?? profile?.name ?? "…", meta: seller?.village ?? "" }}
      action={{ label: "Add Product", to: "/producer/inventory", icon: "add" }}
    >
      <div>
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Analytics</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Performance overview for your storefront</p>
      </div>

      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue"    value={formatPrice(totalRevenue)} icon="payments"      delta="+18% vs last quarter" deltaTone="up" />
        <StatCard label="Total Orders"     value={myOrders.length}           icon="receipt_long"  delta="+4 this month" deltaTone="up" />
        <StatCard label="Avg Order Value"  value={formatPrice(avgOrderValue)} icon="trending_up"  delta="Above category avg" deltaTone="up" />
        <StatCard label="Store Visits"     value="1,284"                     icon="visibility"    delta="+12%" deltaTone="up" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.5fr_1fr]">
        {/* Monthly revenue chart */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Monthly Revenue</h2>
          <p className="text-label-sm text-on-surface-variant">Last 6 months</p>
          <div className="mt-token-md flex items-end gap-2 h-44">
            {MONTHLY.map((m) => {
              const pct = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-on-surface-variant">{formatPrice(m.revenue)}</span>
                  <div className="relative w-full rounded-t-sm bg-secondary-container overflow-hidden" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-sm bg-secondary transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant">{m.month}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top products */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Top Products</h2>
          <p className="text-label-sm text-on-surface-variant">By customer rating</p>
          <ul className="mt-3 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-high text-label-sm font-bold text-on-surface-variant">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-body-md font-medium text-on-surface">{p.name}</p>
                  <div className="flex items-center gap-1">
                    <Icon name="star" size={13} className="text-tertiary-fixed-dim" filled />
                    <span className="text-label-sm text-on-surface-variant">{p.rating ?? "—"} ({p.review_count ?? 0})</span>
                  </div>
                </div>
                <span className="text-label-md font-semibold text-primary">{formatPrice(p.price, p.currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Order status breakdown */}
      <Card padding="md" className="mt-token-md">
        <h2 className="font-serif text-headline-md font-medium text-on-surface">Order breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Active orders",    count: myOrders.filter((o) => !["COMPLETED","CANCELLED"].includes(o.status as string)).length, color: "bg-secondary", icon: "pending_actions" },
            { label: "Delivered",        count: myOrders.filter((o) => o.status === "COMPLETED").length, color: "bg-tertiary-fixed-dim", icon: "check_circle" },
            { label: "Cancelled",        count: myOrders.filter((o) => o.status === "CANCELLED").length, color: "bg-primary", icon: "cancel" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg bg-surface-low p-token-sm">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.color} text-surface-lowest`}>
                <Icon name={item.icon} size={20} />
              </span>
              <div>
                <p className="font-serif text-headline-md font-semibold text-on-surface">{item.count}</p>
                <p className="text-label-sm text-on-surface-variant">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fulfilment SLA */}
      <Card padding="md" className="mt-token-md">
        <h2 className="font-serif text-headline-md font-medium text-on-surface">Fulfilment SLA</h2>
        <div className="mt-4 space-y-3">
          {[
            { label: "Avg time to confirm", value: "2.1 hrs",  target: "< 4 hrs",  ok: true },
            { label: "Avg time to pack",    value: "5.4 hrs",  target: "< 8 hrs",  ok: true },
            { label: "Avg delivery time",   value: "1.4 days", target: "< 2 days", ok: true },
            { label: "On-time rate",        value: "94%",      target: "> 90%",    ok: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg bg-surface-low px-4 py-2.5">
              <span className="text-body-md text-on-surface-variant">{row.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-on-surface">{row.value}</span>
                <span className="text-label-sm text-on-surface-variant">target: {row.target}</span>
                <Icon name={row.ok ? "check_circle" : "cancel"} size={18} className={row.ok ? "text-secondary" : "text-error"} filled />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PortalLayout>
  );
}
