import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

interface TraceabilityScoreProps {
  score: number; // 0–100
  /** "card" = the terracotta highlight panel; "ring" = compact circular. */
  variant?: "card" | "ring";
  caption?: string;
  className?: string;
}

/**
 * Transparency marker. The terracotta "card" variant is the hero stat used
 * on profiles; "ring" is a compact inline version.
 */
export function TraceabilityScore({
  score,
  variant = "card",
  caption = "Traceability Score",
  className,
}: TraceabilityScoreProps) {
  if (variant === "ring") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span
          className="grid h-12 w-12 place-items-center rounded-full text-label-md font-semibold text-secondary-on"
          style={{
            background: `conic-gradient(theme(colors.secondary.DEFAULT) ${score * 3.6}deg, theme(colors.surface.high) 0deg)`,
          }}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-lowest text-secondary">
            {score}
          </span>
        </span>
        <span className="text-label-md text-on-surface-variant">{caption}</span>
      </span>
    );
  }

  return (
    <div className={cn("rounded-lg bg-primary p-token-md text-primary-on", className)}>
      <div className="flex items-center justify-between">
        <p className="text-label-md font-semibold uppercase tracking-[0.05em] text-primary-on/85">
          {caption}
        </p>
        <Icon name="eco" size={22} className="text-primary-on/80" filled />
      </div>
      <p className="mt-2 font-serif text-[44px] font-semibold leading-none">{score}%</p>
      <p className="mt-2 text-label-sm text-primary-on/80">
        Verified across sourcing, processing &amp; delivery.
      </p>
    </div>
  );
}
