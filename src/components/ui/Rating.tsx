import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface RatingProps {
  value: number; // 0–5
  count?: number;
  size?: number;
  className?: string;
}

/** Turmeric star rating with optional review count. */
export function Rating({ value, count, size = 16, className }: RatingProps) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex text-tertiary-fixed-dim" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name="star" size={size} filled={i <= rounded} />
        ))}
      </span>
      <span className="text-label-sm text-on-surface-variant">
        {value.toFixed(1)}
        {typeof count === "number" && <span className="text-outline"> ({count})</span>}
      </span>
    </span>
  );
}
