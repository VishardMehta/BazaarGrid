import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Chip, Icon, Select } from "@/components/ui";
import { EmptyState, ProductCard, Reveal, RevealItem } from "@/components/shared";
import { groupHits } from "@/features/catalog/grouping";
import { useCart } from "@/features/cart/CartContext";
import type { ProductFacet, SortOption } from "@/shared/types";
import { SearchBar } from "../components/SearchBar";
import { SearchFilters } from "../components/SearchFilters";
import { ActiveFilters } from "../components/ActiveFilters";
import { useSearch } from "../hooks/useSearch";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "RELEVANCE",  label: "Relevance (AI)" },
  { value: "POPULARITY", label: "Most Popular" },
  { value: "RATING",     label: "Top Rated" },
  { value: "PRICE_ASC",  label: "Price: Low → High" },
  { value: "PRICE_DESC", label: "Price: High → Low" },
  { value: "NEWEST",     label: "Newest First" },
];

const SELLER_TYPE_LABEL: Record<string, string> = {
  VILLAGE_PRODUCER: "Village Producer",
  KIRANA_STORE:      "Kirana Store",
  FPO:                "FPO",
  SHG:                "Self Help Group",
};

const FACETS: { value: ProductFacet; label: string; icon: string }[] = [
  { value: "PRODUCTS",  label: "Products",  icon: "inventory_2" },
  { value: "VILLAGES",  label: "Villages",  icon: "cottage" },
  { value: "PRODUCERS", label: "Producers", icon: "person" },
];

export function SearchResultsPage() {
  const { add } = useCart();
  const {
    query, setQuery,
    hits, sort, setSort,
    filters, updateFilter, resetFilters,
    activeFilterCount,
    sellerIndex,
  } = useSearch();
  const [facet, setFacet] = useState<ProductFacet>("PRODUCTS");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sellers = [...sellerIndex.values()];
  const q = query.toLowerCase();
  const matchedSellers = q
    ? sellers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.village.toLowerCase().includes(q) ||
          s.tagline?.toLowerCase().includes(q),
      )
    : sellers;

  const villageHits = matchedSellers.filter((s) => s.type === "VILLAGE_PRODUCER");
  const producerHits = matchedSellers;

  const facetCount = {
    PRODUCTS: hits.length,
    VILLAGES: villageHits.length,
    PRODUCERS: producerHits.length,
  };

  return (
    <div className="container-page py-token-md">
      {/* Large search bar */}
      <SearchBar
        key={query}
        defaultValue={query}
        size="lg"
        placeholder="Search by product, village, origin, or ingredient…"
        onSearch={setQuery}
        className="mb-3"
      />

      {/* Active filter pills */}
      <ActiveFilters
        query={query}
        filters={filters}
        onChange={updateFilter}
        onClearQuery={() => setQuery("")}
      />

      {/* Header */}
      <header className="mb-token-md">
        <p className="text-label-md uppercase tracking-[0.1em] text-primary">
          {sort === "RELEVANCE" && query ? "AI-Scored Results" : "Results"}
        </p>
        <h1 className="mt-1 font-serif text-headline-lg font-medium text-on-surface">
          {query ? `"${query}"` : "All heritage goods"}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {facet === "PRODUCTS" &&
            `${hits.length} product${hits.length !== 1 ? "s" : ""}${
              query
                ? ` · scored across name, tags, village & story`
                : ""
            }`}
          {facet === "VILLAGES" && `${villageHits.length} village${villageHits.length !== 1 ? "s" : ""}`}
          {facet === "PRODUCERS" && `${producerHits.length} producer${producerHits.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      <div className="grid gap-token-md lg:grid-cols-[264px_1fr]">
        {/* ── Filter sidebar ── */}
        {/* Mobile toggle */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md font-semibold text-on-surface-variant transition-colors hover:border-primary lg:hidden"
        >
          <Icon name="tune" size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-on">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-surface p-token-md shadow-tinted-lg lg:hidden"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-serif text-headline-md font-medium text-on-surface">Filters</span>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full p-1 text-on-surface-variant hover:bg-surface-low"
                  >
                    <Icon name="close" size={22} />
                  </button>
                </div>
                <SearchFilters
                  filters={filters}
                  onChange={updateFilter}
                  onReset={resetFilters}
                  activeCount={activeFilterCount}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <SearchFilters
              filters={filters}
              onChange={updateFilter}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* ── Results panel ── */}
        <div>
          {/* Facet tabs + sort */}
          <div className="mb-token-sm flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {FACETS.map((f) => (
                <Chip
                  key={f.value}
                  selected={facet === f.value}
                  icon={f.icon}
                  onClick={() => setFacet(f.value)}
                >
                  {f.label} ({facetCount[f.value]})
                </Chip>
              ))}
            </div>
            {facet === "PRODUCTS" && (
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="Sort results"
                className="ml-auto w-52"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Products grid */}
          {facet === "PRODUCTS" && (
            hits.length === 0 ? (
              <EmptyState
                icon="search_off"
                title={query ? `No results for "${query}"` : "No products match your filters"}
                message={
                  query
                    ? "Try a synonym — 'ghee' for dairy, 'oil' for cold-pressed, 'bowl' for pottery."
                    : "Widen the price range or uncheck a filter."
                }
              />
            ) : (
              <Reveal
                as="div"
                stagger={0.04}
                className="grid grid-cols-2 gap-token-md xl:grid-cols-3"
              >
                {groupHits(hits).map(({ product, score, matchedFields, offerCount }) => (
                  <RevealItem key={product.catalogItemId ?? product.id}>
                    <div className="relative">
                      <ProductCard product={product} storesCount={offerCount} onAdd={add} />
                      {query && sort === "RELEVANCE" && (
                        <RelevanceBadge
                          score={score}
                          matchedFields={matchedFields}
                        />
                      )}
                    </div>
                  </RevealItem>
                ))}
              </Reveal>
            )
          )}

          {/* Villages grid */}
          {facet === "VILLAGES" && (
            villageHits.length === 0 ? (
              <EmptyState icon="cottage" title="No villages match" message="Clear your search to browse all." />
            ) : (
              <div className="grid gap-token-md sm:grid-cols-2 xl:grid-cols-3">
                {villageHits.map((s) => (
                  <Link
                    key={s.id}
                    to={`/seller/${s.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-surface-highest bg-surface-lowest p-token-md transition-all hover:border-primary hover:shadow-tinted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
                        <Icon name="cottage" size={22} />
                      </span>
                      <div>
                        <p className="font-serif text-body-lg font-medium text-on-surface group-hover:text-primary">
                          {s.village}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">{s.name}</p>
                      </div>
                      {s.verified && (
                        <Icon name="verified" size={18} className="ml-auto text-secondary" filled />
                      )}
                    </div>
                    {s.tagline && (
                      <p className="line-clamp-2 text-body-md text-on-surface-variant">{s.tagline}</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 text-label-md font-semibold text-secondary">
                      Visit storefront <Icon name="arrow_forward" size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* Producers grid */}
          {facet === "PRODUCERS" && (
            producerHits.length === 0 ? (
              <EmptyState icon="person_off" title="No producers match" message="Try clearing your search." />
            ) : (
              <div className="grid gap-token-md sm:grid-cols-2 xl:grid-cols-3">
                {producerHits.map((s) => (
                  <Link
                    key={s.id}
                    to={`/seller/${s.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-surface-highest bg-surface-lowest p-token-md transition-all hover:border-primary hover:shadow-tinted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-fixed text-primary-tint">
                        <Icon name="storefront" size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-body-lg font-medium text-on-surface group-hover:text-primary">
                          {s.name}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {s.village} · {SELLER_TYPE_LABEL[s.type]}
                        </p>
                      </div>
                      {s.verified && (
                        <Icon name="verified" size={18} className="ml-auto shrink-0 text-secondary" filled />
                      )}
                    </div>
                    {s.tagline && (
                      <p className="line-clamp-2 text-body-md text-on-surface-variant">{s.tagline}</p>
                    )}
                    {s.traceabilityScore != null && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                          <div
                            className="h-full rounded-full bg-secondary"
                            style={{ width: `${s.traceabilityScore}%` }}
                          />
                        </div>
                        <span className="text-label-sm text-secondary">{s.traceabilityScore}% traceable</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* Subtle relevance badge overlaid on the product card */
function RelevanceBadge({ score, matchedFields }: { score: number; matchedFields: string[] }) {
  // Score expected range: ~0.5 (weak) → ~8+ (strong)
  const pct = Math.min(100, Math.round((score / 8) * 100));
  if (pct < 25 || matchedFields.length === 0) return null;

  const label = pct >= 75 ? "Top match" : pct >= 50 ? "Good match" : "Match";
  const bg =
    pct >= 75
      ? "bg-secondary text-secondary-on"
      : "bg-surface-high text-on-surface-variant";

  return (
    <span
      className={`pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${bg}`}
    >
      <Icon name="auto_awesome" size={10} />
      {label}
    </span>
  );
}
