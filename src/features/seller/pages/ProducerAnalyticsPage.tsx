import { Card, Icon } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { formatPrice } from "@/lib/format";
import { PRODUCER_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";
import { useSellerOrders } from "@/lib/hooks/useOrders";
import { useAllSellerProducts } from "@/lib/hooks/useProducts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function ProducerAnalyticsPage() {
  const { profile }             = useAuth();
  const { data: seller }        = useMySellerProfile(profile?.id ?? null);
  const { data: myOrders   = [] } = useSellerOrders(seller?.id ?? null);
  const { data: myProducts = [] } = useAllSellerProducts(seller?.id ?? null);

  const liveProducts  = myProducts.filter((p) => p.status === "LIVE");
  const validOrders   = myOrders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue  = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = validOrders.length ? totalRevenue / validOrders.length : 0;

  // Last 6 months of real revenue, grouped by placed_at
  const now = new Date();
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_NAMES[d.getMonth()], revenue: 0, orders: 0 };
  });
  const byMonth = new Map(monthly.map((b) => [b.key, b]));
  for (const o of validOrders) {
    const d = new Date(o.placed_at);
    const b = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (b) { b.revenue += o.total; b.orders += 1; }
  }
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));

  // Month-over-month revenue delta
  const thisM = monthly[5].revenue, lastM = monthly[4].revenue;
  const revDelta = lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : null;

  // Average rating across live products, weighted by review count
  const totalReviews = liveProducts.reduce((n, p) => n + (p.review_count ?? 0), 0);
  const avgRating = totalReviews
    ? liveProducts.reduce((s, p) => s + (p.rating ?? 0) * (p.review_count ?? 0), 0) / totalReviews
    : null;

  // Fulfilment SLA from real order timestamps
  const completed = myOrders.filter((o) => o.status === "COMPLETED");
  const hoursTaken = (o: (typeof myOrders)[number]) =>
    (new Date(o.updated_at).getTime() - new Date(o.placed_at).getTime()) / 36e5;
  const avgFulfilHrs = completed.length
    ? completed.reduce((s, o) => s + hoursTaken(o), 0) / completed.length
    : null;
  const onTimeRate = completed.length
    ? Math.round((completed.filter((o) => hoursTaken(o) <= 72).length / completed.length) * 100)
    : null;
  const cancelRate = myOrders.length
    ? Math.round((myOrders.filter((o) => o.status === "CANCELLED").length / myOrders.length) * 100)
    : null;
  const openOrders = myOrders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length;

  const fmtHrs = (h: number) => (h < 48 ? `${h.toFixed(1)} hrs` : `${(h / 24).toFixed(1)} days`);
  const slaRows = [
    { label: "Avg fulfilment time", value: avgFulfilHrs != null ? fmtHrs(avgFulfilHrs) : "No data yet", target: "< 3 days", ok: avgFulfilHrs == null || avgFulfilHrs <= 72 },
    { label: "On-time rate (≤72h)", value: onTimeRate  != null ? `${onTimeRate}%`      : "No data yet", target: "> 90%",   ok: onTimeRate  == null || onTimeRate >= 90 },
    { label: "Cancellation rate",   value: cancelRate  != null ? `${cancelRate}%`      : "No data yet", target: "< 10%",   ok: cancelRate  == null || cancelRate < 10 },
    { label: "Open orders",         value: `${openOrders}`, target: "keep them moving", ok: true },
  ];

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
        <StatCard label="Total Revenue"    value={formatPrice(totalRevenue)} icon="payments"
          delta={revDelta != null ? `${revDelta >= 0 ? "+" : ""}${revDelta}% vs last month` : undefined}
          deltaTone={revDelta == null || revDelta >= 0 ? "up" : "down"} />
        <StatCard label="Total Orders"     value={validOrders.length}         icon="receipt_long"
          delta={`${monthly[5].orders} this month`} deltaTone="up" />
        <StatCard label="Avg Order Value"  value={formatPrice(avgOrderValue)} icon="trending_up" />
        <StatCard label="Avg Rating"       value={avgRating != null ? avgRating.toFixed(1) : "—"} icon="grade"
          delta={totalReviews ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""}` : "No reviews yet"} deltaTone="up" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.5fr_1fr]">
        {/* Monthly revenue chart */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Monthly Revenue</h2>
          <p className="text-label-sm text-on-surface-variant">Last 6 months</p>
          <div className="mt-token-md flex items-end gap-2 h-44">
            {monthly.map((m) => {
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
          {slaRows.map((row) => (
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
