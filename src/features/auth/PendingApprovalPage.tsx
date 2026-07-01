import { Link } from "react-router-dom";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "./AuthContext";

const ROLE_LABEL: Record<string, string> = {
  PRODUCER:     "Producer",
  VILLAGE_ADMIN:"Village Admin",
};

export function PendingApprovalPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-low px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-10 text-center shadow-tinted">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-fixed mx-auto">
          <Icon name="hourglass_top" size={32} className="text-primary-tint" />
        </span>
        <h1 className="mt-5 font-serif text-headline-lg font-semibold text-on-surface">
          Account under review
        </h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Your <strong className="text-on-surface">{ROLE_LABEL[profile?.role ?? ""] ?? "account"}</strong> account
          is pending approval by a BazaarGrid Operator. We'll notify you at{" "}
          <strong className="text-on-surface">{profile?.name ?? "your email"}</strong> once approved.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-high px-4 py-3 text-label-md font-semibold text-on-surface hover:bg-surface-highest transition">
            <Icon name="storefront" size={18} /> Browse the marketplace
          </Link>
          <Button variant="secondary" onClick={signOut} icon="logout" className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
