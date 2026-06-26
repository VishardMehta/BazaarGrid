import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

/** Accessible +/- quantity control used in cart and product detail. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantityStepperProps) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-outline-variant bg-surface-lowest",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(dim, "grid place-items-center rounded-full text-on-surface-variant transition-colors hover:text-primary disabled:opacity-40")}
      >
        <Icon name="remove" size={18} />
      </button>
      <span className="w-8 text-center text-body-md font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(dim, "grid place-items-center rounded-full text-on-surface-variant transition-colors hover:text-primary disabled:opacity-40")}
      >
        <Icon name="add" size={18} />
      </button>
    </div>
  );
}
