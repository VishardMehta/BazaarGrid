/**
 * BazaarGrid in-browser search engine.
 *
 * Algorithm: field-weighted TF scoring + synonym/intent expansion + fuzzy matching
 * + quality priors (rating, organic, traceable).
 *
 * SWAP POINT for Navya's Python embedding service:
 *   Replace searchProducts() with:
 *     const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
 *     return (await res.json()) as SearchHit[];
 *   — no call-site changes needed anywhere in the app.
 */

import type { Product, Seller } from "@/shared/types";

/* ── Synonym / intent expansion table ─────────────────────────────────────── */
const SYNONYMS: Record<string, string[]> = {
  ghee:      ["butter", "dairy", "cultured", "clarified", "grassfed", "fat"],
  honey:     ["wildflower", "bee", "hive", "forest", "nectar", "sweet"],
  oil:       ["olive", "coldpressed", "pressed", "cooking", "extravirgin"],
  pottery:   ["ceramic", "stoneware", "clay", "fired", "handthrown"],
  bowl:      ["serving", "vessel", "cup", "dish"],
  vase:      ["flower", "vessel", "decor", "bud"],
  textile:   ["linen", "woven", "fabric", "napkin", "runner"],
  linen:     ["fabric", "cloth", "woven", "natural"],
  coffee:    ["arabica", "beans", "brew", "cafe"],
  grain:     ["seed", "cereal", "bean"],
  milk:      ["dairy", "cream", "pitcher"],
  // Intent / lifestyle queries
  gift:      ["handmade", "artisan", "set", "small", "batch"],
  breakfast: ["honey", "ghee", "coffee", "morning"],
  kitchen:   ["oil", "honey", "pottery", "bowl", "pitcher", "cooking"],
  table:     ["linen", "runner", "bowl", "setting"],
  wellness:  ["organic", "raw", "natural", "pure"],
  rustic:    ["handmade", "stoneware", "village", "wabi"],
  artisan:   ["handmade", "handcrafted", "small", "craft"],
  heritage:  ["traditional", "village", "ancestral", "small"],
  organic:   ["natural", "unprocessed", "raw", "clean"],
  natural:   ["organic", "raw", "unprocessed", "pure"],
  handmade:  ["artisan", "craft", "handcrafted", "woven"],
};

/* ── Field weights (higher = more important in ranking) ───────────────────── */
const W = {
  name:        4.0,
  tags:        2.5,
  category:    2.0,
  village:     1.5,
  description: 1.2,
  sellerName:  1.0,
  story:       0.6,
} as const;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function expandQuery(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) {
    (SYNONYMS[t] ?? []).forEach((s) => out.add(s));
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (syns.includes(t)) out.add(key);
    }
  }
  return [...out];
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] =
        a[i - 1] === b[j - 1]
          ? d[i - 1][j - 1]
          : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
  return d[m][n];
}

function fieldScore(queryTokens: string[], fieldTokens: string[]): number {
  if (!queryTokens.length || !fieldTokens.length) return 0;
  let matched = 0;
  for (const qt of queryTokens) {
    if (fieldTokens.includes(qt)) { matched += 1; continue; }
    if (qt.length >= 3 && fieldTokens.some((ft) => ft.startsWith(qt))) { matched += 0.7; continue; }
    if (qt.length >= 5 && fieldTokens.some((ft) => levenshtein(qt, ft) === 1)) matched += 0.4;
  }
  return matched / queryTokens.length;
}

/* ── Public types and API ─────────────────────────────────────────────────── */

export interface SearchHit {
  product: Product;
  score: number;
  matchedFields: string[];
}

export function scoreProduct(
  product: Product,
  seller: Seller | undefined,
  rawTokens: string[],
  expandedTokens: string[],
): SearchHit {
  if (!rawTokens.length) return { product, score: 1, matchedFields: [] };

  const fields: { key: keyof typeof W; text: string }[] = [
    { key: "name",        text: product.name },
    { key: "tags",        text: (product.tags ?? []).join(" ") },
    { key: "category",    text: product.category },
    { key: "description", text: product.description ?? "" },
    { key: "story",       text: product.story ?? "" },
    { key: "village",     text: seller?.village ?? "" },
    { key: "sellerName",  text: seller?.name ?? "" },
  ];

  const matchedFields: string[] = [];
  let score = 0;

  for (const { key, text } of fields) {
    const s = fieldScore(expandedTokens, tokenize(text));
    if (s > 0) {
      score += s * W[key];
      matchedFields.push(key);
    }
  }

  // Exact phrase bonus
  if (product.name.toLowerCase().includes(rawTokens.join(" "))) score += 2.5;

  // Quality priors (tiebreakers, not dominant)
  score += (product.rating ?? 0) * 0.08;
  if (product.organic) score += 0.15;
  if (product.traceable) score += 0.1;

  return { product, score, matchedFields };
}

export function searchProducts(
  query: string,
  allProducts: Product[],
  sellerIndex: Map<string, Seller>,
): SearchHit[] {
  const raw = tokenize(query);
  const expanded = expandQuery(raw);

  return allProducts
    .map((p) => scoreProduct(p, sellerIndex.get(p.sellerId), raw, expanded))
    .filter((h) => !query.trim() || h.score > 0)
    .sort((a, b) => b.score - a.score);
}
