import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Select, Textarea } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { CsvUpload } from "@/features/catalog/components/CsvUpload";
import { formatPrice } from "@/lib/format";
import { PRODUCER_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile } from "@/lib/hooks/useSellers";
import { useAllSellerProducts, useAddProduct, useDeleteProduct, useUpdateProduct } from "@/lib/hooks/useProducts";
import type { ProductStatus, ProductCategory } from "@/shared/types";

const STATUS_TONE: Record<ProductStatus, "green" | "turmeric" | "info"> = {
  LIVE: "green", DRAFT: "info", PENDING_APPROVAL: "turmeric",
};
const STATUS_LABEL: Record<ProductStatus, string> = {
  LIVE: "Live", DRAFT: "Draft", PENDING_APPROVAL: "Pending",
};

export function ProducerInventoryPage() {
  const { profile } = useAuth();
  const { data: seller } = useMySellerProfile(profile?.id ?? null);
  const { data: products = [] } = useAllSellerProducts(seller?.id ?? null);
  const addProduct    = useAddProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const [filter,    setFilter]    = useState<ProductStatus | "ALL">("ALL");
  const [mode,      setMode]      = useState<"single" | "bulk">("single");
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);

  const shown = filter === "ALL" ? products : products.filter((p) => p.status === filter);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!seller) return;
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const isDraft = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action") === "draft";
    setSubmitting(true);
    await addProduct.mutateAsync({
      seller_id:   seller.id,
      name:        data.get("name") as string,
      description: data.get("description") as string,
      price:       parseFloat(data.get("price") as string),
      unit:        data.get("unit") as string,
      category:    (data.get("category") as ProductCategory) ?? "OTHER",
      stock:       parseInt(data.get("stock") as string) || 0,
      organic:     data.get("organic") === "on",
      traceable:   data.get("traceable") === "on",
      status:      isDraft ? "DRAFT" : "PENDING_APPROVAL",
    });
    setSubmitting(false);
    setSubmitted(true);
    form.reset();
    setTimeout(() => setSubmitted(false), 3000);
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
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Inventory</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {products.length} total · {products.filter((p) => p.status === "LIVE").length} live
          </p>
        </div>
        <div className="flex gap-2">
          {(["ALL", "LIVE", "DRAFT", "PENDING_APPROVAL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-label-sm font-semibold transition-colors ${
                filter === s
                  ? "bg-secondary text-secondary-on"
                  : "border border-outline-variant text-on-surface-variant hover:border-outline"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Product</th>
                <th className="px-token-md py-2.5 font-semibold">Category</th>
                <th className="px-token-md py-2.5 font-semibold">Stock</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Price</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {shown.map((p) => (
                <tr key={p.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3">
                    <div>
                      <p className="font-medium text-on-surface">{p.name}</p>
                      {p.tags && <p className="text-label-sm text-on-surface-variant">{p.tags.slice(0, 2).join(" · ")}</p>}
                    </div>
                  </td>
                  <td className="px-token-md py-3 text-on-surface-variant">{p.category.toLowerCase()}</td>
                  <td className="px-token-md py-3">
                    <span className={`inline-flex items-center gap-1 ${(p.stock ?? 0) < 20 ? "text-primary" : "text-secondary"}`}>
                      <Icon name="circle" size={8} filled />
                      {p.stock ?? 0} {p.unit}
                    </span>
                  </td>
                  <td className="px-token-md py-3">
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className="px-token-md py-3 text-right font-semibold text-on-surface">{formatPrice(p.price, p.currency)}</td>
                  <td className="px-token-md py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "LIVE" ? (
                        <button
                          disabled={updateProduct.isPending}
                          onClick={() => updateProduct.mutate({ id: p.id, status: "DRAFT" })}
                          title="Unpublish (move to draft)"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-label-sm font-semibold text-on-surface-variant hover:bg-surface-high"
                        >
                          <Icon name="pause_circle" size={16} /> Unpublish
                        </button>
                      ) : (
                        <button
                          disabled={updateProduct.isPending}
                          onClick={() => updateProduct.mutate({ id: p.id, status: "LIVE" })}
                          title="Publish (make live)"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-label-sm font-semibold text-secondary hover:bg-secondary-container/40"
                        >
                          <Icon name="publish" size={16} /> Publish
                        </button>
                      )}
                      <button
                        disabled={deleteProduct.isPending}
                        onClick={() => deleteProduct.mutate(p.id)}
                        title="Delete product"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-error-container hover:text-error"
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-token-md py-8 text-center text-on-surface-variant">
                    No products match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add product */}
      <Card padding="md" className="mt-token-lg" id="add-product">
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
            <form onSubmit={handleAddProduct} className="grid gap-token-md md:grid-cols-2">
              <Input name="name"     label="Product name"   placeholder="e.g. Wildflower Forest Honey" required />
              <Select name="category" label="Category" required defaultValue="HONEY">
                <option value="HONEY">Honey</option>
                <option value="OILS">Oils</option>
                <option value="DAIRY">Dairy</option>
                <option value="GRAINS">Grains</option>
                <option value="POTTERY">Pottery</option>
                <option value="TEXTILES">Textiles</option>
                <option value="SPICES">Spices</option>
                <option value="CRAFTS">Crafts</option>
              </Select>
              <Input name="price" label="Price (₹)"       type="number" step="0.01" placeholder="250" required />
              <Input name="unit"  label="Unit"             placeholder="500g jar" required />
              <Input name="stock" label="Stock quantity"   type="number" placeholder="100" />
              <Textarea name="description" className="md:col-span-2" label="Description" placeholder="Tell the heritage story…" rows={3} />
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                  <input type="checkbox" name="organic"   defaultChecked className="h-4 w-4 accent-secondary" /> Organic certified
                </label>
                <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
                  <input type="checkbox" name="traceable" defaultChecked className="h-4 w-4 accent-secondary" /> Enable QR traceability
                </label>
              </div>
              {submitted && (
                <div className="md:col-span-2 flex items-center gap-2 rounded-lg bg-secondary-container/40 px-3 py-2 text-label-sm text-secondary-on-container">
                  <Icon name="check_circle" size={16} filled /> Product submitted for approval!
                </div>
              )}
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" data-action="draft" variant="secondary" icon="save" disabled={submitting}>
                  Save as draft
                </Button>
                <Button type="submit" icon={submitted ? "check" : "send"} disabled={submitting || !seller}>
                  {submitting ? "Submitting…" : submitted ? "Submitted!" : "Submit for approval"}
                </Button>
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
