import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "tertiary" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Terracotta fill, cream text — high-contrast primary action
  primary:
    "bg-primary text-primary-on hover:bg-primary-container active:bg-primary-tint shadow-tinted hover:shadow-tinted-lg",
  // Deep-green 2px outline
  secondary:
    "border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-on",
  tertiary:
    "bg-tertiary-fixed text-tertiary-on-container hover:bg-tertiary-fixed-dim",
  ghost: "text-on-surface hover:bg-surface-high",
  danger: "bg-error text-error-on hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-label-sm gap-1.5",
  md: "h-11 px-5 text-label-md gap-2",
  lg: "h-12 px-7 text-label-md gap-2.5",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const baseClass =
  "inline-flex items-center justify-center rounded font-sans font-semibold uppercase tracking-[0.05em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

/** Compose the button class string — shared by Button, ButtonLink and anchors. */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  fullWidth = false,
  className?: string,
) {
  return cn(baseClass, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

function content(icon?: string, iconRight?: string, children?: React.ReactNode) {
  return (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </>
  );
}

/* Button element */
type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconRight, fullWidth, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(baseClass, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {content(icon, iconRight, children)}
    </button>
  );
});

/* Link styled as a button (internal routes) */
interface ButtonLinkProps extends BaseProps {
  to: string;
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(baseClass, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
    >
      {content(icon, iconRight, children)}
    </Link>
  );
}
