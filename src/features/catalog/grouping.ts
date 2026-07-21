import type { Product } from "@/shared/types";

/**
 * A shop/search entry. Products that are OFFERS on a shared catalogue SKU
 * (same `catalogItemId`, sold by several stores) collapse into ONE entry —
 * represented by the cheapest offer — so the buyer sees "Tata Salt · from ₹22 ·
 * 3 stores" instead of three near-identical cards. Unique products (no
 * catalogItemId) always stand alone.
 */
export interface CatalogEntry {
  product: Product; // representative offer (cheapest) for a grouped SKU
  offerCount: number; // how many stores sell it (1 for unique products)
}

/**
 * Same collapse as {@link groupByCatalog}, but preserves the wrapper object
 * (e.g. search hits with score/matchedFields) — used by the search results
 * grid so "search Tata Salt" shows one card ("from ₹22 · 3 stores"), not three.
 */
export function groupHits<T extends { product: Product }>(hits: T[]): (T & { offerCount: number })[] {
  const out: (T & { offerCount: number })[] = [];
  const indexBySku = new Map<string, number>();

  for (const h of hits) {
    const sku = h.product.catalogItemId;
    if (!sku) {
      out.push({ ...h, offerCount: 1 });
      continue;
    }
    const at = indexBySku.get(sku);
    if (at === undefined) {
      indexBySku.set(sku, out.length);
      out.push({ ...h, offerCount: 1 });
    } else {
      const nextCount = out[at].offerCount + 1;
      out[at] = h.product.price < out[at].product.price ? { ...h, offerCount: nextCount } : { ...out[at], offerCount: nextCount };
    }
  }
  return out;
}

export function groupByCatalog(products: Product[]): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const indexBySku = new Map<string, number>();

  for (const p of products) {
    if (!p.catalogItemId) {
      entries.push({ product: p, offerCount: 1 });
      continue;
    }
    const at = indexBySku.get(p.catalogItemId);
    if (at === undefined) {
      indexBySku.set(p.catalogItemId, entries.length);
      entries.push({ product: p, offerCount: 1 });
    } else {
      const entry = entries[at];
      entry.offerCount += 1;
      if (p.price < entry.product.price) entry.product = p; // keep the cheapest as representative
    }
  }
  return entries;
}
