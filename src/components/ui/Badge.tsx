import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Tone = "neutral" | "green" | "terracotta" | "turmeric" | "error" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-high text-on-surface-variant",
  green: "bg-secondary-container text-secondary-on-container",
  terracotta: "bg-primary-fixed text-primary-tint",
  turmeric: "bg-tertiary-fixed text-tertiary-on-container",
  error: "bg-error-container text-error-on-container",
  info: "bg-surface-high text-on-surface",
};

interface BadgeProps {
  tone?: Tone;
  icon?: string;
  filled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Small pill label — status, counts, attributes. */
export function Badge({ tone = "neutral", icon, filled, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={14} filled={filled} />}
      {children}
    </span>
  );
}
