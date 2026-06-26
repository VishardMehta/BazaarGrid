import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Icon, Input, Select, Textarea } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { formatPrice, formatDate } from "@/lib/format";
import { sellers, orders, getProductsBySeller } from "@/shared/mocks";
import { CsvUpload } from "@/features/catalog/components/CsvUpload";
import { PRODUCER_NAV } from "../sellerNav";
import type { OrderStatus } from "@/shared/types";

const seller = sellers[0]; // demo: Green Valley Farm

const STATUS_TONE: Record<OrderStatus, "green" | "turmeric" | "terracotta" | "info" | "error"> = {
  PLACED: "info",
  CONFIRMED: "turmeric",
  PACKED: "turmeric",
  IN_TRANSIT: "terracotta",
  DELIVERED: "green",
  CANCELLED: "error",
};

export function ProducerManagementPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const myProducts = getProductsBySeller(seller.id);
  const myOrders = orders.filter((o) => o.primarySellerId === seller.id);

  return (
    <PortalLayout
      portalName="Producer Portal"
      items={PRODUCER_NAV}
      user={{ name: seller.name, meta: seller.village }}
      action={{ label: "Add Product", to: "/producer", icon: "add" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">
            Welcome back, {seller.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Your storefront is performing with {seller.traceabilityScore}% traceability.
          </p>
        </div>
        <Link
          to={`/seller/${seller.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-2 text-label-md font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
        >
          <Icon name="visibility" size={18} /> View public storefront
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Products" value={myProducts.filter((p) => p.status === "LIVE").length} icon="inventory_2" delta="+3 this week" deltaTone="up" />
        <StatCard label="Pending Orders" value={myOrders.filter((o) => o.status !== "DELIVERED").length} icon="pending_actions" />
        <StatCard label="Store Visits" value="1,284" icon="visibility" delta="+12%" deltaTone="up" />
        <StatCard label="Fulfilment SLA" value="1.4 days" icon="local_shipping" delta="Faster than avg" deltaTone="up" />
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.4fr_1fr]">
        {/* Recent orders */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-highest px-token-md py-3">
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Recent Orders</h2>
            <Link to="/producer" className="text-label-md font-semibold text-secondary hover:text-primary">View all</Link>
          </div>
          <table className="w-full text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Order</th>
                <th className="px-token-md py-2.5 font-semibold">Channel</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {myOrders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3 font-medium text-on-surface">{o.id}</td>
                  <td className="px-token-md py-3">
                    <span className="inline-flex items-center gap-1 text-on-surface-variant">
                      <Icon name={o.channel === "WHATSAPP" ? "chat" : "shopping_bag"} size={15} />
                      {o.channel === "WHATSAPP" ? "WhatsApp" : "App"}
                    </span>
                  </td>
                  <td className="px-token-md py-3">
                    <Badge tone={STATUS_TONE[o.status]}>{o.status.replace("_", " ").toLowerCase()}</Badge>
                  </td>
                  <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Compliance + traceability */}
        <div className="grid gap-token-md">
          <Card padding="md" className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
              <Icon name="shield" size={22} />
            </span>
            <div>
              <h3 className="font-serif text-headline-md font-medium text-on-surface">Compliance</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">All certifications valid. Next renewal {formatDate("2025-08-01")}.</p>
              <Link to="/producer" className="mt-2 inline-block text-label-md font-semibold text-secondary hover:text-primary">Review →</Link>
            </div>
          </Card>
          <Card padding="md" className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-fixed text-primary-tint">
              <Icon name="qr_code_2" size={22} />
            </span>
            <div>
              <h3 className="font-serif text-headline-md font-medium text-on-surface">Traceability Center</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{myProducts.filter((p) => p.traceable).length} products carry a live QR passport.</p>
              <Link to="/producer" className="mt-2 inline-block text-label-md font-semibold text-secondary hover:text-primary">Manage batches →</Link>
            </div>
          </Card>
        </div>
      </div>

      {/* List new product */}
      <Card padding="md" className="mt-token-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">List a new product</h2>
          <div className="inline-flex rounded-full border border-outline-variant p-1">
            <button
              onClick={() => setMode("single")}
              className={`rounded-full px-4 py-1.5 text-label-md font-semibold transition-colors ${mode === "single" ? "bg-secondary text-secondary-on" : "text-on-surface-variant"}`}
            >
              Single product
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`rounded-full px-4 py-1.5 text-label-md font-semibold transition-colors ${mode === "bulk" ? "bg-secondary text-secondary-on" : "text-on-surface-variant"}`}
            >
              Bulk CSV
            </button>
          </div>
        </div>

        <div className="mt-token-md">
          {mode === "single" ? (
            <form
              onSubmit={(e) => e.preventDefault()}
              className="grid gap-token-md md:grid-cols-2"
            >
              <Input label="Product name" placeholder="e.g. Wildflower Forest Honey" required />
              <Select label="Category" required defaultValue="HONEY">
                <option value="HONEY">Honey</option>
                <option value="OILS">Oils</option>
                <option value="DAIRY">Dairy</option>
                <option value="GRAINS">Grains</option>
                <option value="POTTERY">Pottery</option>
                <option value="TEXTILES">Textiles</option>
              </Select>
              <Input label="Base price (USD)" type="number" step="0.01" placeholder="12.50" required />
              <Input label="Unit / stock quantity" placeholder="500g jar · 64 in stock" required />
              <Textarea
                className="md:col-span-2"
                label="Description"
                placeholder="Tell the heritage and purity story of this product…"
                rows={3}
              />
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-secondary" /> Organic certified
                </label>
                <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-secondary" /> Enable QR traceability
                </label>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="button" variant="secondary" icon="save">Save as draft</Button>
                <Button type="submit" icon="send">Submit for approval</Button>
              </div>
            </form>
          ) : (
            <CsvUpload />
          )}
        </div>
      </Card>
    </PortalLayout>
  );
}
