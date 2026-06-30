/**
 * BazaarGrid — shared domain types (SINGLE SOURCE OF TRUTH).
 *
 * Import Seller / Product / Order / Buyer from here. NEVER redefine them locally.
 * Branch on `seller.type` and `order.channel` where behaviour differs.
 *
 *   import type { Seller, Product, Order } from "@/shared/types";
 */

/* ------------------------------------------------------------------ *
 * Seller — the umbrella. A seller is a village producer OR a kirana.
 * ------------------------------------------------------------------ */

export type SellerType = "VILLAGE_PRODUCER" | "KIRANA_STORE";

export interface Certification {
  id: string;
  label: string; // e.g. "Organic Certified", "QR-Traceable", "Verified Producer"
  icon?: string; // Material Symbols name
}

export interface Seller {
  id: string;
  type: SellerType;
  /** Display name — producer name or kirana store name. */
  name: string;
  /** Short tagline / craft, e.g. "Heritage olive oil & honey". */
  tagline?: string;
  /** Village or town the seller belongs to. */
  village: string;
  region?: string;
  /** Long-form heritage / store story (markdown-ish plain text). */
  story?: string;
  phone: string; // E.164-ish, used for wa.me links
  email?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified: boolean;
  /** 0–100 traceability/transparency score shown on profile & badges. */
  traceabilityScore?: number;
  rating?: number; // 0–5
  reviewCount?: number;
  /** ISO date the seller joined. */
  memberSince?: string;
  certifications?: Certification[];
  /** Up to ~4 brand accent colors a village can customise its storefront with. */
  brandAccents?: string[];
  productCount?: number;
}

/* ------------------------------------------------------------------ *
 * Product
 * ------------------------------------------------------------------ */

export type ProductStatus = "LIVE" | "DRAFT" | "PENDING_APPROVAL";

export type ProductCategory =
  | "GROCERY"
  | "HONEY"
  | "OILS"
  | "GRAINS"
  | "TEXTILES"
  | "POTTERY"
  | "CRAFTS"
  | "DAIRY"
  | "SPICES"
  | "OTHER";

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: ProductCategory;
  /** Price in the smallest sensible major unit (e.g. rupees/dollars), not cents. */
  price: number;
  currency?: string; // default handled in UI, e.g. "USD"
  /** Unit the price is per, e.g. "500g", "1L", "each". */
  unit: string;
  status: ProductStatus;
  /** Available stock count; undefined = not tracked. */
  stock?: number;
  images: string[];
  description?: string;
  /** Heritage / purity narrative shown on the product detail page. */
  story?: string;
  tags?: string[]; // "Organic", "Local", "Small Batch"...
  organic?: boolean;
  /** Whether this product has a QR traceability passport. */
  traceable?: boolean;
  batchId?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
}

/* ------------------------------------------------------------------ *
 * Traceability — the "Product Passport" powering QR badges.
 * ------------------------------------------------------------------ */

export interface TraceabilityStep {
  label: string; // Harvested, Processed, Packed, Shipped...
  date: string; // ISO
  description?: string;
  done: boolean;
}

export interface TraceabilityPassport {
  productId: string;
  batchId: string;
  verifiedAuthentic: boolean;
  timeline: TraceabilityStep[];
  specs?: Record<string, string>; // weight, altitude, expiration...
  reportUrl?: string;
}

/* ------------------------------------------------------------------ *
 * Order — ONE model, two channels (APP / WHATSAPP).
 * ------------------------------------------------------------------ */

export type OrderChannel = "APP" | "WHATSAPP";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type FulfillmentMethod = "DELIVERY" | "VILLAGE_PICKUP";

export type PaymentMethod = "CARD" | "DIGITAL_WALLET" | "COD";

export interface OrderItem {
  productId: string;
  sellerId: string;
  name: string;
  imageUrl?: string;
  unit: string;
  quantity: number;
  /** Unit price at time of order. */
  price: number;
  traceable?: boolean;
}

export interface Address {
  id?: string;
  label?: string; // "Home", "Work"
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  buyerId: string;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  /** Loyalty/producer-rewards discount applied. */
  rewardsDiscount?: number;
  total: number;
  fulfillment: FulfillmentMethod;
  address?: Address;
  payment?: PaymentMethod;
  placedAt: string; // ISO
  /** Primary seller for single-village orders (convenience). */
  primarySellerId?: string;
}

/* ------------------------------------------------------------------ *
 * Buyer
 * ------------------------------------------------------------------ */

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  memberSince?: string;
  tier?: LoyaltyTier;
  /** Harvest-rewards token balance. */
  rewardsBalance?: number;
  /** 0–100 personal traceability score. */
  traceabilityScore?: number;
  addresses?: Address[];
}

/* ------------------------------------------------------------------ *
 * Search / discovery (Task 4)
 * ------------------------------------------------------------------ */

export type ProductFacet = "PRODUCTS" | "VILLAGES" | "PRODUCERS";

export type SortOption =
  | "RELEVANCE"
  | "POPULARITY"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "NEWEST"
  | "RATING";

export interface SearchFilters {
  query?: string;
  categories?: ProductCategory[];
  villages?: string[];
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  organicOnly?: boolean;
  sort?: SortOption;
}

export interface SearchResult {
  products: Product[];
  total: number;
  facetCounts: Record<ProductFacet, number>;
}

/* ------------------------------------------------------------------ *
 * Rewards (cross-cutting loyalty)
 * ------------------------------------------------------------------ */

export interface Reward {
  id: string;
  title: string;
  description: string;
  costTokens: number;
  imageUrl?: string;
  featured?: boolean;
}
