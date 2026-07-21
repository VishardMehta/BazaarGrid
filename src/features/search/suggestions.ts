// Curated flavor terms shown while typing — cheap, synchronous, no network
// round-trip per keystroke. Real matches still come from useSearch()'s live
// Supabase-backed engine; this is just autocomplete flavor.
const POOL: string[] = [
  "Organic Honey", "Cold-Pressed Oil", "Heritage Ghee", "Handmade Pottery",
  "Woven Linen", "Small Batch", "Single Origin Coffee", "Traceable Products",
  "Village Crafts", "Artisan Goods", "Gift Sets", "Grass-Fed Dairy",
];

export function getSuggestions(query: string, limit = 7): string[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return Array.from(
    new Set(POOL.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)),
  ).slice(0, limit);
}

export const POPULAR_SEARCHES = [
  "Forest Honey", "Cold-Pressed Oil", "Handmade Pottery",
  "Heritage Ghee", "Organic", "Small Batch", "Arabica Coffee",
];

const RECENT_KEY = "bg_recent_searches";

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function addRecentSearch(q: string) {
  const next = [q, ...getRecentSearches().filter((r) => r !== q)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}
