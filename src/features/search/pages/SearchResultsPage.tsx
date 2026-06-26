import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Chip, Icon, Select } from "@/components/ui";
import { ProductCard, EmptyState } from "@/components/shared";
import { useCart } from "@/features/cart/CartContext";
import { products, sellers, getSellerById } from "@/shared/mocks";
import type { ProductCategory, SortOption } from "@/shared/types";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "HONEY", label: "Honey" },
  { value: "OILS", label: "Oils" },
  { value: "POTTERY", label: "Pottery" },
  { value: "TEXTILES", label: "Textiles" },
  { value: "DAIRY", label: "Dairy" },
  { value: "GRAINS", label: "Grains" },
];

const SORTS: { value: SortOption; label: string }[] = [
  { value: "RELEVANCE", label: "Relevance" },
  { value: "POPULARITY", label: "Popularity" },
  { value: "PRICE_ASC", label: "Price: Low to High" },
  { value: "PRICE_DESC", label: "Price: High to Low" },
  { value: "NEWEST", label: "Newest" },
];

const VILLAGES = Array.from(new Set(sellers.map((s) => s.village)));

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { add } = useCart();

  const [cats, setCats] = useState<ProductCategory[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(50);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("RELEVANCE");

  const toggle = <T,>(arr: T[], v: T, set: (n: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const results = useMemo(() => {
    let list = products.filter((p) => p.status === "LIVE");
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          getSellerById(p.sellerId)?.name.toLowerCase().includes(q),
      );
    }
    if (cats.length) list = list.filter((p) => cats.includes(p.category));
    if (villages.length)
      list = list.filter((p) => villages.includes(getSellerById(p.sellerId)?.village ?? ""));
    list = list.filter((p) => p.price <= maxPrice);
    if (verifiedOnly) list = list.filter((p) => getSellerById(p.sellerId)?.verified);

    switch (sort) {
      case "PRICE_ASC": list = [...list].sort((a, b) => a.price - b.price); break;
      case "PRICE_DESC": list = [...list].sort((a, b) => b.price - a.price); break;
      case "POPULARITY": list = [...list].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)); break;
      case "NEWEST": list = [...list].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")); break;
    }
    return list;
  }, [query, cats, villages, maxPrice, verifiedOnly, sort]);

  return (
    <div className="container-page py-token-md">
      <header className="mb-token-md">
        <p className="text-label-md uppercase tracking-[0.1em] text-primary">Results</p>
        <h1 className="mt-1 font-serif text-headline-lg font-medium text-on-surface">
          {query ? `“${query}”` : "All heritage goods"}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Showing {results.length} of {products.length} items across {VILLAGES.length} villages
        </p>
      </header>

      <div className="grid gap-token-md lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-token-md">
          <Card padding="md">
            <h2 className="mb-3 text-label-md font-semibold uppercase tracking-[0.05em] text-secondary">
              Category
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.value} selected={cats.includes(c.value)} onClick={() => toggle(cats, c.value, setCats)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <h2 className="mb-3 text-label-md font-semibold uppercase tracking-[0.05em] text-secondary">
              Max price
            </h2>
            <input
              type="range"
              min={10}
              max={50}
              step={1}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Maximum price"
            />
            <p className="mt-1 text-body-md text-on-surface">Up to ${maxPrice}.00</p>
          </Card>

          <Card padding="md">
            <h2 className="mb-3 text-label-md font-semibold uppercase tracking-[0.05em] text-secondary">
              Origin village
            </h2>
            <div className="flex flex-wrap gap-2">
              {VILLAGES.map((v) => (
                <Chip key={v} selected={villages.includes(v)} onClick={() => toggle(villages, v, setVillages)}>
                  {v}
                </Chip>
              ))}
            </div>
          </Card>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary-container p-token-sm text-secondary-on-container">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 accent-secondary"
            />
            <span className="flex items-center gap-1 text-label-md font-semibold">
              <Icon name="verified" size={16} filled /> Verified producers only
            </span>
          </label>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-token-sm flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <Chip selected icon="grid_view">Products ({results.length})</Chip>
              <Chip icon="cottage">Villages ({VILLAGES.length})</Chip>
              <Chip icon="person">Producers ({sellers.length})</Chip>
            </div>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="Sort results"
              className="w-48"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>Sort: {s.label}</option>
              ))}
            </Select>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="No matches yet"
              message="Try removing a filter or widening your price range."
            />
          ) : (
            <div className="grid grid-cols-2 gap-token-md xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={add} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
