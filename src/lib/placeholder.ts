/**
 * On-brand image placeholders. Rather than depend on flaky external photo
 * URLs, products/sellers without a real image render a deterministic earthy
 * gradient keyed off an id, plus a category icon. Swap in real photos later
 * by populating `images` in the mock/API data.
 */
import type { ProductCategory } from "@/shared/types";

const PALETTES: [string, string][] = [
  ["#bd5444", "#7c5800"], // terracotta → turmeric
  ["#48654e", "#9d3d2e"], // green → terracotta
  ["#7c5800", "#48654e"], // turmeric → green
  ["#9d3d2e", "#56423e"], // terracotta → brown
  ["#48654e", "#1b1c1a"], // green → near-black
  ["#a03f30", "#bd5444"], // tint → container
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic earthy gradient (CSS value) for a given seed. */
export function gradientFor(seed: string): string {
  const [a, b] = PALETTES[hash(seed) % PALETTES.length];
  const angle = 120 + (hash(seed + "x") % 90);
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}

const CATEGORY_ICON: Record<ProductCategory, string> = {
  GROCERY: "shopping_basket",
  HONEY: "hive",
  OILS: "water_drop",
  GRAINS: "grain",
  TEXTILES: "checkroom",
  POTTERY: "potted_plant",
  CRAFTS: "back_hand",
  DAIRY: "egg",
  SPICES: "local_fire_department",
  OTHER: "inventory_2",
};

export function categoryIcon(category: ProductCategory): string {
  return CATEGORY_ICON[category] ?? "inventory_2";
}
