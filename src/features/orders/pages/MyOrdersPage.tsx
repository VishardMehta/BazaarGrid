import { Link } from "react-router-dom";
import { Badge, Button, Card, Icon } from "@/components/ui";
import { OrderTimeline, ProductThumb, EmptyState } from "@/components/shared";
import { formatPrice, formatDate } from "@/lib/format";
import { getOrdersByBuyer, currentBuyer, getProductById } from "@/shared/mocks";
import type { Order, OrderStatus } from "@/shared/types";

const STATUS_TONE: Record<OrderStatus, "green" | "turmeric" | "terracotta" | "info" | "error"> = {
  PLACED: "info",
  CONFIRMED: "turmeric",
  PACKED: "turmeric",
  IN_TRANSIT: "terracotta",
  DELIVERED: "green",
  CANCELLED: "error",
};

function OrderCard({ order }: { order: Order }) {
  const active = order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const producers = new Set(order.items.map((i) => i.sellerId)).size;

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">{order.id}</h3>
            <Badge tone={STATUS_TONE[order.status]} icon={order.channel === "WHATSAPP" ? "chat" : undefined}>
              {order.status.replace("_", " ").toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-label-md text-on-surface-variant">
            Placed {formatDate(order.placedAt)} · {producers} producer{producers > 1 ? "s" : ""} · {order.channel === "WHATSAPP" ? "WhatsApp" : "App"} order
          </p>
        </div>
        <span className="font-serif text-headline-md font-semibold text-primary">{formatPrice(order.total)}</span>
      </div>

      {active && <OrderTimeline status={order.status} className="my-token-md" />}

      <ul className="mt-token-sm divide-y divide-surface-highest">
        {order.items.map((item) => {
          const product = getProductById(item.productId);
          return (
            <li key={item.productId} className="flex items-center gap-3 py-2.5">
              {product ? (
                <ProductThumb product={product} className="h-12 w-12 shrink-0" iconSize={20} />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-md bg-surface-high text-outline">
                  <Icon name="inventory_2" size={18} />
                </span>
              )}
              <div className="flex-1">
                <p className="text-body-md font-medium text-on-surface">{item.name}</p>
                <p className="text-label-sm text-on-surface-variant">Qty {item.quantity} · {formatPrice(item.price)}</p>
              </div>
              {item.traceable && (
                <Link
                  to={`/product/${item.productId}/passport`}
                  className="inline-flex items-center gap-1 text-label-md font-semibold text-secondary hover:text-primary"
                >
                  <Icon name="qr_code_2" size={16} /> Trace
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {order.status === "DELIVERED" && (
        <div className="mt-token-sm flex items-center justify-between border-t border-surface-highest pt-token-sm">
          <span className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
            <Icon name="grade" size={16} className="text-tertiary-fixed-dim" filled /> Rate this order
          </span>
          <Button size="sm" variant="secondary" icon="replay">Buy again</Button>
        </div>
      )}
    </Card>
  );
}

export function MyOrdersPage() {
  const orders = getOrdersByBuyer(currentBuyer.id);
  const ongoing = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const producersSupported = new Set(orders.flatMap((o) => o.items.map((i) => i.sellerId))).size;

  return (
    <div className="container-page py-token-md">
      <header className="mb-token-md">
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Your Order History</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Track every purchase and verify the origin of your goods.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState icon="receipt_long" title="No orders yet" message="Your traceable orders will appear here." action={{ label: "Start shopping", to: "/shop" }} />
      ) : (
        <>
          <div className="mb-token-md grid gap-token-md sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-secondary-container p-token-md text-secondary-on-container">
              <Icon name="local_shipping" size={28} />
              <div>
                <p className="font-serif text-headline-md font-medium">{ongoing.length} ongoing shipment{ongoing.length !== 1 ? "s" : ""}</p>
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
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>

          <div className="mt-token-md text-center">
            <Button variant="secondary" icon="expand_more">Load older orders</Button>
          </div>
        </>
      )}
    </div>
  );
}
