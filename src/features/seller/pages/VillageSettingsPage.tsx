import { useState } from "react";
import { Button, Card, Icon, Input, Select, Textarea } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile, useSellers } from "@/lib/hooks/useSellers";

export function VillageSettingsPage() {
  const { profile } = useAuth();
  const { data: myProfile } = useMySellerProfile(profile?.id ?? null);
  const { data: allSellers = [] } = useSellers();
  const producers  = allSellers.filter((s) => s.village_id === myProfile?.village_id && s.status === "ACTIVE");
  const villageName = myProfile?.village ?? "Your Village";
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({
    new_producer:    true,
    approval_needed: true,
    campaign_end:    true,
    weekly_digest:   false,
    compliance_alert: true,
  });

  function toggle(key: keyof typeof notifs) {
    setNotifs((n) => ({ ...n, [key]: !n[key] }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: villageName, meta: `${producers.length} producers` }}
      action={{ label: "Add Producer", to: "/village-admin/producers", icon: "person_add" }}
    >
      <div>
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Settings</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Configure village details, access, and notifications
        </p>
      </div>

      <div className="mt-token-md space-y-token-md">
        {/* Village details */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Village details</h2>
          <form onSubmit={handleSave} className="mt-token-md grid gap-token-md md:grid-cols-2">
            <Input label="Village name" defaultValue={villageName} required />
            <Input label="Region / district" defaultValue={myProfile?.region ?? ""} />
            <Input label="Admin contact name" placeholder="Village coordinator name" />
            <Input label="Admin phone / WhatsApp" placeholder="+91 98765 43210" type="tel" />
            <Input label="Admin email" placeholder="admin@village.com" type="email" />
            <Select label="Time zone" defaultValue="IST">
              <option value="IST">IST — India Standard Time (UTC+5:30)</option>
              <option value="UTC">UTC</option>
            </Select>
            <Textarea className="md:col-span-2" label="Village description (public)" rows={3}
              defaultValue={myProfile?.story ?? ""} />
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" icon={saved ? "check" : "save"}>
                {saved ? "Saved!" : "Save details"}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-label-md text-secondary">
                  <Icon name="check_circle" size={16} /> Changes saved
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Admin access */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Admin access</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">People who can manage this village.</p>
          <ul className="mt-4 divide-y divide-surface-highest">
            {[
              { name: "Village Coordinator", email: "coord@greenvalley.com", role: "Owner" },
              { name: "Market Liaison",      email: "market@greenvalley.com", role: "Editor" },
            ].map((u) => (
              <li key={u.email} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body-md font-medium text-on-surface">{u.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-surface-high px-2.5 py-1 text-label-sm font-semibold text-on-surface-variant">
                    {u.role}
                  </span>
                  {u.role !== "Owner" && (
                    <button className="text-label-sm font-semibold text-error hover:text-error/80">Remove</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-3" variant="secondary" icon="person_add" size="sm">
            Invite admin
          </Button>
        </Card>

        {/* Notifications */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Notifications</h2>
          <ul className="mt-4 divide-y divide-surface-highest">
            {[
              { key: "new_producer"     as const, label: "New producer joins the village" },
              { key: "approval_needed"  as const, label: "Producer approval required" },
              { key: "campaign_end"     as const, label: "Campaign ending soon" },
              { key: "compliance_alert" as const, label: "Compliance certification expiry" },
              { key: "weekly_digest"    as const, label: "Weekly performance digest" },
            ].map((n) => (
              <li key={n.key} className="flex items-center justify-between py-3">
                <span className="text-body-md text-on-surface">{n.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifs[n.key]}
                  onClick={() => toggle(n.key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${notifs[n.key] ? "bg-secondary" : "bg-surface-highest"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-transform ${notifs[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-4" variant="secondary" icon="save" onClick={handleSave}>
            Save preferences
          </Button>
        </Card>

        {/* Data */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Data & export</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Download reports and manage data retention.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" icon="file_download">Export producer list (CSV)</Button>
            <Button variant="secondary" icon="file_download">Export order history (CSV)</Button>
            <Button variant="secondary" icon="file_download">Compliance report (PDF)</Button>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
