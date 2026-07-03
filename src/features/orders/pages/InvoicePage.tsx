import { useParams, Link } from "react-router-dom";
import { Button, Icon } from "@/components/ui";
import { formatPrice, formatDate } from "@/lib/format";
import { useOrder } from "@/lib/hooks/useOrders";
import { useSeller } from "@/lib/hooks/useSellers";
import { useAuth } from "@/features/auth/AuthContext";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

const PAYMENT_LABEL: Record<string, string> = {
  CARD: "Card",
  UPI: "UPI",
  COD: "Cash on delivery",
};

/** Printable invoice — window.print() with dedicated print CSS below. */
export function InvoicePage() {
  const { orderId } = useParams();
  const { profile } = useAuth();
  const { data: order, isLoading } = useOrder(orderId);
  const { data: seller } = useSeller(order?.seller_id ?? undefined);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }
  if (!order || order.buyer_id !== profile?.id) return <NotFoundPage />;

  const items = order.order_items ?? [];

  return (
    <div className="container-page py-token-md">
      <style>{`
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body { background: #fff; }
          .invoice-sheet { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print mb-token-md flex items-center justify-between">
        <Link to="/orders" className="inline-flex items-center gap-1 text-label-md font-semibold text-secondary hover:text-primary">
          <Icon name="arrow_back" size={16} /> Back to orders
        </Link>
        <Button icon="print" onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="invoice-sheet mx-auto max-w-2xl rounded-xl border border-surface-highest bg-surface-lowest p-token-lg shadow-tinted">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-highest pb-token-sm">
          <div>
            <p className="font-serif text-headline-lg font-semibold text-primary">BazaarGrid</p>
            <p className="text-label-sm text-on-surface-variant">Invoice · Order {order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-label-sm text-on-surface-variant">Placed</p>
            <p className="font-medium text-on-surface">{formatDate(order.placed_at)}</p>
            <p className={`mt-1 inline-flex items-center gap-1 text-label-sm font-semibold ${order.payment_status === "PAID" ? "text-secondary" : "text-primary"}`}>
              <Icon name={order.payment_status === "PAID" ? "check_circle" : "schedule"} size={14} filled />
              {order.payment_status === "PAID" ? "Paid" : "Payment pending"}
            </p>
          </div>
        </div>

        <div className="mt-token-sm grid gap-token-sm sm:grid-cols-2">
          <div>
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Billed to</p>
            <p className="mt-0.5 font-medium text-on-surface">{profile?.name ?? "Buyer"}</p>
            {profile?.phone && <p className="text-body-md text-on-surface-variant">{profile.phone}</p>}
          </div>
          <div>
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Sold by</p>
            <p className="mt-0.5 font-medium text-on-surface">{seller?.name ?? "—"}</p>
            {seller?.village && <p className="text-body-md text-on-surface-variant">{seller.village}{seller.region ? `, ${seller.region}` : ""}</p>}
          </div>
        </div>

        <table className="mt-token-md w-full text-left text-body-md">
          <thead>
            <tr className="border-b border-surface-highest text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-highest">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5 text-on-surface">
                  {it.name}
                  {it.batch_id && <span className="ml-1.5 text-label-sm text-outline">· {it.batch_id}</span>}
                </td>
                <td className="py-2.5 text-right text-on-surface-variant">{it.quantity}</td>
                <td className="py-2.5 text-right text-on-surface-variant">{formatPrice(it.price)}</td>
                <td className="py-2.5 text-right font-medium text-on-surface">{formatPrice(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-token-sm ml-auto max-w-xs space-y-1.5 text-body-md">
          <div className="flex justify-between"><span className="text-on-surface-variant">Subtotal</span><span>{formatPrice(order.subtotal ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Delivery</span><span>{order.delivery_fee ? formatPrice(order.delivery_fee) : "Free"}</span></div>
          {order.rewards_discount > 0 && (
            <div className="flex justify-between text-secondary"><span>Discount</span><span>−{formatPrice(order.rewards_discount)}</span></div>
          )}
          <div className="flex justify-between border-t border-surface-highest pt-1.5 font-serif text-headline-md font-semibold text-on-surface">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
          <p className="pt-1 text-label-sm text-on-surface-variant">
            Paid via {PAYMENT_LABEL[order.payment_method ?? ""] ?? order.payment_method ?? "—"}
          </p>
        </div>

        <p className="mt-token-md border-t border-surface-highest pt-token-sm text-center text-label-sm text-outline">
          Thank you for supporting local producers — BazaarGrid
        </p>
      </div>
    </div>
  );
}
