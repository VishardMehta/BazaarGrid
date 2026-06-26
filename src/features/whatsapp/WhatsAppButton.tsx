import { buttonClasses, Icon } from "@/components/ui";

interface WhatsAppButtonProps {
  href: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  className?: string;
}

/**
 * Task 5 — "Order on WhatsApp". A real anchor (opens wa.me) styled as a
 * button, so we never nest a <button> inside an <a>.
 */
export function WhatsAppButton({
  href,
  label = "Order on WhatsApp",
  size = "md",
  variant = "secondary",
  fullWidth = false,
  className,
}: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={buttonClasses(variant, size, fullWidth, className)}
    >
      <Icon name="chat" size={18} />
      {label}
    </a>
  );
}
