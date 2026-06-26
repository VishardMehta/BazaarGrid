import { Button, Card, Icon, Input, Textarea } from "@/components/ui";
import { StatCard, SellerBadge } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { gradientFor } from "@/lib/placeholder";
import { sellers } from "@/shared/mocks";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";

const village = sellers[0];
const producers = sellers.filter((s) => s.type === "VILLAGE_PRODUCER");

const PENDING = [
  { name: "Marta's Olive Co.", craft: "Oils", note: "2 products awaiting review" },
  { name: "Coast Leather Hold", craft: "Crafts", note: "New producer application" },
];

const ALERTS = [
  { sku: "BG-007", producer: "Old Oak Mill", status: "Restocking", tone: "turmeric" },
  { sku: "BG-012", producer: "Coast Artisans", status: "Expiring soon", tone: "terracotta" },
];

export function VillageAdminPage() {
  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: village.village, meta: `${producers.length} producers` }}
      action={{ label: "Add Producer", to: "/village-admin", icon: "person_add" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">{village.village}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Managing {producers.length} producers · {village.region}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-label-md font-semibold text-secondary-on-container">
          <Icon name="trending_up" size={16} /> Village health: Active
        </span>
      </div>

      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Producers" value={producers.length} icon="groups" />
        <StatCard label="Live Products" value={producers.reduce((n, p) => n + (p.productCount ?? 0), 0)} icon="inventory_2" />
        <StatCard label="Avg Traceability" value="91%" icon="verified" delta="+4%" deltaTone="up" />
        <StatCard label="Pending Approvals" value={PENDING.length} icon="pending_actions" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.3fr_1fr]">
        {/* Producer approvals */}
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-surface-highest px-token-md py-3">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Pending producer approvals</h2>
          </div>
          <ul className="divide-y divide-surface-highest">
            {PENDING.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 px-token-md py-3">
                <div>
                  <p className="font-medium text-on-surface">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.craft} · {p.note}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon="close">Reject</Button>
                  <Button size="sm" icon="check">Approve</Button>
                </div>
              </li>
            ))}
            {producers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-token-md py-3">
                <SellerBadge seller={p} link={false} />
                <span className="inline-flex items-center gap-1 text-label-sm font-semibold text-secondary">
                  <Icon name="check_circle" size={16} filled /> Active
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Storefront branding + alerts */}
        <div className="grid gap-token-md">
          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Village storefront</h3>
            <div
              className="mt-3 grid h-24 place-items-center rounded-lg text-surface-lowest"
              style={{ backgroundImage: gradientFor(village.id + "banner") }}
            >
              <Icon name="image" size={28} className="opacity-70" />
            </div>
            <Input className="mt-3" label="Village tagline" defaultValue={village.tagline} />
            <Textarea className="mt-3" label="Village story" defaultValue={village.story} rows={3} />
            <div className="mt-3">
              <p className="mb-1.5 text-label-md font-semibold text-secondary">Brand accents</p>
              <div className="flex gap-2">
                {(village.brandAccents ?? []).map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full ring-2 ring-surface-lowest" style={{ background: c }} />
                ))}
                <button className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-outline text-outline">
                  <Icon name="add" size={16} />
                </button>
              </div>
            </div>
            <Button className="mt-4" icon="save">Save storefront</Button>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Quality &amp; stock alerts</h3>
            <ul className="mt-2 space-y-2">
              {ALERTS.map((a) => (
                <li key={a.sku} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-label-md">
                  <span className="text-on-surface">{a.sku} · {a.producer}</span>
                  <span className={`font-semibold ${a.tone === "terracotta" ? "text-primary" : "text-tertiary"}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
