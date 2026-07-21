import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

export type TrustKind = "verified" | "traceable" | "organic" | "handmade";

const CONFIG: Record<TrustKind, { label: string; icon: string; className: string }> = {
  verified: {
    label: "Verified Producer",
    icon: "verified",
    className: "bg-secondary text-secondary-on",
  },
  traceable: {
    label: "QR-Traceable",
    icon: "qr_code_2",
    className: "border border-secondary text-secondary bg-surface-lowest",
  },
  organic: {
    label: "Organic",
    icon: "eco",
    className: "bg-secondary-container text-secondary-on-container",
  },
  handmade: {
    label: "Handmade",
    icon: "back_hand",
    className: "bg-tertiary-fixed text-tertiary-on-container",
  },
};

interface TrustBadgeProps {
  kind: TrustKind;
  /** Override the default label text. */
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Trust marker — the heart of BazaarGrid's "know your source" narrative.
 * Verified = green pill + check, Traceable = green/cream outlined badge.
 */
export function TrustBadge({ kind, label, compact = false, className }: TrustBadgeProps) {
  const c = CONFIG[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tracking-[0.03em]",
        compact ? "px-2 py-0.5 text-label-sm" : "px-2.5 py-1 text-label-sm",
        c.className,
        className,
      )}
    >
      <Icon name={c.icon} size={compact ? 13 : 15} filled={kind === "verified"} />
      {!compact && (label ?? c.label)}
    </span>
  );
}
