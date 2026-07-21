import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Filter / category chip. Low-saturation by default; selected state fills
 * with the green container so it never competes with primary buttons.
 */
export function Chip({ selected = false, onClick, icon, className, children }: ChipProps) {
  const interactive = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-label-sm font-medium transition-colors duration-150",
        selected
          ? "border-secondary bg-secondary-container text-secondary-on-container"
          : "border-outline-variant bg-surface-low text-on-surface-variant hover:border-outline hover:bg-surface-high",
        !interactive && "cursor-default",
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
      {selected && interactive && <Icon name="close" size={14} />}
    </button>
  );
}
