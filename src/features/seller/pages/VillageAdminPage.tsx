import { Button, Card, Icon, Input, Textarea } from "@/components/ui";
import { StatCard, SellerBadge } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { gradientFor } from "@/lib/placeholder";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile, useSellers } from "@/lib/hooks/useSellers";
import { mapSeller } from "@/lib/mappers";


export function VillageAdminPage() {
  const { profile } = useAuth();
  const { data: myProfile } = useMySellerProfile(profile?.id ?? null);
  const { data: allSellers = [] } = useSellers();
  const producers        = allSellers.filter((s) => s.village_id === myProfile?.village_id && s.status === "ACTIVE");
  const pendingProducers = allSellers.filter((s) => s.village_id === myProfile?.village_id && s.status === "PENDING");
  const villageName = myProfile?.village ?? profile?.name ?? "Your Village";
  const region      = myProfile?.region ?? "";

  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: villageName, meta: `${producers.length} producers` }}
      action={{ label: "Add Producer", to: "/village-admin/producers", icon: "person_add" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">{villageName}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Managing {producers.length} producers · {region}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-label-md font-semibold text-secondary-on-container">
          <Icon name="trending_up" size={16} /> Village health: Active
        </span>
      </div>

      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Producers" value={producers.length} icon="groups" />
        <StatCard label="Live Products" value={producers.reduce((n, p) => n + (p.product_count ?? 0), 0)} icon="inventory_2" />
        <StatCard label="Avg Traceability" value="91%" icon="verified" delta="+4%" deltaTone="up" />
        <StatCard label="Pending Approvals" value={pendingProducers.length} icon="pending_actions" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.3fr_1fr]">
        {/* Producer approvals */}
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-surface-highest px-token-md py-3">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Pending producer approvals</h2>
          </div>
          <ul className="divide-y divide-surface-highest">
            {pendingProducers.length === 0 && producers.length === 0 && (
              <li className="py-8 text-center text-on-surface-variant text-label-sm">No producers in this village yet.</li>
            )}
            {pendingProducers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-token-md py-3">
                <div>
                  <p className="font-medium text-on-surface">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.region} · Pending approval</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon="close">Reject</Button>
                  <Button size="sm" icon="check">Approve</Button>
                </div>
              </li>
            ))}
            {producers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-token-md py-3">
                <SellerBadge seller={mapSeller(p)} link={false} />
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
              style={{ backgroundImage: gradientFor((myProfile?.village_id ?? "banner") + "banner") }}
            >
              <Icon name="image" size={28} className="opacity-70" />
            </div>
            <Input className="mt-3" label="Village tagline" placeholder="Enter a tagline for your village" />
            <Textarea className="mt-3" label="Village story" placeholder="Share your village's story…" rows={3} />
            <Button className="mt-4" icon="save">Save storefront</Button>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Village network</h3>
            <ul className="mt-2 space-y-2">
              {producers.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md bg-surface-low px-3 py-2 text-label-md">
                  <span className="text-on-surface">{s.name}</span>
                  <span className="font-semibold text-secondary">{s.traceability_score}% traced</span>
                </li>
              ))}
              {producers.length === 0 && (
                <li className="text-label-sm text-on-surface-variant">No active producers yet.</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
