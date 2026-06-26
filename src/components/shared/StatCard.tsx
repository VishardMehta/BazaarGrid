import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  /** e.g. "+12%" trend note. */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  className?: string;
}

/** Dashboard metric tile used across the portals. */
export function StatCard({ label, value, icon, delta, deltaTone = "flat", className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-surface-highest bg-surface-lowest p-token-md", className)}>
      <div className="flex items-start justify-between">
        <p className="text-label-md font-medium uppercase tracking-[0.05em] text-on-surface-variant">
          {label}
        </p>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 font-serif text-headline-lg font-semibold text-on-surface">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-0.5 text-label-sm font-medium",
            deltaTone === "up" && "text-secondary",
            deltaTone === "down" && "text-error",
            deltaTone === "flat" && "text-on-surface-variant",
          )}
        >
          {deltaTone !== "flat" && (
            <Icon name={deltaTone === "up" ? "trending_up" : "trending_down"} size={14} />
          )}
          {delta}
        </p>
      )}
    </div>
  );
}
