import { Badge, Button, Card, Icon } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { formatPrice, formatDate } from "@/lib/format";
import { PRODUCER_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";
import { useSellerOrders, useAdvanceOrderStatus } from "@/lib/hooks/useOrders";
import { useState } from "react";
import type { OrderStatus } from "@/shared/types";

const STATUS_TONE: Record<OrderStatus, "green" | "turmeric" | "terracotta" | "info" | "error"> = {
  PLACED: "info", CONFIRMED: "turmeric", PACKED: "turmeric",
  FULFILLED: "terracotta", COMPLETED: "green", CANCELLED: "error",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "Placed", CONFIRMED: "Confirmed", PACKED: "Packed",
  FULFILLED: "In Transit", COMPLETED: "Delivered", CANCELLED: "Cancelled",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "CONFIRMED", CONFIRMED: "PACKED", PACKED: "FULFILLED", FULFILLED: "COMPLETED",
};

type FilterTab = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export function ProducerOrdersPage() {
  const { profile }  = useAuth();
  const { data: seller }  = useMySellerProfile(profile?.id ?? null);
  const { data: orders = [], isLoading } = useSellerOrders(seller?.id ?? null);
  const advance = useAdvanceOrderStatus();
  const [tab, setTab] = useState<FilterTab>("ALL");

  const shown = orders.filter((o) => {
    if (tab === "ACTIVE")    return !["COMPLETED","CANCELLED"].includes(o.status);
    if (tab === "COMPLETED") return o.status === "COMPLETED";
    if (tab === "CANCELLED") return o.status === "CANCELLED";
    return true;
  });

  const TABS: { value: FilterTab; label: string; count: number }[] = [
    { value: "ALL",       label: "All",       count: orders.length },
    { value: "ACTIVE",    label: "Active",    count: orders.filter((o) => !["COMPLETED","CANCELLED"].includes(o.status)).length },
    { value: "COMPLETED", label: "Delivered", count: orders.filter((o) => o.status === "COMPLETED").length },
    { value: "CANCELLED", label: "Cancelled", count: orders.filter((o) => o.status === "CANCELLED").length },
  ];

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = "order_id,placed_at,channel,status,fulfillment,items,total";
    const lines = shown.map((o) =>
      [o.id, o.placed_at, o.channel, o.status, o.fulfillment, o.order_items?.length ?? 0, o.total].map(esc).join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PortalLayout
      portalName="Producer Portal"
      items={PRODUCER_NAV}
      user={{ name: seller?.name ?? "…", meta: seller?.village ?? "" }}
      action={{ label: "Add Product", to: "/producer/inventory", icon: "add" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Orders</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Manage and fulfil customer orders</p>
        </div>
        <Button icon="file_download" variant="secondary" onClick={exportCsv} disabled={shown.length === 0}>
          Export CSV
        </Button>
      </div>

      {/* Tab bar */}
      <nav className="mt-token-md flex gap-1 border-b border-surface-highest">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-colors ${
              tab === t.value ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.value ? "bg-primary/10 text-primary" : "bg-surface-high text-on-surface-variant"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </nav>

      <Card padding="none" className="mt-token-md overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="h-6 w-6 animate-spin rounded-full border-4 border-secondary border-t-transparent inline-block" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-label-md">
              <thead className="bg-surface-low text-on-surface-variant">
                <tr>
                  <th className="px-token-md py-2.5 font-semibold">Order ID</th>
                  <th className="px-token-md py-2.5 font-semibold">Date</th>
                  <th className="px-token-md py-2.5 font-semibold">Channel</th>
                  <th className="px-token-md py-2.5 font-semibold">Items</th>
                  <th className="px-token-md py-2.5 font-semibold">Status</th>
                  <th className="px-token-md py-2.5 text-right font-semibold">Total</th>
                  <th className="px-token-md py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-highest">
                {shown.map((o) => {
                  const st     = o.status as OrderStatus;
                  const nextSt = STATUS_NEXT[st];
                  return (
                    <tr key={o.id} className="hover:bg-surface-low">
                      <td className="px-token-md py-3 font-medium text-on-surface">{o.id}</td>
                      <td className="px-token-md py-3 text-on-surface-variant">{formatDate(o.placed_at)}</td>
                      <td className="px-token-md py-3">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant">
                          <Icon name={o.channel === "WHATSAPP" ? "chat" : "shopping_bag"} size={15} />
                          {o.channel === "WHATSAPP" ? "WhatsApp" : "App"}
                        </span>
                      </td>
                      <td className="px-token-md py-3 text-on-surface-variant">
                        {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-token-md py-3">
                        <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Badge>
                      </td>
                      <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(o.total)}</td>
                      <td className="px-token-md py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {nextSt && (
                            <Button
                              size="sm"
                              icon="arrow_forward"
                              disabled={advance.isPending}
                              onClick={() => advance.mutate({ orderId: o.id, status: nextSt })}
                            >
                              Mark {STATUS_LABEL[nextSt]}
                            </Button>
                          )}
                          {st === "PLACED" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon="cancel"
                              disabled={advance.isPending}
                              onClick={() => advance.mutate({ orderId: o.id, status: "CANCELLED" })}
                            >
                              Cancel
                            </Button>
                          )}
                          {(st === "COMPLETED" || st === "CANCELLED") && (
                            <span className="text-label-sm text-on-surface-variant">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-token-md py-10 text-center text-on-surface-variant">
                      No orders in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PortalLayout>
  );
}
