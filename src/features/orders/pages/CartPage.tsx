import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Icon, Input } from "@/components/ui";
import { ProductThumb, QuantityStepper, EmptyState, TrustBadge } from "@/components/shared";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/features/cart/CartContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useAddresses } from "@/lib/hooks/useAddresses";
import { useRewardBalance } from "@/lib/hooks/useRewards";
import { payWithRazorpay, type RazorpaySuccessResponse } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";
import { WhatsAppButton } from "@/features/whatsapp/WhatsAppButton";
import type { FulfillmentMethod, PaymentMethod } from "@/shared/types";

const FULFILMENT: { value: FulfillmentMethod; label: string; icon: string; meta: string }[] = [
  { value: "DELIVERY", label: "Delivery",       icon: "local_shipping", meta: "Arrives in 2–3 days" },
  { value: "PICKUP",   label: "Village Pickup",  icon: "storefront",     meta: "Ready in 3 hours" },
];

const PAYMENTS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "CARD",           label: "Visa •••• 4242",           icon: "credit_card" },
  { value: "DIGITAL_WALLET", label: "Digital Wallet (UPI/Pay)", icon: "account_balance_wallet" },
  { value: "COD",            label: "Cash on delivery",          icon: "payments" },
];

// Cart PaymentMethod → DB payment_method value
const PAYMENT_DB: Record<PaymentMethod, string> = { CARD: "CARD", DIGITAL_WALLET: "UPI", COD: "COD" };

export function CartPage() {
  const { lines, subtotal, setQty, remove, count, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: addresses = [] } = useAddresses(user?.id ?? null);

  const [fulfilment, setFulfilment] = useState<FulfillmentMethod>("DELIVERY");
  const [payment, setPayment]       = useState<PaymentMethod>("CARD");
  const [addressId, setAddressId]   = useState<string>("");
  const [manualAddr, setManualAddr] = useState({ line1: "", city: "", postal_code: "" });
  const [placing, setPlacing]       = useState(false);
  const [placed,  setPlaced]        = useState(false);
  const [earned,  setEarned]        = useState(0);
  const [error,   setError]         = useState<string | null>(null);
  const [_waLoading, setWaLoading]  = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo]           = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Harvest Tokens: 1 token per ₹10 earned; 100 tokens = ₹10 off (1 token = ₹0.10)
  const { data: tokenBalance = 0 } = useRewardBalance(user?.id ?? null);
  const [useTokens, setUseTokens]  = useState(false);
  const tokensUsable = Math.min(tokenBalance, Math.floor(subtotal * 10));
  const tokenValue   = Math.round(tokensUsable * 0.10 * 100) / 100;

  const deliveryFee     = fulfilment === "DELIVERY" ? (subtotal > 999 ? 0 : 49) : 0;
  const rewardsDiscount = useTokens && tokensUsable > 0 ? tokenValue : 0;
  const promoDiscount   = useMemo(
    () => (promo ? Math.round(subtotal * (promo.percent / 100) * 100) / 100 : 0),
    [promo, subtotal],
  );
  const total           = Math.max(0, subtotal + deliveryFee - rewardsDiscount - promoDiscount);

  const sellerIds  = new Set(lines.map((l) => l.product.sellerId));
  const soloSeller = sellerIds.size === 1 ? lines[0]?.product.sellerId : undefined;

  const selectedAddress = addresses.find((a) => a.id === addressId) ?? addresses[0];

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const { data, error: err } = await supabase
      .from("promo_codes")
      .select("code, percent_off, min_order")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (err || !data) { setPromo(null); setPromoError("Invalid or expired code."); return; }
    if (subtotal < (data.min_order ?? 0)) {
      setPromo(null);
      setPromoError(`Spend ${formatPrice(data.min_order)} to use ${code}.`);
      return;
    }
    setPromo({ code: data.code, percent: data.percent_off });
  }

  async function handlePlaceOrder() {
    setError(null);
    if (!user) { navigate("/login", { state: { from: { pathname: "/cart" } } }); return; }

    // Delivery needs an address; pickup does not
    let deliveryAddress: Record<string, unknown> | null = null;
    if (fulfilment === "DELIVERY") {
      if (selectedAddress) deliveryAddress = { ...selectedAddress };
      else if (manualAddr.line1.trim()) deliveryAddress = { ...manualAddr, country: "India" };
      else { setError("Add a delivery address, or choose Village Pickup."); return; }
    }

    setPlacing(true);
    try {
      let earnedTokens = 0;

      // COD skips the gateway entirely; every other method is charged once,
      // up front, for the full basket total via Razorpay Checkout.
      let paymentResult: RazorpaySuccessResponse | null = null;
      if (payment !== "COD") {
        paymentResult = await payWithRazorpay({
          amountRupees: total,
          receipt: `bg-${user.id.slice(0, 8)}-${Date.now()}`,
          buyerEmail: user.email ?? undefined,
        });
      }

      // One order per seller; look up each seller's village for pickup
      const bySeller = new Map<string, typeof lines>();
      for (const line of lines) {
        const arr = bySeller.get(line.product.sellerId) ?? [];
        arr.push(line);
        bySeller.set(line.product.sellerId, arr);
      }

      for (const [sellerId, sellerLines] of bySeller) {
        const groupSubtotal = sellerLines.reduce((s, l) => s + l.product.price * l.quantity, 0);
        const share         = subtotal > 0 ? groupSubtotal / subtotal : 1;
        const groupFee      = Math.round(deliveryFee * share * 100) / 100;
        const groupRewards  = Math.round(rewardsDiscount * share * 100) / 100;
        const groupPromo    = Math.round(promoDiscount * share * 100) / 100;
        const groupTotal    = Math.max(0, groupSubtotal + groupFee - groupRewards - groupPromo);

        let pickup: string | null = null;
        if (fulfilment === "PICKUP") {
          const { data: s } = await supabase
            .from("sellers").select("village, region, name").eq("id", sellerId).maybeSingle();
          pickup = s ? [s.name, s.village, s.region].filter(Boolean).join(", ") : null;
        }

        const { data: order, error: oErr } = await supabase
          .from("orders")
          .insert({
            buyer_id:         user.id,
            seller_id:        sellerId,
            status:           "PLACED",
            channel:          "APP",
            subtotal:         groupSubtotal,
            delivery_fee:     groupFee,
            rewards_discount: groupRewards,
            total:            groupTotal,
            fulfillment:      fulfilment,
            payment_method:   PAYMENT_DB[payment],
            payment_status:      paymentResult ? "PAID" : "PENDING",
            razorpay_order_id:   paymentResult?.razorpay_order_id ?? null,
            razorpay_payment_id: paymentResult?.razorpay_payment_id ?? null,
            promo_code:       promo?.code ?? null,
            delivery_address: deliveryAddress,
            pickup_location:  pickup,
          })
          .select()
          .single();
        if (oErr) throw new Error(oErr.message);

        const items = sellerLines.map((l) => ({
          order_id:   order.id,
          product_id: l.product.id,
          seller_id:  sellerId,
          name:       l.product.name,
          unit:       l.product.unit ?? null,
          quantity:   l.quantity,
          price:      l.product.price,
          subtotal:   Math.round(l.product.price * l.quantity * 100) / 100,
          traceable:  l.product.traceable ?? false,
          batch_id:   l.product.batchId ?? null,
          image_url:  l.product.images?.[0] ?? null,
        }));
        const { error: iErr } = await supabase.from("order_items").insert(items);
        if (iErr) throw new Error(iErr.message);

        earnedTokens += Math.floor(groupTotal / 10); // mirrors the DB earn trigger
      }

      // Record token redemption (100 tokens = ₹10)
      if (useTokens && tokensUsable > 0) {
        await supabase.from("reward_transactions").insert({
          profile_id:  user.id,
          type:        "REDEEM",
          points:      tokensUsable,
          description: `Redeemed at checkout (₹${tokenValue.toFixed(2)} off)`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // stock changed
      setEarned(earnedTokens);
      clear();
      setPlaced(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  async function handleWhatsappOrder() {
    if (!soloSeller) return;
    setWaLoading(true);
    const waLine = lines.map((l) => ({ product: l.product, quantity: l.quantity }));
    // Build a simple WA link without seller object — use generic number
    const text = encodeURIComponent(
      `BazaarGrid Order:\n` +
        waLine.map((l) => `• ${l.product.name} × ${l.quantity} = ₹${(l.product.price * l.quantity).toFixed(2)}`).join("\n") +
        `\n\nTotal: ₹${total.toFixed(2)}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noreferrer");
    setWaLoading(false);
    clear();
    setPlaced(true);
  }

  if (lines.length === 0 && !placed) {
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
            Thank you. Your order is confirmed and traceable end-to-end. Track its journey from My Orders.
          </p>
          {earned > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-4 py-2 text-label-md font-semibold text-secondary-on-container">
              <Icon name="redeem" size={18} /> You earned {earned} Harvest Tokens!
            </p>
          )}
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
        <div className="space-y-token-md">
          <div className="flex items-center gap-2 rounded-lg bg-secondary-container px-token-sm py-2.5 text-secondary-on-container">
            <Icon name="verified_user" size={18} filled />
            <p className="text-label-md font-medium">
              Safe &amp; Traceable — every item traces back to its verified producer via QR.
            </p>
          </div>

          <Card padding="none" className="divide-y divide-surface-highest">
            {lines.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-token-sm p-token-sm">
                <ProductThumb product={product} className="h-20 w-20 shrink-0" iconSize={28} />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-body-lg font-medium text-on-surface">{product.name}</h3>
                      <span className="text-label-sm text-on-surface-variant">{product.unit}</span>
                    </div>
                    <span className="font-serif text-body-lg font-semibold text-primary">
                      {formatPrice(product.price * quantity, product.currency)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantityStepper
                      value={quantity}
                      min={0}
                      onChange={(q) => q === 0 ? remove(product.id) : setQty(product.id, q)}
                      size="sm"
                    />
                    <button
                      onClick={() => remove(product.id)}
                      className="inline-flex items-center gap-1 text-label-md text-on-surface-variant hover:text-error"
                    >
                      <Icon name="delete" size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

            {/* Delivery address / pickup detail */}
            {fulfilment === "DELIVERY" ? (
              <div className="mt-3 space-y-2">
                {addresses.length > 0 ? (
                  addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAddressId(a.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border p-token-sm text-left transition-colors ${
                        (selectedAddress?.id === a.id) ? "border-primary bg-primary-fixed/30" : "border-outline-variant hover:border-outline"
                      }`}
                    >
                      <Icon name="location_on" size={20} className="mt-0.5 text-on-surface-variant" />
                      <span className="text-body-md text-on-surface">
                        <span className="font-semibold">{a.label}</span> — {a.line1}
                        {a.city ? `, ${a.city}` : ""} {a.postal_code ?? ""}
                      </span>
                      {selectedAddress?.id === a.id && <Icon name="check_circle" size={18} className="ml-auto text-primary" filled />}
                    </button>
                  ))
                ) : (
                  <div className="grid gap-2 rounded-lg border border-outline-variant p-token-sm sm:grid-cols-2">
                    <Input placeholder="Address line" aria-label="Address line" className="sm:col-span-2"
                      value={manualAddr.line1} onChange={(e) => setManualAddr({ ...manualAddr, line1: e.target.value })} />
                    <Input placeholder="City" aria-label="City"
                      value={manualAddr.city} onChange={(e) => setManualAddr({ ...manualAddr, city: e.target.value })} />
                    <Input placeholder="Postal code" aria-label="Postal code"
                      value={manualAddr.postal_code} onChange={(e) => setManualAddr({ ...manualAddr, postal_code: e.target.value })} />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-3 rounded-lg bg-secondary-container/40 p-token-sm text-secondary-on-container">
                <Icon name="storefront" size={20} className="mt-0.5" />
                <p className="text-body-md">
                  Collect from the producer's village store. Exact pickup point is confirmed on your order once placed.
                </p>
              </div>
            )}
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
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Delivery</dt>
                <dd className="font-medium">{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</dd>
              </div>
              {user && (
                <div className="flex items-center justify-between text-secondary">
                  <dt className="inline-flex items-center gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={useTokens}
                        disabled={tokensUsable === 0}
                        onChange={(e) => setUseTokens(e.target.checked)}
                        className="h-4 w-4 accent-secondary"
                      />
                      <Icon name="redeem" size={16} />
                      Harvest Tokens
                    </label>
                    <span className="text-label-sm text-on-surface-variant">
                      {tokenBalance} available
                    </span>
                  </dt>
                  <dd className="font-medium">−{formatPrice(rewardsDiscount)}</dd>
                </div>
              )}
              {promo && (
                <div className="flex justify-between text-secondary">
                  <dt className="inline-flex items-center gap-1">
                    <Icon name="sell" size={16} /> Promo {promo.code} ({promo.percent}%)
                  </dt>
                  <dd className="font-medium">−{formatPrice(promoDiscount)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-surface-highest pt-3">
              <span className="font-serif text-headline-md font-medium text-on-surface">Total</span>
              <span className="font-serif text-headline-lg font-semibold text-primary">{formatPrice(total)}</span>
            </div>

            <div className="mt-3 flex overflow-hidden rounded-full border border-outline-variant">
              <Input
                placeholder="Promo code"
                className="flex-1 [&_input]:border-0"
                aria-label="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
              />
              <button type="button" onClick={applyPromo} className="px-4 text-label-md font-semibold text-secondary">
                {promo ? "Applied" : "Apply"}
              </button>
            </div>
            {promoError && <p className="mt-1.5 text-label-sm text-error">{promoError}</p>}
            {promo && <p className="mt-1.5 text-label-sm text-secondary">Promo {promo.code} applied — you saved {formatPrice(promoDiscount)}!</p>}

            {error && (
              <p className="mt-3 rounded-lg bg-error-container px-3 py-2 text-label-md text-error">{error}</p>
            )}

            <Button
              className="mt-4"
              size="lg"
              fullWidth
              icon={placing ? "hourglass_empty" : "lock"}
              disabled={placing}
              onClick={handlePlaceOrder}
            >
              {placing
                ? (payment === "COD" ? "Placing order…" : "Waiting for payment…")
                : payment === "COD"
                  ? "Place order · Pay on delivery"
                  : `Pay ${formatPrice(total)} & place order`}
            </Button>

            {soloSeller && (
              <>
                <p className="my-2 text-center text-label-sm text-outline">or</p>
                <WhatsAppButton
                  onClick={handleWhatsappOrder}
                  variant="secondary"
                  fullWidth
                />
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
