import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Button, Card, Icon } from "@/components/ui";
import { TraceabilityScore } from "@/components/shared";
import { formatPrice, formatDate, formatMonthYear, compact } from "@/lib/format";
import { currentBuyer, getOrdersByBuyer, getSellerById } from "@/shared/mocks";

const TABS = ["Personal Info", "Order History", "Saved Addresses", "Rewards", "Payment Methods", "Preferences"] as const;
type Tab = (typeof TABS)[number];

export function MyProfilePage() {
  const buyer = currentBuyer;
  const orders = getOrdersByBuyer(buyer.id);
  const [tab, setTab] = useState<Tab>("Personal Info");
  const address = buyer.addresses?.[0];

  return (
    <div className="container-page py-token-md">
      {/* Identity */}
      <div className="flex flex-wrap items-center justify-between gap-token-md">
        <div className="flex items-center gap-4">
          <Avatar name={buyer.name} src={buyer.avatarUrl} size="xl" />
          <div>
            <h1 className="font-serif text-headline-lg font-semibold text-on-surface">{buyer.name}</h1>
            <p className="mt-1 inline-flex items-center gap-2 text-body-md text-on-surface-variant">
              <Badge tone="turmeric" icon="workspace_premium">{buyer.tier} Member</Badge>
              {buyer.memberSince && <span>Member since {formatMonthYear(buyer.memberSince)}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="edit">Edit profile</Button>
          <Button variant="ghost" icon="logout">Logout</Button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-token-md flex gap-1 overflow-x-auto border-b border-surface-highest">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-label-md font-semibold transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Content (Personal Info is the rich default; others summarised) */}
      {tab === "Personal Info" && (
        <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
          <Card padding="md">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Personal details</h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              {[
                ["Full name", buyer.name],
                ["Email address", buyer.email],
                ["Phone number", buyer.phone ?? "—"],
                ["Loyalty tier", `${buyer.tier} Member`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">{k}</dt>
                  <dd className="mt-0.5 text-body-md font-medium text-on-surface">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <TraceabilityScore score={buyer.traceabilityScore ?? 90} caption="Your Traceability Score" className="self-start" />
        </div>
      )}

      {tab === "Order History" && (
        <Card padding="none" className="mt-token-md overflow-hidden">
          <table className="w-full text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Order</th>
                <th className="px-token-md py-2.5 font-semibold">Date</th>
                <th className="px-token-md py-2.5 font-semibold">Producer</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3 font-medium text-on-surface">{o.id}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{formatDate(o.placedAt)}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{getSellerById(o.primarySellerId ?? "")?.name ?? "—"}</td>
                  <td className="px-token-md py-3"><Badge tone={o.status === "DELIVERED" ? "green" : "turmeric"}>{o.status.replace("_", " ").toLowerCase()}</Badge></td>
                  <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-surface-highest px-token-md py-3 text-center">
            <Link to="/orders" className="text-label-md font-semibold text-secondary hover:text-primary">Open full order history →</Link>
          </div>
        </Card>
      )}

      {(tab === "Saved Addresses" || tab === "Payment Methods" || tab === "Preferences" || tab === "Rewards") && (
        <div className="mt-token-md grid gap-token-md sm:grid-cols-3">
          <Card padding="md">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Rewards balance</p>
            <p className="mt-1 font-serif text-headline-lg font-semibold text-tertiary">{compact(buyer.rewardsBalance ?? 0)}</p>
            <Link to="/rewards" className="mt-1 inline-block text-label-md font-semibold text-secondary hover:text-primary">Redeem →</Link>
          </Card>
          <Card padding="md">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Primary address</p>
            {address ? (
              <p className="mt-1 text-body-md text-on-surface">{address.line1}, {address.city} {address.postalCode}</p>
            ) : (
              <p className="mt-1 text-body-md text-on-surface-variant">No address saved.</p>
            )}
            <button className="mt-1 inline-flex items-center gap-1 text-label-md font-semibold text-secondary"><Icon name="edit" size={14} /> Edit address</button>
          </Card>
          <Card padding="md">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Active payment</p>
            <p className="mt-1 inline-flex items-center gap-2 text-body-md text-on-surface"><Icon name="credit_card" size={18} /> Visa •••• 4242</p>
            <button className="mt-1 inline-flex items-center gap-1 text-label-md font-semibold text-secondary"><Icon name="settings" size={14} /> Manage cards</button>
          </Card>
        </div>
      )}
    </div>
  );
}
