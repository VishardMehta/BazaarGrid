import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "./AuthContext";
import type { UserRole } from "@/lib/supabase";

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

export function OnboardingPage() {
  const { updateRole, profile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setBusy(true);
    const { error: err } = await updateRole(selected);
    setBusy(false);
    if (err) { setError(err); return; }
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

        {selected && selected !== "BUYER" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-high px-4 py-3 text-label-sm text-on-surface-variant">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            Your account will be reviewed by an Operator before you can access the portal. You'll be notified once approved.
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
          disabled={!selected || busy}
          icon={busy ? undefined : "arrow_forward"}
        >
          {busy ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
