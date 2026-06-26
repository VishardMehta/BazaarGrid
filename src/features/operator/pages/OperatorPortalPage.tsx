import { useState } from "react";
import { Button, Card, Chip, Icon, Input, Select } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { PortalLayout, type PortalNavItem } from "@/components/layout";
import { gradientFor } from "@/lib/placeholder";
import { products, sellers, getSellerById } from "@/shared/mocks";
import { CsvUpload } from "@/features/catalog/components/CsvUpload";

const OPERATOR_NAV: PortalNavItem[] = [
  { to: "/operator", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/operator", label: "Villages", icon: "cottage" },
  { to: "/operator", label: "Producers", icon: "groups" },
  { to: "/operator", label: "Inventory", icon: "inventory_2" },
  { to: "/operator", label: "Analytics", icon: "insights" },
];

const CRAFTS = ["Textiles", "Ceramics", "Culinary", "Woodworking"];

const RECENT = [
  { name: "Marco Valente", craft: "Olive Wood Artisan" },
  { name: "Sana Khan", craft: "Master Weaver" },
  { name: "Borgo San Leo", craft: "New Village Hub" },
];

export function OperatorPortalPage() {
  const [crafts, setCrafts] = useState<string[]>(["Textiles"]);
  const toggle = (c: string) =>
    setCrafts((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <PortalLayout
      portalName="Local Operator Portal"
      items={OPERATOR_NAV}
      user={{ name: "Julia Doe", meta: "Operator · North Region" }}
      action={{ label: "Onboard Village", to: "/operator", icon: "add_location_alt" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Local Onboarding</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Manage local heritage networks and digital-twin integration.
          </p>
        </div>
        <Button icon="add_business">Onboard new village</Button>
      </div>

      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified Villages" value="14" icon="cottage" delta="+2 this quarter" deltaTone="up" />
        <StatCard label="Producers" value={sellers.length} icon="groups" />
        <StatCard label="Live SKUs" value={products.length} icon="inventory_2" />
        <StatCard label="Compliance Queue" value="3" icon="rule" delta="Awaiting docs" deltaTone="down" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.5fr_1fr]">
        {/* Quick add producer */}
        <Card padding="md">
          <h2 className="flex items-center gap-2 font-serif text-headline-md font-medium text-on-surface">
            <Icon name="person_add" size={22} className="text-secondary" /> Quick add: heritage producer
          </h2>
          <form onSubmit={(e) => e.preventDefault()} className="mt-token-sm grid gap-token-md sm:grid-cols-2">
            <Input label="Full name / artisan identity" placeholder="e.g. Elena Rossi" required />
            <Select label="Village association" defaultValue="">
              <option value="">Select a village</option>
              {sellers.map((s) => (
                <option key={s.id}>{s.village}</option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-label-md font-semibold text-secondary">Craft category</p>
              <div className="flex flex-wrap gap-2">
                {CRAFTS.map((c) => (
                  <Chip key={c} selected={crafts.includes(c)} onClick={() => toggle(c)}>{c}</Chip>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" icon="fingerprint">Initialise digital identity</Button>
            </div>
          </form>

          <div className="mt-token-md border-t border-surface-highest pt-token-md">
            <h3 className="flex items-center gap-2 font-serif text-headline-md font-medium text-on-surface">
              <Icon name="cloud_upload" size={20} className="text-secondary" /> Bulk upload inventory &amp; docs
            </h3>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Upload a CSV with certification references to batch-create products with traceability QR links.
            </p>
            <div className="mt-3">
              <CsvUpload />
            </div>
          </div>
        </Card>

        {/* Active network + recent */}
        <div className="grid gap-token-md">
          <Card padding="md" className="bg-secondary text-secondary-on">
            <p className="text-label-md uppercase tracking-wide text-secondary-on/80">Active network</p>
            <p className="mt-1 font-serif text-display-lg text-[2.5rem] font-semibold leading-none">14</p>
            <p className="text-label-md text-secondary-on/85">Verified local villages</p>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-headline-md font-medium text-on-surface">Recent onboardings</h3>
              <Icon name="schedule" size={18} className="text-on-surface-variant" />
            </div>
            <ul className="mt-2 space-y-3">
              {RECENT.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full ring-2 ring-surface-lowest" style={{ backgroundImage: gradientFor(r.name) }} />
                  <span className="flex-1">
                    <span className="block text-body-md font-medium text-on-surface">{r.name}</span>
                    <span className="block text-label-sm text-on-surface-variant">{r.craft}</span>
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Inventory overview */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="border-b border-surface-highest px-token-md py-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Inventory overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Product</th>
                <th className="px-token-md py-2.5 font-semibold">Village</th>
                <th className="px-token-md py-2.5 font-semibold">Producer</th>
                <th className="px-token-md py-2.5 font-semibold">Stock</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {products.slice(0, 6).map((p) => {
                const seller = getSellerById(p.sellerId);
                return (
                  <tr key={p.id} className="hover:bg-surface-low">
                    <td className="px-token-md py-3 font-medium text-on-surface">{p.name}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{seller?.village}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{seller?.name}</td>
                    <td className="px-token-md py-3">
                      <span className={`inline-flex items-center gap-1 ${(p.stock ?? 0) < 20 ? "text-primary" : "text-secondary"}`}>
                        <Icon name="circle" size={8} filled /> {p.stock ?? 0} units
                      </span>
                    </td>
                    <td className="px-token-md py-3 text-right font-semibold text-on-surface">${p.price.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PortalLayout>
  );
}
