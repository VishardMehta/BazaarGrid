import { cn } from "@/lib/cn";

interface IconProps {
  /** Material Symbols Outlined glyph name, e.g. "shopping_cart". */
  name: string;
  className?: string;
  /** Optical size in px (also drives font-size). */
  size?: number;
  filled?: boolean;
  weight?: number;
  "aria-hidden"?: boolean;
}

/** Thin wrapper over Material Symbols Outlined. */
export function Icon({
  name,
  className,
  size = 24,
  filled = false,
  weight = 400,
  ...rest
}: IconProps) {
  return (
    <span
      aria-hidden={rest["aria-hidden"] ?? true}
      className={cn("material-symbols-outlined select-none leading-none", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
