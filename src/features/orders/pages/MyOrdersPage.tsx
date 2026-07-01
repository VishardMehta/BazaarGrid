import { Link } from "react-router-dom";
import { Badge, Button, Card, Icon } from "@/components/ui";
import { OrderTimeline, EmptyState } from "@/components/shared";
import { formatPrice, formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { useMyOrders, useAdvanceOrderStatus } from "@/lib/hooks/useOrders";
import type { DbOrder, DbOrderItem } from "@/lib/supabase";
import type { OrderStatus } from "@/shared/types";

type OrderRow = DbOrder & { order_items: DbOrderItem[] };

const STATUS_TONE: Record<string, "green" | "turmeric" | "terracotta" | "info" | "error"> = {
  PLACED: "info", CONFIRMED: "turmeric", PACKED: "turmeric",
  FULFILLED: "terracotta", COMPLETED: "green", CANCELLED: "error",
};
const STATUS_LABEL: Record<string, string> = {
  PLACED: "Placed", CONFIRMED: "Confirmed", PACKED: "Packed",
  FULFILLED: "In Transit", COMPLETED: "Delivered", CANCELLED: "Cancelled",
};

function OrderCard({ order, onCancel, cancelling }: { order: OrderRow; onCancel: (id: string) => void; cancelling: boolean }) {
  const items  = order.order_items ?? [];
  const active = order.status !== "COMPLETED" && order.status !== "CANCELLED";

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">{order.id}</h3>
            <Badge tone={STATUS_TONE[order.status] ?? "info"} icon={order.channel === "WHATSAPP" ? "chat" : undefined}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          <p className="mt-1 text-label-md text-on-surface-variant">
            Placed {formatDate(order.placed_at)} · {order.fulfillment === "PICKUP" ? "Village pickup" : "Delivery"} ·{" "}
            {order.channel === "WHATSAPP" ? "WhatsApp" : "App"} order
          </p>
        </div>
        <span className="font-serif text-headline-md font-semibold text-primary">{formatPrice(order.total)}</span>
      </div>

      {active && <OrderTimeline status={order.status as OrderStatus} className="my-token-md" />}

      <ul className="mt-token-sm divide-y divide-surface-highest">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            {item.image_url ? (
              <img src={item.image_url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-md bg-surface-high text-outline">
                <Icon name="inventory_2" size={18} />
              </span>
            )}
            <div className="flex-1">
              <p className="text-body-md font-medium text-on-surface">{item.name}</p>
              <p className="text-label-sm text-on-surface-variant">Qty {item.quantity} · {formatPrice(item.price)}</p>
            </div>
            {item.traceable && item.product_id && (
              <Link
                to={`/product/${item.product_id}/passport`}
                className="inline-flex items-center gap-1 text-label-md font-semibold text-secondary hover:text-primary"
              >
                <Icon name="qr_code_2" size={16} /> Trace
              </Link>
            )}
          </li>
        ))}
      </ul>

      {order.fulfillment === "PICKUP" && order.pickup_location && (
        <p className="mt-token-sm inline-flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <Icon name="storefront" size={16} /> Pickup at {order.pickup_location}
        </p>
      )}

      <div className="mt-token-sm flex items-center justify-between border-t border-surface-highest pt-token-sm">
        {order.status === "COMPLETED" ? (
          <>
            <span className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
              <Icon name="grade" size={16} className="text-tertiary-fixed-dim" filled /> Rate this order
            </span>
            <Button size="sm" variant="secondary" icon="replay">Buy again</Button>
          </>
        ) : order.status === "PLACED" ? (
          <>
            <span />
            <Button
              size="sm"
              variant="secondary"
              icon={cancelling ? "hourglass_empty" : "cancel"}
              disabled={cancelling}
              onClick={() => onCancel(order.id)}
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          </>
        ) : (
          <span className="text-label-sm text-on-surface-variant">Updated {formatDate(order.updated_at)}</span>
        )}
      </div>
    </Card>
  );
}

export function MyOrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders(user?.id ?? null);
  const advance = useAdvanceOrderStatus();

  if (!user) {
    return (
      <div className="container-page py-token-lg">
        <EmptyState
          icon="receipt_long"
          title="Sign in to view your orders"
          message="Track every purchase and verify the origin of your goods."
          action={{ label: "Sign in", to: "/login" }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-page py-token-lg">
        <div className="flex flex-col items-center gap-4 py-24 text-on-surface-variant">
          <Icon name="hourglass_empty" size={40} className="animate-spin" />
          <p className="text-body-md">Loading your orders…</p>
        </div>
      </div>
    );
  }

  const rows              = orders as unknown as OrderRow[];
  const ongoing           = rows.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const producersSupported = new Set(rows.map((o) => o.seller_id).filter(Boolean)).size;

  return (
    <div className="container-page py-token-md">
      <header className="mb-token-md flex items-end justify-between">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Your Order History</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track every purchase and verify the origin of your goods.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="No orders yet"
          message="Your traceable orders will appear here."
          action={{ label: "Start shopping", to: "/shop" }}
        />
      ) : (
        <>
          <div className="mb-token-md grid gap-token-md sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-secondary-container p-token-md text-secondary-on-container">
              <Icon name="local_shipping" size={28} />
              <div>
                <p className="font-serif text-headline-md font-medium">
                  {ongoing.length} ongoing shipment{ongoing.length !== 1 ? "s" : ""}
                </p>
                <p className="text-label-md">In transit toward you right now.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-primary p-token-md text-primary-on">
              <Icon name="verified" size={28} filled />
              <div>
                <p className="font-serif text-headline-md font-medium">{producersSupported} producers supported</p>
                <p className="text-label-md text-primary-on/85">100% QR-traceable purchases.</p>
              </div>
            </div>
          </div>

          <div className="space-y-token-md">
            {rows.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                cancelling={advance.isPending}
                onCancel={(id) => advance.mutate({ orderId: id, status: "CANCELLED" })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
