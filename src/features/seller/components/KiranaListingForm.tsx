import { useState } from "react";
import { Button, Icon, Input, Select } from "@/components/ui";
import { useCatalogItems, useAddCatalogItem } from "@/lib/hooks/useCatalog";
import { useAddProduct } from "@/lib/hooks/useProducts";
import type { DbCatalogItem } from "@/lib/supabase";
import type { ProductCategory } from "@/shared/types";

/**
 * Listing form for KIRANA stores. Instead of inventing a heritage product,
 * the shopkeeper searches the SHARED catalogue, picks the SKU (e.g. "Tata
 * Salt 1kg"), and just sets their own price + stock. The listing goes LIVE
 * instantly (pre-vetted commodity SKU — no Village-Admin approval needed).
 * Not in the catalogue yet? Add it once, then everyone can list against it.
 */
export function KiranaListingForm({ sellerId }: { sellerId: string }) {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useCatalogItems(search);
  const addProduct = useAddProduct();
  const addCatalogItem = useAddCatalogItem();

  const [picked, setPicked] = useState<DbCatalogItem | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function listOffer() {
    if (!picked || !price) return;
    setBusy(true);
    await addProduct.mutateAsync({
      seller_id: sellerId,
      catalog_item_id: picked.id,
      name: picked.name,
      unit: picked.unit ?? "each",
      category: (picked.category as ProductCategory) ?? "GROCERY",
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      organic: false,
      traceable: false,
      status: "LIVE",
    });
    setBusy(false);
    setDone(picked.name);
    setPicked(null);
    setPrice("");
    setStock("");
    setSearch("");
    setTimeout(() => setDone(null), 3000);
  }

  async function createAndPick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const item = await addCatalogItem.mutateAsync({
      name: f.get("name") as string,
      brand: (f.get("brand") as string) || null,
      category: (f.get("category") as string) || "GROCERY",
      unit: (f.get("unit") as string) || null,
    });
    setBusy(false);
    setShowNew(false);
    setPicked(item); // jump straight to price/stock for the new SKU
  }

  return (
    <div>
      <p className="text-body-md text-on-surface-variant">
        Search the catalogue for what you stock, then set your price and quantity. Your listing goes live right away.
      </p>

      {done && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary-container/40 px-3 py-2 text-label-sm text-secondary-on-container">
          <Icon name="check_circle" size={16} filled /> {done} is now live in your store.
        </div>
      )}

      {/* Picked SKU → enter price + stock */}
      {picked ? (
        <div className="mt-token-md rounded-xl border-2 border-secondary bg-secondary-container/20 p-token-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-on-surface">{picked.name}</p>
              <p className="text-label-sm text-on-surface-variant">
                {[picked.brand, picked.unit].filter(Boolean).join(" · ")}
              </p>
            </div>
            <button onClick={() => setPicked(null)} className="text-on-surface-variant hover:text-on-surface" aria-label="Change item">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Your price (₹)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="24" autoFocus />
            <Input label="Stock quantity" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="60" />
          </div>
          <Button className="mt-3" icon="add_business" disabled={busy || !price} onClick={listOffer}>
            {busy ? "Adding…" : "Add to my store"}
          </Button>
        </div>
      ) : (
        <>
          <Input
            className="mt-token-md"
            label="Search the catalogue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Tata Salt, Aashirvaad Atta, Amul Milk"
          />
          <div className="mt-3 max-h-72 divide-y divide-surface-highest overflow-y-auto rounded-lg border border-surface-highest">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-label-md text-on-surface-variant">Loading catalogue…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-label-md text-on-surface-variant">
                No catalogue item matches “{search}”.
              </p>
            ) : (
              items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setPicked(it)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-low"
                >
                  <div>
                    <p className="font-medium text-on-surface">{it.name}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {[it.brand, it.unit, it.category.toLowerCase()].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Icon name="add_circle" size={20} className="shrink-0 text-secondary" />
                </button>
              ))
            )}
          </div>

          {/* Add a brand-new SKU to the shared catalogue */}
          {showNew ? (
            <form onSubmit={createAndPick} className="mt-token-md grid gap-3 rounded-xl border border-outline-variant p-token-sm sm:grid-cols-2">
              <Input name="name" label="Product name" placeholder="e.g. Everest Garam Masala 100g" required />
              <Input name="brand" label="Brand" placeholder="Everest" />
              <Select name="category" label="Category" defaultValue="GROCERY">
                <option value="GROCERY">Grocery</option>
                <option value="GRAINS">Grains</option>
                <option value="OILS">Oils</option>
                <option value="DAIRY">Dairy</option>
                <option value="SPICES">Spices</option>
                <option value="OTHER">Other</option>
              </Select>
              <Input name="unit" label="Unit / pack size" placeholder="100 g" />
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" variant="secondary" icon="add" disabled={busy}>Add to catalogue</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-label-md font-semibold text-secondary hover:underline"
            >
              <Icon name="add" size={16} /> Can't find it? Add a new item to the catalogue
            </button>
          )}
        </>
      )}
    </div>
  );
}
