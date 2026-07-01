import { buttonClasses, Icon } from "@/components/ui";

interface WhatsAppButtonProps {
  /** Direct link — used when the URL is already known (e.g. product page quick-link). */
  href?: string;
  /** Async handler — used from CartPage where we call the backend first. */
  onClick?: () => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  className?: string;
}

/**
 * Task 5 — "Order on WhatsApp".
 * Renders as an <a> when `href` is provided (opens wa.me directly),
 * or a <button> when `onClick` is provided (async backend flow).
 */
export function WhatsAppButton({
  href,
  onClick,
  label = "Order on WhatsApp",
  size = "md",
  variant = "secondary",
  fullWidth = false,
  className,
}: WhatsAppButtonProps) {
  const cls = buttonClasses(variant, size, fullWidth, className);

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        <Icon name="chat" size={18} />
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cls}
    >
      <Icon name="chat" size={18} />
      {label}
    </a>
  );
}
