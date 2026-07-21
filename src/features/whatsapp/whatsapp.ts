/**
 * Task 5 — WhatsApp order flow (light approach, no Business API for v1).
 *
 * "Order on WhatsApp" opens a pre-filled chat to the seller's phone and the
 * app records a real Order with channel: "WHATSAPP". Same Order model as APP.
 */
import type { CartLine } from "@/features/cart/CartContext";
import type { Product, Seller } from "@/shared/types";
import { formatPrice } from "@/lib/format";

/** Build a wa.me deep link with a URL-encoded order summary. */
export function whatsappOrderLink(seller: Seller, lines: CartLine[]): string {
  const items = lines
    .map((l) => `• ${l.quantity}× ${l.product.name} (${formatPrice(l.product.price * l.quantity, l.product.currency)})`)
    .join("\n");
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const text = [
    `Hi ${seller.name}! I'd like to order via BazaarGrid:`,
    "",
    items,
    "",
    `Total: ${formatPrice(total)}`,
    "",
    "Please confirm availability and pickup/delivery. Thank you!",
  ].join("\n");
  return `https://wa.me/${seller.phone}?text=${encodeURIComponent(text)}`;
}

/** Single-product quick enquiry link. */
export function whatsappProductLink(seller: Seller, product: Product, quantity = 1): string {
  return whatsappOrderLink(seller, [{ product, quantity }]);
}
