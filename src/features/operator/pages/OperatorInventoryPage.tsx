import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Select } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { formatPrice } from "@/lib/format";
import { OPERATOR_NAV } from "@/features/seller/sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useProducts } from "@/lib/hooks/useProducts";
import { useAllSellers } from "@/lib/hooks/useSellers";
import { useVillages } from "@/lib/hooks/useVillages";
import type { ProductCategory } from "@/shared/types";

const CATEGORIES: (ProductCategory | "ALL")[] = ["ALL", "HONEY", "OILS", "DAIRY", "GRAINS", "TEXTILES", "POTTERY", "CRAFTS"];

export function OperatorInventoryPage() {
  const { profile } = useAuth();
  const { data: allProducts = [] } = useProducts({});
  const { data: allSellers  = [] } = useAllSellers();
  const { data: villages    = [] } = useVillages();

  const [category,      setCategory]      = useState<ProductCategory | "ALL">("ALL");
  const [search,        setSearch]        = useState("");
  const [villageFilter, setVillageFilter] = useState("ALL");

  const alerts = allProducts.filter((p) => p.stock < 20 && p.status === "LIVE").slice(0, 4);

  const shown = allProducts.filter((p) => {
    const seller      = allSellers.find((s) => s.id === p.seller_id);
    const matchCat    = category === "ALL" || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchVil    = villageFilter === "ALL" || seller?.village === villageFilter;
    return matchCat && matchSearch && matchVil;
  });

  return (
    <PortalLayout
      portalName="Local Operator Portal"
      items={OPERATOR_NAV}
      user={{ name: profile?.name ?? "Operator", meta: "Operator Portal" }}
      action={{ label: "Onboard Village", to: "/operator/villages", icon: "add_location_alt" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Inventory</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {allProducts.filter((p) => p.status === "LIVE").length} live SKUs across {villages.length} villages
          </p>
        </div>
        <Button icon="file_download" variant="secondary">Export CSV</Button>
      </div>

      {/* Low stock alerts */}
      {alerts.length > 0 && (
        <Card padding="md" className="mt-token-md border border-primary/20 bg-error-container/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="warning" size={20} className="text-primary" />
            <h2 className="font-serif text-headline-md font-medium text-on-surface">Low stock alerts</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((p) => {
              const seller = allSellers.find((s) => s.id === p.seller_id);
              return (
                <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface px-3 py-1.5 text-label-sm">
                  <Icon name="inventory_2" size={13} className="text-primary" />
                  <span className="font-medium text-on-surface">{p.name}</span>
                  <span className="text-on-surface-variant">·</span>
                  <span className="text-primary font-semibold">{p.stock} left</span>
                  <span className="text-on-surface-variant">· {seller?.village ?? "—"}</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="mt-token-md flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)} className="w-44">
          <option value="ALL">All villages</option>
          {villages.map((v) => <option key={v.id}>{v.name}</option>)}
        </Select>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-label-sm font-semibold transition-colors ${
                category === c
                  ? "bg-secondary text-secondary-on"
                  : "border border-outline-variant text-on-surface-variant hover:border-outline"
              }`}
            >
              {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Product</th>
                <th className="px-token-md py-2.5 font-semibold">Village</th>
                <th className="px-token-md py-2.5 font-semibold">Producer</th>
                <th className="px-token-md py-2.5 font-semibold">Category</th>
                <th className="px-token-md py-2.5 font-semibold">Stock</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {shown.map((p) => {
                const seller   = allSellers.find((s) => s.id === p.seller_id);
                const lowStock = p.stock < 20;
                return (
                  <tr key={p.id} className="hover:bg-surface-low">
                    <td className="px-token-md py-3 font-medium text-on-surface">{p.name}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{seller?.village ?? "—"}</td>
                    <td className="px-token-md py-3 text-on-surface-variant">{seller?.name ?? "—"}</td>
                    <td className="px-token-md py-3 text-on-surface-variant capitalize">{p.category.toLowerCase()}</td>
                    <td className="px-token-md py-3">
                      <span className={`inline-flex items-center gap-1 ${lowStock ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
                        {lowStock && <Icon name="warning" size={13} />}
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-token-md py-3">
                      <Badge tone={p.status === "LIVE" ? "green" : p.status === "DRAFT" ? "info" : "turmeric"}>
                        {p.status === "LIVE" ? "Live" : p.status === "DRAFT" ? "Draft" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(p.price, p.currency)}</td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-token-md py-10 text-center text-on-surface-variant">
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-surface-highest px-token-md py-3 text-label-sm text-on-surface-variant">
          Showing {shown.length} of {allProducts.length} products
        </div>
      </Card>
    </PortalLayout>
  );
}
