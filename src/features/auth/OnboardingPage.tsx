import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon, Select } from "@/components/ui";
import { LocationPicker, type LocationValue } from "@/components/shared";
import { supabase, type UserRole } from "@/lib/supabase";
import { useVillages } from "@/lib/hooks/useVillages";
import { useAuth } from "./AuthContext";
import type { SellerType } from "@/shared/types";

const ROLES: {
  role: UserRole;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    role: "BUYER",
    icon: "shopping_bag",
    title: "I'm a Buyer",
    description: "Discover and shop heritage produce directly from village artisans.",
  },
  {
    role: "PRODUCER",
    icon: "storefront",
    title: "I'm a Producer",
    description: "List my products, manage orders, and connect with buyers across the grid.",
  },
  {
    role: "VILLAGE_ADMIN",
    icon: "cottage",
    title: "I'm a Village Admin",
    description: "Manage my village storefront, producers, and promotional campaigns.",
  },
];

const SELLER_TYPES: { value: SellerType; label: string; icon: string }[] = [
  { value: "VILLAGE_PRODUCER", label: "Village Producer", icon: "cottage" },
  { value: "KIRANA_STORE",     label: "Kirana Store",      icon: "storefront" },
  { value: "FPO",              label: "FPO",                icon: "groups" },
  { value: "SHG",              label: "Self Help Group",    icon: "diversity_3" },
];

export function OnboardingPage() {
  const { updateRole, profile } = useAuth();
  const navigate = useNavigate();
  const { data: villages = [] } = useVillages();

  const [selected, setSelected]     = useState<UserRole | null>(null);
  const [sellerType, setSellerType] = useState<SellerType>("VILLAGE_PRODUCER");
  const [loc, setLoc]               = useState<LocationValue>({ state: "", district: "" });
  const [villageId, setVillageId]   = useState("");
  const [busy,     setBusy]         = useState(false);
  const [error,    setError]        = useState<string | null>(null);

  const needsVillage = selected === "PRODUCER" || selected === "VILLAGE_ADMIN";

  const districtVillages = villages.filter(
    (v) => v.state === loc.state && v.district === loc.district,
  );
  const village = villages.find((v) => v.id === villageId);

  async function handleContinue() {
    if (!selected) return;
    if (needsVillage && !villageId) {
      setError("Please select your state, district and village to continue.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error: err } = await updateRole(selected, needsVillage ? villageId : undefined);
    if (err) { setBusy(false); setError(err); return; }

    // Producers get a PENDING seller row right away so the Village Admin
    // sees them in the approval queue.
    if (selected === "PRODUCER" && profile) {
      await supabase.from("sellers").insert({
        profile_id: profile.id,
        village_id: villageId || null,
        type:       sellerType,
        name:       profile.name ?? "New Producer",
        tagline:    "Heritage goods, direct from the source.",
        village:    village?.name ?? null,
        region:     village?.region ?? null,
        status:     "PENDING",
        traceability_score: 60,
      });
      // Duplicate/policy errors are non-fatal: the DB backfill covers this.
    }

    setBusy(false);
    if (selected === "BUYER") navigate("/", { replace: true });
    else navigate("/pending-approval", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-low px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="font-serif text-display-lg text-2xl font-bold text-primary">BazaarGrid</span>
          <h1 className="mt-4 font-serif text-headline-lg font-semibold text-on-surface">
            Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            How will you use BazaarGrid?
          </p>
        </div>

        <div className="space-y-3">
          {ROLES.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => setSelected(r.role)}
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition ${
                selected === r.role
                  ? "border-secondary bg-secondary-container/30"
                  : "border-outline-variant bg-surface hover:border-secondary/50"
              }`}
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                selected === r.role ? "bg-secondary text-secondary-on" : "bg-surface-high text-on-surface-variant"
              }`}>
                <Icon name={r.icon} size={24} />
              </span>
              <div>
                <p className="font-semibold text-on-surface">{r.title}</p>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{r.description}</p>
              </div>
              {selected === r.role && (
                <Icon name="check_circle" size={22} className="ml-auto shrink-0 text-secondary" filled />
              )}
            </button>
          ))}
        </div>

        {selected === "PRODUCER" && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface p-5">
            <p className="font-semibold text-on-surface">What kind of seller are you?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SELLER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSellerType(t.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
                    sellerType === t.value
                      ? "border-secondary bg-secondary-container/30"
                      : "border-outline-variant hover:border-secondary/50"
                  }`}
                >
                  <Icon name={t.icon} size={18} className={sellerType === t.value ? "text-secondary" : "text-on-surface-variant"} />
                  <span className="text-label-md font-medium text-on-surface">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-label-sm text-on-surface-variant">
              FPOs and Self Help Groups sell as one collective storefront, same as any producer.
            </p>
          </div>
        )}

        {needsVillage && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface p-5">
            <p className="flex items-center gap-2 font-semibold text-on-surface">
              <Icon name="cottage" size={18} className="text-secondary" />
              {selected === "PRODUCER" ? "Where are you based?" : "Which village do you manage?"}
            </p>
            <LocationPicker
              className="mt-3 grid gap-3 sm:grid-cols-2"
              value={loc}
              onChange={(v) => { setLoc(v); setVillageId(""); }}
            />
            <div className="mt-3">
              <Select
                label="Village / collective"
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                disabled={!loc.district}
              >
                <option value="">{loc.district ? "Select village…" : "Pick a state and district first"}</option>
                {districtVillages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Select>
              {loc.district && districtVillages.length === 0 && (
                <p className="mt-2 text-label-sm text-on-surface-variant">
                  No registered village in {loc.district} yet — an Operator can add one, or contact support.
                </p>
              )}
            </div>
            {village && (
              <p className="mt-3 flex items-start gap-1.5 text-label-sm text-on-surface-variant">
                <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                {village.description ?? `${village.name}, ${village.region}`}
              </p>
            )}
          </div>
        )}

        {selected && selected !== "BUYER" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-high px-4 py-3 text-label-sm text-on-surface-variant">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            {selected === "PRODUCER"
              ? "Your account will be reviewed by your Village Admin before you can access the portal. You'll be notified once approved."
              : "Your account will be reviewed by an Operator before you can access the portal. You'll be notified once approved."}
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-error-container/30 px-3 py-2 text-label-sm text-error">
            <Icon name="error" size={16} /> {error}
          </div>
        )}

        <Button
          className="mt-6 w-full"
          onClick={handleContinue}
          disabled={!selected || busy || (needsVillage && !villageId)}
          icon={busy ? undefined : "arrow_forward"}
        >
          {busy ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
