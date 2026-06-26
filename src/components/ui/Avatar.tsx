import { cn } from "@/lib/cn";
import { gradientFor } from "@/lib/placeholder";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-label-sm",
  md: "h-10 w-10 text-label-md",
  lg: "h-14 w-14 text-body-lg",
  xl: "h-20 w-20 text-headline-md",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Round avatar with an on-brand gradient + initials fallback. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-serif font-medium text-primary-on ring-2 ring-surface-lowest",
        SIZES[size],
        className,
      )}
      style={src ? undefined : { backgroundImage: gradientFor(name) }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
