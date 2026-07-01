import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Select, Textarea } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";
import { useCampaigns, useAddCampaign, useUpdateCampaignStatus } from "@/lib/hooks/useVillages";

type CampaignStatus = "ACTIVE" | "SCHEDULED" | "ENDED";

const STATUS_TONE: Record<CampaignStatus, "green" | "turmeric" | "info"> = {
  ACTIVE: "green", SCHEDULED: "turmeric", ENDED: "info",
};

export function VillageCampaignsPage() {
  const { profile }      = useAuth();
  const { data: seller } = useMySellerProfile(profile?.id ?? null);
  const { data: campaigns = [] } = useCampaigns(seller?.village_id ?? undefined);
  const addCampaign      = useAddCampaign();
  const updateStatus     = useUpdateCampaignStatus();

  const [showForm, setShowForm] = useState(false);
  const [saved,    setSaved]    = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await addCampaign.mutateAsync({
      village_id:  seller?.village_id ?? null,
      title:       data.get("title") as string,
      type:        data.get("type") as string,
      audience:    data.get("audience") as string,
      start_date:  data.get("startDate") as string,
      end_date:    data.get("endDate") as string,
      description: data.get("description") as string,
      status:      "SCHEDULED",
    });
    setSaved(true);
    form.reset();
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1500);
  }

  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: seller?.village ?? "Village", meta: "campaigns" }}
      action={{ label: "Add Producer", to: "/village-admin/producers", icon: "person_add" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Campaigns</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {campaigns.filter((c) => c.status === "ACTIVE").length} active · {campaigns.filter((c) => c.status === "SCHEDULED").length} scheduled
          </p>
        </div>
        <Button icon="add" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New campaign"}
        </Button>
      </div>

      {/* Create campaign form */}
      {showForm && (
        <Card padding="md" className="mt-token-md border border-secondary/30">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Create campaign</h2>
          <form onSubmit={handleSave} className="mt-token-md grid gap-token-md md:grid-cols-2">
            <Input name="title"    label="Campaign name" placeholder="e.g. Harvest Festival Offer" required className="md:col-span-2" />
            <Select name="type" label="Campaign type" defaultValue="">
              <option value="">Select type</option>
              <option value="REWARDS_BOOST">Rewards boost (double tokens)</option>
              <option value="DISCOUNT">Category or product discount</option>
              <option value="FREE_DELIVERY">Free delivery</option>
              <option value="AWARENESS">Brand awareness / story</option>
            </Select>
            <Select name="audience" label="Target audience" defaultValue="ALL">
              <option value="ALL">All buyers</option>
              <option value="GOLD">Gold & Platinum tier</option>
              <option value="NEW">New buyers</option>
              <option value="LAPSED">Lapsed buyers (30+ days)</option>
            </Select>
            <Input name="startDate" label="Start date" type="date" required />
            <Input name="endDate"   label="End date"   type="date" required />
            <Textarea name="description"
              className="md:col-span-2"
              label="Campaign description"
              placeholder="Describe the campaign offer to buyers…"
              rows={3}
            />
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" icon={saved ? "check" : "campaign"}>
                {saved ? "Campaign created!" : "Launch campaign"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Campaign list */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="border-b border-surface-highest px-token-md py-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">All campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Campaign</th>
                <th className="px-token-md py-2.5 font-semibold">Type</th>
                <th className="px-token-md py-2.5 font-semibold">Duration</th>
                <th className="px-token-md py-2.5 font-semibold">Reach</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className="px-token-md py-10 text-center text-on-surface-variant">No campaigns yet. Create one above.</td></tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3 font-medium text-on-surface">{c.title}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{c.type}</td>
                  <td className="px-token-md py-3 text-on-surface-variant text-label-sm">
                    {c.start_date} → {c.end_date}
                  </td>
                  <td className="px-token-md py-3">
                    {c.reach > 0 ? (
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <Icon name="people" size={14} /> {c.reach.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-token-md py-3">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-token-md py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {c.status !== "ENDED" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: c.id, status: "ENDED" })}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-error-container hover:text-error"
                        >
                          <Icon name="stop_circle" size={16} />
                        </button>
                      )}
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
