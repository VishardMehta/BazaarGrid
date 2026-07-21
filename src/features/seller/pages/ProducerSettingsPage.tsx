import { useState } from "react";
import { Button, Card, Icon, Input, Select, Textarea } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { PRODUCER_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";

const NOTIF_OPTIONS = [
  { id: "notif_order",    label: "New order placed",       defaultOn: true },
  { id: "notif_cancel",   label: "Order cancellation",     defaultOn: true },
  { id: "notif_review",   label: "New customer review",    defaultOn: false },
  { id: "notif_restock",  label: "Low stock alert",        defaultOn: true },
  { id: "notif_payout",   label: "Payout processed",       defaultOn: true },
  { id: "notif_digest",   label: "Weekly performance digest", defaultOn: false },
];

export function ProducerSettingsPage() {
  const { profile } = useAuth();
  const { data: seller } = useMySellerProfile(profile?.id ?? null);
  const [saved,  setSaved]  = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_OPTIONS.map((n) => [n.id, n.defaultOn])),
  );

  function toggle(id: string) {
    setNotifs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PortalLayout
      portalName="Producer Portal"
      items={PRODUCER_NAV}
      user={{ name: seller?.name ?? profile?.name ?? "…", meta: seller?.village ?? "" }}
      action={{ label: "Add Product", to: "/producer/inventory", icon: "add" }}
    >
      <div>
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Settings</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Manage your producer profile, payment, and notifications
        </p>
      </div>

      <div className="mt-token-md space-y-token-md">
        {/* Store profile */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Store profile</h2>
          <form onSubmit={handleSave} className="mt-token-md grid gap-token-md md:grid-cols-2">
            <Input label="Display name" defaultValue={seller?.name ?? ""} required />
            <Input label="Village / location" defaultValue={seller?.village ?? ""} />
            <Input label="Phone / WhatsApp" type="tel" placeholder="+91 98765 43210" />
            <Input label="Email address" placeholder="your@email.com" type="email" />
            <Textarea className="md:col-span-2" label="Store tagline" defaultValue={seller?.tagline ?? ""} rows={2} />
            <Textarea className="md:col-span-2" label="Heritage story" defaultValue={seller?.story ?? ""} rows={4} />
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" icon={saved ? "check" : "save"}>
                {saved ? "Saved!" : "Save profile"}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-label-md text-secondary">
                  <Icon name="check_circle" size={16} /> Changes saved successfully
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Notifications */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Notification preferences</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Choose which events trigger an email or SMS alert.</p>
          <ul className="mt-4 divide-y divide-surface-highest">
            {NOTIF_OPTIONS.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-3">
                <span className="text-body-md text-on-surface">{n.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifs[n.id]}
                  onClick={() => toggle(n.id)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
                    notifs[n.id] ? "bg-secondary" : "bg-surface-highest"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-transform duration-200 ${
                      notifs[n.id] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-4" variant="secondary" icon="save" onClick={handleSave}>
            Save preferences
          </Button>
        </Card>

        {/* Payment */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Payment & payouts</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Configure how you receive your earnings.</p>
          <div className="mt-4 grid gap-token-md md:grid-cols-2">
            <Select label="Payout method" defaultValue="BANK">
              <option value="BANK">Bank transfer (NEFT/IMPS)</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
            </Select>
            <Input label="Account / UPI ID" placeholder="yourname@upi or account number" />
            <Input label="IFSC code" placeholder="e.g. HDFC0001234" className="md:col-span-1" />
            <Select label="Payout frequency" defaultValue="WEEKLY">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </div>
          <Button className="mt-4" icon="save">Save payment details</Button>
        </Card>

        {/* Danger zone */}
        <Card padding="md" className="border border-error/20">
          <h2 className="font-serif text-headline-md font-medium text-error">Danger zone</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">These actions are irreversible. Proceed with caution.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" icon="pause_circle">Pause storefront</Button>
            <Button variant="secondary" icon="delete_forever" className="border-error/40 text-error hover:bg-error-container">
              Delete account
            </Button>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
