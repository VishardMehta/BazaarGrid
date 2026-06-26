import { useMemo, useState } from "react";
import { Button, Card, Icon, Input } from "@/components/ui";
import { ProductThumb, QuantityStepper, EmptyState, TrustBadge } from "@/components/shared";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/features/cart/CartContext";
import { getSellerById } from "@/shared/mocks";
import { whatsappOrderLink } from "@/features/whatsapp/whatsapp";
import { WhatsAppButton } from "@/features/whatsapp/WhatsAppButton";
import type { FulfillmentMethod, PaymentMethod } from "@/shared/types";

const FULFILMENT: { value: FulfillmentMethod; label: string; icon: string; meta: string }[] = [
  { value: "DELIVERY", label: "Delivery", icon: "local_shipping", meta: "Arrives Oct 24 – 26" },
  { value: "VILLAGE_PICKUP", label: "Village Pickup", icon: "storefront", meta: "Ready in 3 hours" },
];

const PAYMENTS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "CARD", label: "Visa •••• 4242", icon: "credit_card" },
  { value: "DIGITAL_WALLET", label: "Digital Wallet (Apple Pay)", icon: "account_balance_wallet" },
  { value: "COD", label: "Cash on delivery", icon: "payments" },
];

export function CartPage() {
  const { lines, subtotal, setQty, remove, count } = useCart();
  const [fulfilment, setFulfilment] = useState<FulfillmentMethod>("DELIVERY");
  const [payment, setPayment] = useState<PaymentMethod>("CARD");
  const [placed, setPlaced] = useState(false);

  const deliveryFee = fulfilment === "DELIVERY" ? (subtotal > 40 ? 0 : 4) : 0;
  const rewardsDiscount = useMemo(() => Math.round(subtotal * 0.1 * 100) / 100, [subtotal]);
  const total = Math.max(0, subtotal + deliveryFee - rewardsDiscount);

  // Single-seller carts can also order via WhatsApp.
  const sellerIds = new Set(lines.map((l) => l.product.sellerId));
  const soleSeller = sellerIds.size === 1 ? getSellerById([...sellerIds][0]) : undefined;

  if (lines.length === 0) {
    return (
      <div className="container-page py-token-lg">
        <EmptyState
          icon="shopping_cart"
          title="Your basket is empty"
          message="Discover heritage goods from verified village producers and add them here."
          action={{ label: "Shop the grid", to: "/shop" }}
        />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="container-page py-token-lg">
        <Card padding="lg" className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-secondary-on">
            <Icon name="check" size={36} />
          </span>
          <h1 className="mt-4 font-serif text-headline-lg font-semibold text-on-surface">Order placed!</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Thank you. Your order is confirmed and traceable end-to-end. Track its
            journey from My Orders.
          </p>
          <Button className="mt-5" icon="receipt_long" onClick={() => (window.location.href = "/orders")}>
            View my orders
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page py-token-md">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Your Basket</h1>
        <span className="text-body-md text-on-surface-variant">{count} items</span>
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
        {/* Lines + options */}
        <div className="space-y-token-md">
          <div className="flex items-center gap-2 rounded-lg bg-secondary-container px-token-sm py-2.5 text-secondary-on-container">
            <Icon name="verified_user" size={18} filled />
            <p className="text-label-md font-medium">
              Safe &amp; Traceable — every item traces back to its verified producer via blockchain QR.
            </p>
          </div>

          <Card padding="none" className="divide-y divide-surface-highest">
            {lines.map(({ product, quantity }) => {
              const seller = getSellerById(product.sellerId);
              return (
                <div key={product.id} className="flex gap-token-sm p-token-sm">
                  <ProductThumb product={product} className="h-20 w-20 shrink-0" iconSize={28} />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-body-lg font-medium text-on-surface">{product.name}</h3>
                        {seller && <span className="text-label-sm text-on-surface-variant">by {seller.name}</span>}
                      </div>
                      <span className="font-serif text-body-lg font-semibold text-primary">
                        {formatPrice(product.price * quantity, product.currency)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantityStepper value={quantity} onChange={(q) => setQty(product.id, q)} size="sm" />
                      <button
                        onClick={() => remove(product.id)}
                        className="inline-flex items-center gap-1 text-label-md text-on-surface-variant hover:text-error"
                      >
                        <Icon name="delete" size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Fulfilment */}
          <div>
            <h2 className="mb-2 font-serif text-headline-md font-medium text-on-surface">Fulfilment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {FULFILMENT.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFulfilment(f.value)}
                  className={`flex items-center gap-3 rounded-lg border p-token-sm text-left transition-colors ${
                    fulfilment === f.value ? "border-primary bg-primary-fixed/30" : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <Icon name={f.icon} size={24} className={fulfilment === f.value ? "text-primary" : "text-on-surface-variant"} />
                  <span>
                    <span className="block font-semibold text-on-surface">{f.label}</span>
                    <span className="block text-label-sm text-on-surface-variant">{f.meta}</span>
                  </span>
                  {fulfilment === f.value && <Icon name="check_circle" size={20} className="ml-auto text-primary" filled />}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <h2 className="mb-2 font-serif text-headline-md font-medium text-on-surface">Payment</h2>
            <div className="space-y-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPayment(p.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-token-sm text-left transition-colors ${
                    payment === p.value ? "border-primary bg-primary-fixed/30" : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <Icon name={p.icon} size={22} className="text-on-surface-variant" />
                  <span className="font-medium text-on-surface">{p.label}</span>
                  {payment === p.value && <Icon name="check_circle" size={20} className="ml-auto text-primary" filled />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside>
          <Card padding="md" className="sticky top-20">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Order summary</h2>
            <dl className="mt-3 space-y-2 text-body-md">
              <div className="flex justify-between"><dt className="text-on-surface-variant">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-on-surface-variant">Delivery</dt><dd className="font-medium">{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</dd></div>
              <div className="flex justify-between text-secondary"><dt className="inline-flex items-center gap-1"><Icon name="redeem" size={16} /> Producer Rewards</dt><dd className="font-medium">−{formatPrice(rewardsDiscount)}</dd></div>
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-surface-highest pt-3">
              <span className="font-serif text-headline-md font-medium text-on-surface">Total</span>
              <span className="font-serif text-headline-lg font-semibold text-primary">{formatPrice(total)}</span>
            </div>

            <div className="mt-3 flex overflow-hidden rounded-full border border-outline-variant">
              <Input placeholder="Promo code" className="flex-1 [&_input]:border-0" aria-label="Promo code" />
              <button className="px-4 text-label-md font-semibold text-secondary">Apply</button>
            </div>

            <Button className="mt-4" size="lg" fullWidth icon="lock" onClick={() => setPlaced(true)}>
              Place order
            </Button>

            {soleSeller && (
              <>
                <p className="my-2 text-center text-label-sm text-outline">or</p>
                <WhatsAppButton href={whatsappOrderLink(soleSeller, lines)} variant="secondary" fullWidth />
              </>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <TrustBadge kind="traceable" compact />
              <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
                <Icon name="eco" size={14} className="text-secondary" /> Carbon-neutral delivery
              </span>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
