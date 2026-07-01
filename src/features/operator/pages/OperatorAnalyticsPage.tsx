import { Card, Icon } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { formatPrice } from "@/lib/format";
import { OPERATOR_NAV } from "@/features/seller/sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useAllSellers } from "@/lib/hooks/useSellers";
import { useAllOrders } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { useVillages } from "@/lib/hooks/useVillages";


const MONTHLY = [
  { month: "Jan", gmv: 12400 },
  { month: "Feb", gmv: 15800 },
  { month: "Mar", gmv: 21000 },
  { month: "Apr", gmv: 18900 },
  { month: "May", gmv: 24300 },
  { month: "Jun", gmv: 27800 },
];

const maxGmv = Math.max(...MONTHLY.map((m) => m.gmv));

export function OperatorAnalyticsPage() {
  const { profile }                   = useAuth();
  const { data: allSellers = [] }     = useAllSellers();
  const { data: allOrders  = [] }     = useAllOrders();
  const { data: allProducts= [] }     = useProducts({});
  const { data: villages   = [] }     = useVillages();

  const totalGmv        = allOrders.reduce((s, o) => s + o.total, 0);
  const avgTraceability = allSellers.length
    ? Math.round(allSellers.reduce((s, x) => s + x.traceability_score, 0) / allSellers.length)
    : 0;

  return (
    <PortalLayout
      portalName="Local Operator Portal"
      items={OPERATOR_NAV}
      user={{ name: profile?.name ?? "Operator", meta: "Operator Portal" }}
      action={{ label: "Onboard Village", to: "/operator/villages", icon: "add_location_alt" }}
    >
      <div>
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Analytics</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Platform-wide performance across all villages
        </p>
      </div>

      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total GMV"        value={formatPrice(totalGmv)}          icon="payments"     delta="+22% vs last quarter" deltaTone="up" />
        <StatCard label="Verified Villages" value={villages.length}                icon="cottage"      delta="+2 this quarter" deltaTone="up" />
        <StatCard label="Total Orders"     value={allOrders.length}               icon="receipt_long" delta="+18% vs last month" deltaTone="up" />
        <StatCard label="Avg Traceability" value={`${avgTraceability}%`}           icon="verified"     delta="+4% this quarter" deltaTone="up" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
        {/* GMV chart */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Monthly GMV</h2>
          <p className="text-label-sm text-on-surface-variant">Gross merchandise value across all villages</p>
          <div className="mt-token-md flex items-end gap-2 h-48">
            {MONTHLY.map((m) => {
              const pct = (m.gmv / maxGmv) * 100;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-on-surface-variant">{formatPrice(m.gmv)}</span>
                  <div className="relative w-full rounded-t-sm bg-secondary-container overflow-hidden" style={{ height: "128px" }}>
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

        {/* Top villages */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Village breakdown</h2>
          <ul className="mt-3 space-y-3">
            {villages.map((v, i) => {
              const vSellers = allSellers.filter((s) => s.village_id === v.id);
              const score    = vSellers.length
                ? Math.round(vSellers.reduce((s, x) => s + x.traceability_score, 0) / vSellers.length)
                : 0;
              return (
                <li key={v.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm font-bold text-on-surface-variant w-4">{i + 1}</span>
                      <span className="text-body-md font-medium text-on-surface">{v.name}</span>
                    </div>
                    <span className="text-label-md font-semibold text-secondary">{score}% traced</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${score}%` }} />
                  </div>
                </li>
              );
            })}
            {villages.length === 0 && <li className="text-label-sm text-on-surface-variant">No villages yet.</li>}
          </ul>
        </Card>
      </div>

      {/* Village producers table */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="border-b border-surface-highest px-token-md py-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Village producers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Village</th>
                <th className="px-token-md py-2.5 font-semibold">Producers</th>
                <th className="px-token-md py-2.5 font-semibold">Region</th>
                <th className="px-token-md py-2.5 font-semibold">Avg Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {villages.map((v) => {
                const vSellers = allSellers.filter((s) => s.village_id === v.id);
                const score    = vSellers.length
                  ? Math.round(vSellers.reduce((s, x) => s + x.traceability_score, 0) / vSellers.length)
                  : 0;
                return (
                  <tr key={v.id} className="hover:bg-surface-low">
                    <td className="px-token-md py-3 font-medium text-on-surface">{v.name}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{vSellers.length}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{v.region ?? "—"}</td>
                    <td className="px-token-md py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-highest">
                          <div className="h-full rounded-full bg-secondary" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-on-surface-variant">{score}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {villages.length === 0 && (
                <tr><td colSpan={4} className="px-token-md py-10 text-center text-on-surface-variant">No villages yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Key metrics */}
      <div className="mt-token-md grid gap-token-md sm:grid-cols-3">
        {[
          { label: "Live SKUs",         value: allProducts.filter((p) => p.status === "LIVE").length, icon: "inventory_2", color: "bg-secondary-container text-secondary-on-container" },
          { label: "Active Sellers",   value: allSellers.filter((s) => s.status === "ACTIVE").length, icon: "verified",    color: "bg-primary-fixed text-primary-tint" },
          { label: "Compliance queue",  value: 3,                                                   icon: "rule",        color: "bg-error-container text-error" },
        ].map((m) => (
          <Card key={m.label} padding="md" className="flex items-center gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${m.color}`}>
              <Icon name={m.icon} size={22} />
            </span>
            <div>
              <p className="font-serif text-display-lg text-[2rem] font-semibold leading-none text-on-surface">{m.value}</p>
              <p className="text-label-sm text-on-surface-variant">{m.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
