import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Card, Icon, Input, Select } from "@/components/ui";
import { TraceabilityScore } from "@/components/shared";
import { formatPrice, formatDate, compact } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { useUpdateProfile } from "@/lib/hooks/useProfile";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useAddresses, useAddAddress, useDeleteAddress, useSetDefaultAddress } from "@/lib/hooks/useAddresses";
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod } from "@/lib/hooks/usePaymentMethods";
import { useRewardBalance, useRewardTransactions } from "@/lib/hooks/useRewards";

const TABS = ["Personal Info", "Order History", "Saved Addresses", "Payment Methods", "Rewards", "Preferences"] as const;
type Tab = (typeof TABS)[number];

const NOTIF_PREFS = [
  { key: "order_updates",  label: "Order status updates",     on: true  },
  { key: "promotions",     label: "Promotions & new arrivals", on: false },
  { key: "producer_news",  label: "News from saved producers", on: true  },
  { key: "harvest_digest", label: "Weekly harvest digest",     on: false },
  { key: "token_expiry",   label: "Token expiry reminders",    on: true  },
] as const;

// Tier from balance
function tierForBalance(b: number) {
  if (b >= 10000) return "PLATINUM";
  if (b >= 5000)  return "GOLD";
  if (b >= 1000)  return "SILVER";
  return "BRONZE";
}

export function MyProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Personal Info");

  // Profile edit
  const updateProfile = useUpdateProfile();
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? "");
  const [editPhone,setEditPhone]= useState(profile?.phone ?? "");

  // Orders
  const { data: orders = [] } = useMyOrders(profile?.id ?? null);

  // Addresses
  const { data: addresses = [] } = useAddresses(profile?.id ?? null);
  const addAddress  = useAddAddress();
  const delAddress  = useDeleteAddress();
  const setDefAddr  = useSetDefaultAddress();
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrSaved,   setAddrSaved]   = useState(false);

  // Payment methods
  const { data: paymentMethods = [] } = usePaymentMethods(profile?.id ?? null);
  const addPM   = useAddPaymentMethod();
  const delPM   = useDeletePaymentMethod();
  const setDefPM= useSetDefaultPaymentMethod();
  const [showAddCard, setShowAddCard] = useState(false);

  // Rewards
  const { data: balance = 0 } = useRewardBalance(profile?.id ?? null);
  const { data: txns   = [] } = useRewardTransactions(profile?.id ?? null);

  // Preferences state (local-only — extend with DB if needed)
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map((n) => [n.key, n.on])),
  );
  const [prefSaved, setPrefSaved] = useState(false);
  const [privacy, setPrivacy] = useState({
    share_order_data: true,
    qr_analytics:     true,
    public_reviews:   false,
  });

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    await updateProfile.mutateAsync({ id: profile.id, name: editName, phone: editPhone });
    setEditing(false);
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await addAddress.mutateAsync({
      profile_id:  profile.id,
      label:       (data.get("label") as string) || "Home",
      line1:       data.get("line1") as string,
      line2:       null,
      city:        data.get("city") as string,
      region:      data.get("region") as string,
      postal_code: data.get("postalCode") as string,
      country:     "India",
      is_default:  addresses.length === 0,
    });
    setAddrSaved(true);
    form.reset();
    setTimeout(() => { setAddrSaved(false); setShowAddAddr(false); }, 1500);
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const cardNum = data.get("number") as string;
    await addPM.mutateAsync({
      profile_id: profile.id,
      type:       "CARD",
      label:      "Card",
      last_four:  cardNum.replace(/\s/g, "").slice(-4),
      brand:      "Visa",
      upi_id:     null,
      is_default: paymentMethods.length === 0,
    });
    form.reset();
    setShowAddCard(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const tier = tierForBalance(balance);

  if (!profile) return null;

  return (
    <div className="container-page py-token-md">
      {/* Identity */}
      <div className="flex flex-wrap items-center justify-between gap-token-md">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name ?? "User"} size="xl" />
          <div>
            <h1 className="font-serif text-headline-lg font-semibold text-on-surface">{profile.name ?? "Your Account"}</h1>
            <p className="mt-1 inline-flex items-center gap-2 text-body-md text-on-surface-variant">
              <Badge tone="turmeric" icon="workspace_premium">{tier} Member</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="edit" onClick={() => { setEditing(true); setTab("Personal Info"); }}>
            Edit profile
          </Button>
          <Button variant="ghost" icon="logout" onClick={handleSignOut}>Logout</Button>
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

      {/* ── Personal Info ── */}
      {tab === "Personal Info" && (
        <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
          <Card padding="md">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Personal details</h2>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="mt-3 space-y-3">
                <Input label="Full name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <Input label="Phone number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} type="tel" />
                <div className="flex gap-3">
                  <Button type="submit" icon="save" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Full name",     profile.name     ?? "—"],
                    ["Phone number",  profile.phone    ?? "—"],
                    ["Loyalty tier",  `${tier} Member`],
                    ["Account role",  profile.role],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">{k}</dt>
                      <dd className="mt-0.5 text-body-md font-medium text-on-surface">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" icon="edit" size="sm" onClick={() => setEditing(true)}>Edit info</Button>
                  <Button variant="secondary" icon="lock" size="sm">Change password</Button>
                </div>
              </>
            )}
          </Card>
          <TraceabilityScore score={90} caption="Your Traceability Score" className="self-start" />
        </div>
      )}

      {/* ── Order History ── */}
      {tab === "Order History" && (
        <Card padding="none" className="mt-token-md overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <Icon name="receipt_long" size={36} className="mx-auto" />
              <p className="mt-2">No orders yet.</p>
              <Link to="/shop" className="mt-3 inline-block text-label-md font-semibold text-secondary">Start shopping →</Link>
            </div>
          ) : (
            <table className="w-full text-left text-label-md">
              <thead className="bg-surface-low text-on-surface-variant">
                <tr>
                  <th className="px-token-md py-2.5 font-semibold">Order</th>
                  <th className="px-token-md py-2.5 font-semibold">Date</th>
                  <th className="px-token-md py-2.5 font-semibold">Status</th>
                  <th className="px-token-md py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-highest">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-low">
                    <td className="px-token-md py-3 font-medium text-on-surface">{o.id}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{formatDate(o.placed_at)}</td>
                    <td className="px-token-md py-3">
                      <Badge tone={o.status === "COMPLETED" ? "green" : o.status === "CANCELLED" ? "error" : "turmeric"}>
                        {o.status === "FULFILLED" ? "In Transit" : o.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t border-surface-highest px-token-md py-3 text-center">
            <Link to="/orders" className="text-label-md font-semibold text-secondary hover:text-primary">Open full order history →</Link>
          </div>
        </Card>
      )}

      {/* ── Saved Addresses ── */}
      {tab === "Saved Addresses" && (
        <div className="mt-token-md space-y-token-md">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Saved addresses</h2>
            <Button size="sm" icon="add" onClick={() => setShowAddAddr((v) => !v)}>
              {showAddAddr ? "Cancel" : "Add address"}
            </Button>
          </div>

          {showAddAddr && (
            <Card padding="md" className="border border-secondary/30">
              <h3 className="font-serif text-headline-md font-medium text-on-surface">New address</h3>
              <form onSubmit={handleAddAddress} className="mt-3 grid gap-3 sm:grid-cols-2">
                <Select name="label" defaultValue="Home" label="Address label">
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </Select>
                <Input name="line1"      label="Street address"  placeholder="28 Artisan Way" required />
                <Input name="city"       label="City"            placeholder="Mumbai"         required />
                <Input name="region"     label="State"           placeholder="Maharashtra" />
                <Input name="postalCode" label="PIN code"        placeholder="400001" />
                <div className="sm:col-span-2 flex gap-3">
                  <Button type="submit" disabled={addAddress.isPending} icon={addrSaved ? "check" : "save"}>
                    {addrSaved ? "Saved!" : addAddress.isPending ? "Saving…" : "Save address"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddAddr(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {addresses.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {addresses.map((addr) => (
                <Card key={addr.id} padding="md" className={`relative ${addr.is_default ? "border border-secondary/40" : ""}`}>
                  {addr.is_default && (
                    <span className="absolute right-3 top-3 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-semibold text-secondary-on-container">Default</span>
                  )}
                  <div className="flex items-start gap-2">
                    <Icon name="location_on" size={20} className="mt-0.5 shrink-0 text-secondary" />
                    <div>
                      <p className="font-semibold text-on-surface">{addr.label}</p>
                      <p className="mt-1 text-body-md text-on-surface-variant">{addr.line1}</p>
                      <p className="text-body-md text-on-surface-variant">{addr.city} {addr.postal_code}</p>
                      {addr.region && <p className="text-label-sm text-outline">{addr.region}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-label-sm font-semibold">
                    {!addr.is_default && (
                      <>
                        <button className="text-secondary hover:text-primary" onClick={() => setDefAddr.mutate({ id: addr.id, profileId: profile.id })}>
                          Set default
                        </button>
                        <span className="text-on-surface-variant">·</span>
                      </>
                    )}
                    <button className="text-error hover:text-error/80" onClick={() => delAddress.mutate({ id: addr.id, profileId: profile.id })}>
                      Remove
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="md" className="py-8 text-center">
              <Icon name="location_off" size={32} className="mx-auto text-on-surface-variant" />
              <p className="mt-2 text-body-md text-on-surface-variant">No addresses saved yet.</p>
              <Button className="mt-3" size="sm" icon="add" onClick={() => setShowAddAddr(true)}>Add your first address</Button>
            </Card>
          )}
        </div>
      )}

      {/* ── Payment Methods ── */}
      {tab === "Payment Methods" && (
        <div className="mt-token-md space-y-token-md">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Payment methods</h2>
            <Button size="sm" icon="add" onClick={() => setShowAddCard((v) => !v)}>
              {showAddCard ? "Cancel" : "Add card"}
            </Button>
          </div>

          {showAddCard && (
            <Card padding="md" className="border border-secondary/30">
              <h3 className="font-serif text-headline-md font-medium text-on-surface">Add new card</h3>
              <form onSubmit={handleAddCard} className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input label="Cardholder name" name="name" placeholder="Your name" required className="sm:col-span-2" />
                <Input label="Card number" name="number" placeholder="•••• •••• •••• ••••" maxLength={19} required className="sm:col-span-2" />
                <Input label="Expiry" name="expiry" placeholder="MM/YY" required />
                <Input label="CVV" name="cvv" placeholder="•••" maxLength={4} type="password" required />
                <div className="sm:col-span-2 flex gap-3">
                  <Button type="submit" icon="add_card" disabled={addPM.isPending}>
                    {addPM.isPending ? "Saving…" : "Save card"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddCard(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            {paymentMethods.filter((pm) => pm.type === "CARD").map((card) => (
              <Card key={card.id} padding="md" className={`flex items-center justify-between gap-4 ${card.is_default ? "border border-secondary/40" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-high text-on-surface-variant">
                    <Icon name="credit_card" size={22} />
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">
                      {card.brand ?? "Card"} •••• {card.last_four}
                      {card.is_default && (
                        <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-semibold text-secondary-on-container">Default</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 text-label-sm font-semibold">
                  {!card.is_default && (
                    <button onClick={() => setDefPM.mutate({ id: card.id, profileId: profile.id })} className="text-secondary hover:text-primary">
                      Set default
                    </button>
                  )}
                  <button onClick={() => delPM.mutate({ id: card.id, profileId: profile.id })} className="text-error hover:text-error/80">Remove</button>
                </div>
              </Card>
            ))}

            {paymentMethods.filter((pm) => pm.type === "CARD").length === 0 && !showAddCard && (
              <Card padding="md" className="py-8 text-center">
                <Icon name="credit_card_off" size={32} className="mx-auto text-on-surface-variant" />
                <p className="mt-2 text-body-md text-on-surface-variant">No payment methods saved.</p>
                <Button className="mt-3" size="sm" icon="add_card" onClick={() => setShowAddCard(true)}>Add a card</Button>
              </Card>
            )}
          </div>

          {/* UPI */}
          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">UPI accounts</h3>
            {paymentMethods.filter((pm) => pm.type === "UPI").length > 0 ? (
              paymentMethods.filter((pm) => pm.type === "UPI").map((upi) => (
                <div key={upi.id} className="mt-3 flex items-center justify-between rounded-lg bg-surface-low px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon name="account_balance_wallet" size={22} className="text-secondary" />
                    <span className="text-body-md font-medium text-on-surface">{upi.upi_id}</span>
                  </div>
                  <button onClick={() => delPM.mutate({ id: upi.id, profileId: profile.id })} className="text-label-sm font-semibold text-error">Remove</button>
                </div>
              ))
            ) : (
              <p className="mt-2 text-body-sm text-on-surface-variant">No UPI IDs saved.</p>
            )}
            <Button className="mt-3" variant="secondary" size="sm" icon="add"
              onClick={async () => {
                const id = prompt("Enter your UPI ID (e.g. name@okaxis)");
                if (id) await addPM.mutateAsync({ profile_id: profile.id, type: "UPI", label: null, last_four: null, brand: null, upi_id: id, is_default: false });
              }}
            >
              Add UPI ID
            </Button>
          </Card>
        </div>
      )}

      {/* ── Rewards ── */}
      {tab === "Rewards" && (
        <div className="mt-token-md space-y-token-md">
          <div className="grid gap-token-md sm:grid-cols-3">
            <Card padding="md">
              <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Token balance</p>
              <p className="mt-1 font-serif text-headline-lg font-semibold text-tertiary">{compact(balance)}</p>
              <p className="text-label-sm text-on-surface-variant">Harvest Tokens</p>
              <Link to="/rewards" className="mt-2 inline-block text-label-md font-semibold text-secondary hover:text-primary">Redeem →</Link>
            </Card>
            <Card padding="md">
              <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Loyalty tier</p>
              <div className="mt-1 flex items-center gap-2">
                <Icon name="workspace_premium" size={22} className="text-tertiary-fixed-dim" filled />
                <p className="font-serif text-headline-lg font-semibold text-on-surface">{tier}</p>
              </div>
            </Card>
            <Card padding="md">
              <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Referral code</p>
              <p className="mt-1 font-mono text-headline-lg font-semibold text-on-surface">
                {profile.name ? profile.name.replace(/\s+/g, "").toUpperCase().slice(0, 6) + "200" : "REF200"}
              </p>
              <p className="text-label-sm text-on-surface-variant">Earn 200 tokens per referral</p>
              <button
                className="mt-2 text-label-md font-semibold text-secondary hover:text-primary"
                onClick={() => { const code = (profile.name ?? "REF").replace(/\s+/g, "").toUpperCase().slice(0, 6) + "200"; navigator.clipboard.writeText(code); }}
              >
                Copy code
              </button>
            </Card>
          </div>

          {txns.length > 0 && (
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-surface-highest px-token-md py-3">
                <h3 className="font-serif text-headline-md font-medium text-on-surface">Recent transactions</h3>
              </div>
              <ul className="divide-y divide-surface-highest">
                {txns.slice(0, 10).map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between px-token-md py-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${tx.type === "EARN" ? "bg-secondary-container text-secondary-on-container" : "bg-error-container/30 text-error"}`}>
                        <Icon name={tx.type === "EARN" ? "add" : "remove"} size={16} />
                      </span>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{tx.description}</p>
                        <p className="text-label-sm text-on-surface-variant">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === "EARN" ? "text-secondary" : "text-error"}`}>
                      {tx.type === "EARN" ? "+" : "-"}{tx.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* ── Preferences ── */}
      {tab === "Preferences" && (
        <div className="mt-token-md space-y-token-md">
          <Card padding="md">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Notification preferences</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">Choose what updates you'd like to receive.</p>
            <ul className="mt-4 divide-y divide-surface-highest">
              {NOTIF_PREFS.map((n) => (
                <li key={n.key} className="flex items-center justify-between py-3">
                  <span className="text-body-md text-on-surface">{n.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifs[n.key]}
                    onClick={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${notifs[n.key] ? "bg-secondary" : "bg-surface-highest"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-transform ${notifs[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Language & region</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select label="Language" defaultValue="en">
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </Select>
              <Select label="Currency" defaultValue="INR">
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </Select>
            </div>
          </Card>

          <Card padding="md">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Privacy</h2>
            <ul className="mt-4 divide-y divide-surface-highest">
              {([
                { key: "share_order_data" as const, label: "Share order data with producers for personalisation" },
                { key: "qr_analytics"     as const, label: "Allow traceability QR analytics" },
                { key: "public_reviews"   as const, label: "Show my name in public reviews" },
              ]).map((pref) => (
                <li key={pref.key} className="flex items-center justify-between py-3">
                  <span className="text-body-md text-on-surface">{pref.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={privacy[pref.key]}
                    onClick={() => setPrivacy((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${privacy[pref.key] ? "bg-secondary" : "bg-surface-highest"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-transform ${privacy[pref.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button icon={prefSaved ? "check" : "save"} onClick={() => { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2500); }}>
              {prefSaved ? "Preferences saved!" : "Save preferences"}
            </Button>
            <Button variant="secondary" icon="download">Download my data</Button>
          </div>
        </div>
      )}
    </div>
  );
}
