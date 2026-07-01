import { useState } from "react";
import { Button, Card, Icon, Input, Select } from "@/components/ui";
import { SellerBadge } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";
import { useAllSellers, useAddSeller, useUpdateSeller } from "@/lib/hooks/useSellers";
import { mapSeller } from "@/lib/mappers";

export function VillageProducersPage() {
  const { data: allSellers = [] } = useAllSellers();
  const addSeller    = useAddSeller();
  const updateSeller = useUpdateSeller();
  const producers        = allSellers.filter((s) => s.status === "ACTIVE");
  const pendingProducers = allSellers.filter((s) => s.status === "PENDING");
  const villageName = "Your Village";

  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const status = (data.get("status") as string) ?? "PENDING";
    try {
      await addSeller.mutateAsync({
        name:    (data.get("name") as string)?.trim() || "New Producer",
        phone:   (data.get("phone") as string) || null,
        email:   (data.get("email") as string) || null,
        village: (data.get("village") as string) || villageName,
        tagline: "Heritage goods, direct from the source.",
        status:  status === "ACTIVE" ? "ACTIVE" : "PENDING",
        traceability_score: 60,
      });
      setSaved(true);
      form.reset();
      setTimeout(() => { setSaved(false); setShowAddForm(false); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add producer.");
    }
  }

  function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    updateSeller.mutate({ id, status });
  }

  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: villageName, meta: `${producers.length} producers` }}
      action={{ label: "Add Producer", to: "/village-admin/producers", icon: "person_add" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Producers</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {producers.length} active · {pendingProducers.length} pending approval
          </p>
        </div>
        <Button icon="person_add" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? "Cancel" : "Add producer"}
        </Button>
      </div>

      {/* Add producer form */}
      {showAddForm && (
        <Card padding="md" className="mt-token-md border border-secondary/30">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Onboard new producer</h2>
          <form onSubmit={handleSave} className="mt-token-md grid gap-token-md md:grid-cols-2">
            <Input name="name" label="Full name / producer identity" placeholder="e.g. Ramesh Kumar" required />
            <Input name="phone" label="Phone / WhatsApp" placeholder="+91 98765 43210" type="tel" required />
            <Input name="email" label="Email address" placeholder="producer@example.com" type="email" />
            <Select name="category" label="Craft / specialty" defaultValue="">
              <option value="">Select a category</option>
              <option value="HONEY">Honey</option>
              <option value="OILS">Oils & Extracts</option>
              <option value="DAIRY">Dairy</option>
              <option value="GRAINS">Grains & Pulses</option>
              <option value="TEXTILES">Textiles & Weaving</option>
              <option value="POTTERY">Pottery & Ceramics</option>
              <option value="CRAFTS">Handicrafts</option>
            </Select>
            <Input name="village" label="Village / hamlet" defaultValue={villageName} />
            <Select name="status" label="Account status" defaultValue="PENDING">
              <option value="PENDING">Pending review</option>
              <option value="ACTIVE">Active</option>
            </Select>
            {error && <p className="md:col-span-2 text-label-sm text-error">{error}</p>}
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={addSeller.isPending} icon={saved ? "check" : "person_add"}>
                {addSeller.isPending ? "Adding…" : saved ? "Producer added!" : "Add producer"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending approvals */}
      {pendingProducers.length > 0 && (
        <Card padding="none" className="mt-token-md overflow-hidden">
          <div className="border-b border-surface-highest px-token-md py-3">
            <h2 className="font-serif text-headline-md font-medium text-on-surface flex items-center gap-2">
              <Icon name="pending_actions" size={20} className="text-tertiary" />
              Pending approvals
            </h2>
          </div>
          <ul className="divide-y divide-surface-highest">
            {pendingProducers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-token-md py-3">
                <div>
                  <p className="font-medium text-on-surface">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.region} · Pending approval</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon="close"
                    disabled={updateSeller.isPending}
                    onClick={() => setStatus(p.id, "SUSPENDED")}>Reject</Button>
                  <Button size="sm" icon="check"
                    disabled={updateSeller.isPending}
                    onClick={() => setStatus(p.id, "ACTIVE")}>Approve</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Active producers */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-highest px-token-md py-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Active producers</h2>
          <div className="w-48">
            <Input placeholder="Search producers…" className="[&_input]:py-1.5 [&_input]:text-label-sm" aria-label="Search" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Producer</th>
                <th className="px-token-md py-2.5 font-semibold">Products</th>
                <th className="px-token-md py-2.5 font-semibold">Traceability</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {producers.map((p) => (
                <tr key={p.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3"><SellerBadge seller={mapSeller(p)} link={false} /></td>
                  <td className="px-token-md py-3 text-on-surface-variant">—</td>
                  <td className="px-token-md py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-highest">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${p.traceability_score}%` }} />
                      </div>
                      <span className="text-on-surface-variant">{p.traceability_score}%</span>
                    </div>
                  </td>
                  <td className="px-token-md py-3">
                    <span className="inline-flex items-center gap-1 text-label-sm font-semibold text-secondary">
                      <Icon name="check_circle" size={15} filled /> Active
                    </span>
                  </td>
                  <td className="px-token-md py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-high">
                        <Icon name="visibility" size={16} />
                      </button>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-high">
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PortalLayout>
  );
}