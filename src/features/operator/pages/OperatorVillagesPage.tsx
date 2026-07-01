import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Select } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { gradientFor } from "@/lib/placeholder";
import { OPERATOR_NAV } from "@/features/seller/sellerNav";

const VILLAGES = [
  { id: "v1", name: "Green Valley",     region: "Himachal Pradesh", producers: 4, products: 18, score: 94, status: "ACTIVE" as const },
  { id: "v2", name: "Coastal Harvest",  region: "Goa",              producers: 3, products: 12, score: 87, status: "ACTIVE" as const },
  { id: "v3", name: "Desert Rose",      region: "Rajasthan",        producers: 5, products: 22, score: 91, status: "ACTIVE" as const },
  { id: "v4", name: "Hill Top Crafts",  region: "Uttarakhand",      producers: 2, products: 9,  score: 78, status: "ACTIVE" as const },
  { id: "v5", name: "Deccan Spices",    region: "Andhra Pradesh",   producers: 0, products: 0,  score: 0,  status: "PENDING" as const },
];

export function OperatorVillagesPage() {
  const [showForm, setShowForm] = useState(false);
  const [saved,    setSaved]    = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 2000);
  }

  return (
    <PortalLayout
      portalName="Local Operator Portal"
      items={OPERATOR_NAV}
      user={{ name: "Julia Doe", meta: "Operator · North Region" }}
      action={{ label: "Onboard Village", to: "/operator/villages", icon: "add_location_alt" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Villages</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {VILLAGES.filter((v) => v.status === "ACTIVE").length} active · {VILLAGES.filter((v) => v.status === "PENDING").length} pending onboarding
          </p>
        </div>
        <Button icon="add_location_alt" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Onboard village"}
        </Button>
      </div>

      {/* Onboard form */}
      {showForm && (
        <Card padding="md" className="mt-token-md border border-secondary/30">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Onboard new village</h2>
          <form onSubmit={handleSave} className="mt-token-md grid gap-token-md md:grid-cols-2">
            <Input label="Village name" placeholder="e.g. Spice Garden Village" required />
            <Input label="Region / state" placeholder="e.g. Kerala" required />
            <Input label="Coordinator name" placeholder="Contact person" required />
            <Input label="Coordinator phone" placeholder="+91 98765 43210" type="tel" />
            <Input label="Coordinator email" placeholder="coord@village.com" type="email" />
            <Select label="Village type" defaultValue="HERITAGE">
              <option value="HERITAGE">Heritage producer village</option>
              <option value="KIRANA">Kirana cluster</option>
              <option value="MIXED">Mixed marketplace</option>
            </Select>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" icon={saved ? "check" : "add_location_alt"}>
                {saved ? "Village onboarded!" : "Onboard village"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Villages grid */}
      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-3">
        {VILLAGES.map((v) => (
          <Card key={v.id} padding="none" className="overflow-hidden hover:shadow-tinted transition-shadow">
            <div className="h-20 w-full" style={{ backgroundImage: gradientFor(v.id) }} />
            <div className="p-token-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-headline-md font-medium text-on-surface">{v.name}</h3>
                  <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                    <Icon name="location_on" size={13} /> {v.region}
                  </p>
                </div>
                <Badge tone={v.status === "ACTIVE" ? "green" : "turmeric"}>
                  {v.status.toLowerCase()}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Producers", value: v.producers },
                  { label: "Products",  value: v.products },
                  { label: "Score",     value: v.score > 0 ? `${v.score}%` : "—" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md bg-surface-low py-2">
                    <p className="font-serif text-headline-md font-semibold text-on-surface">{stat.value}</p>
                    <p className="text-[11px] text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>
              {v.score > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${v.score}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">Traceability: {v.score}%</p>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" icon="visibility" className="flex-1">View</Button>
                <Button size="sm" variant="secondary" icon="edit" className="flex-1">Manage</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PortalLayout>
  );
}
