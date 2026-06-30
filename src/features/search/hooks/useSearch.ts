import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { products as allProducts, sellers } from "@/shared/mocks";
import { searchProducts, type SearchHit } from "../engine";
import type { ProductCategory, SortOption, SellerType } from "@/shared/types";

export interface Filters {
  categories: ProductCategory[];
  villages: string[];
  minPrice: number;
  maxPrice: number;
  sellerType: SellerType | "ALL";
  verifiedOnly: boolean;
  organicOnly: boolean;
  traceableOnly: boolean;
  minRating: number;
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  villages: [],
  minPrice: 0,
  maxPrice: 100,
  sellerType: "ALL",
  verifiedOnly: false,
  organicOnly: false,
  traceableOnly: false,
  minRating: 0,
};

// Built once at module level — mock data never changes
const sellerIndex = new Map(sellers.map((s) => [s.id, s]));
const liveProducts = allProducts.filter((p) => p.status === "LIVE");

export function useSearch() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [sort, setSort] = useState<SortOption>("RELEVANCE");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  function setQuery(q: string) {
    setParams(q.trim() ? { q: q.trim() } : {}, { replace: true });
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSort("RELEVANCE");
  }

  const hits: SearchHit[] = useMemo(() => {
    let list = searchProducts(query, liveProducts, sellerIndex);

    if (filters.categories.length)
      list = list.filter((h) => filters.categories.includes(h.product.category));

    if (filters.villages.length)
      list = list.filter((h) =>
        filters.villages.includes(sellerIndex.get(h.product.sellerId)?.village ?? ""),
      );

    list = list.filter(
      (h) => h.product.price >= filters.minPrice && h.product.price <= filters.maxPrice,
    );

    if (filters.sellerType !== "ALL")
      list = list.filter(
        (h) => sellerIndex.get(h.product.sellerId)?.type === filters.sellerType,
      );

    if (filters.verifiedOnly)
      list = list.filter((h) => sellerIndex.get(h.product.sellerId)?.verified);

    if (filters.organicOnly)
      list = list.filter((h) => h.product.organic);

    if (filters.traceableOnly)
      list = list.filter((h) => h.product.traceable);

    if (filters.minRating > 0)
      list = list.filter((h) => (h.product.rating ?? 0) >= filters.minRating);

    switch (sort) {
      case "PRICE_ASC":
        return [...list].sort((a, b) => a.product.price - b.product.price);
      case "PRICE_DESC":
        return [...list].sort((a, b) => b.product.price - a.product.price);
      case "POPULARITY":
        return [...list].sort((a, b) => (b.product.reviewCount ?? 0) - (a.product.reviewCount ?? 0));
      case "NEWEST":
        return [...list].sort((a, b) =>
          (b.product.createdAt ?? "").localeCompare(a.product.createdAt ?? ""),
        );
      case "RATING":
        return [...list].sort((a, b) => (b.product.rating ?? 0) - (a.product.rating ?? 0));
      default:
        return list; // RELEVANCE: already sorted by score
    }
  }, [query, sort, filters]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.categories.length) n++;
    if (filters.villages.length) n++;
    if (filters.minPrice > DEFAULT_FILTERS.minPrice || filters.maxPrice < DEFAULT_FILTERS.maxPrice) n++;
    if (filters.sellerType !== "ALL") n++;
    if (filters.verifiedOnly) n++;
    if (filters.organicOnly) n++;
    if (filters.traceableOnly) n++;
    if (filters.minRating > 0) n++;
    return n;
  }, [filters]);

  return {
    query, setQuery,
    hits, sort, setSort,
    filters, updateFilter, resetFilters,
    activeFilterCount,
    sellerIndex,
  };
}
