import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the terracotta-stroke + tinted-shadow hover treatment. */
  interactive?: boolean;
  /** Inner padding preset. */
  padding?: "none" | "sm" | "md" | "lg";
  as?: keyof JSX.IntrinsicElements;
}

const PADDING = {
  none: "",
  sm: "p-token-sm",
  md: "p-token-md",
  lg: "p-token-md md:p-8",
};

/**
 * Surface card — 16px radius, 1px subtle stroke, no heavy shadow.
 * `interactive` shifts the stroke to terracotta + adds a tinted ambient
 * shadow on hover (per DESIGN.md).
 */
export function Card({
  interactive = false,
  padding = "md",
  className,
  children,
  as: Tag = "div",
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-surface-highest bg-surface-lowest",
        PADDING[padding],
        interactive &&
          "transition-all duration-200 ease-out hover:border-primary hover:shadow-tinted",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </Tag>
  );
}
