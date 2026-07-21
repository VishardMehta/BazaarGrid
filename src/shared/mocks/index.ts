/**
 * Typed access to mock data. Import from here, not the raw JSON, so the
 * casts to our domain types live in ONE place. Swap these for real API
 * calls later without touching feature code.
 *
 *   import { sellers, products, getSellerById } from "@/shared/mocks";
 */
import type {
  Buyer,
  Order,
  Product,
  Reward,
  Seller,
  TraceabilityPassport,
} from "@/shared/types";

import sellersJson from "./sellers.json";
import productsJson from "./products.json";
import ordersJson from "./orders.json";
import buyersJson from "./buyers.json";
import rewardsJson from "./rewards.json";
import passportsJson from "./passports.json";

export const sellers = sellersJson as Seller[];
export const products = productsJson as Product[];
export const orders = ordersJson as Order[];
export const buyers = buyersJson as Buyer[];
export const rewards = rewardsJson as Reward[];
export const passports = passportsJson as unknown as TraceabilityPassport[];

/* ---- tiny query helpers (mock "API") ---- */

export const getSellerById = (id: string): Seller | undefined =>
  sellers.find((s) => s.id === id);

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getProductsBySeller = (sellerId: string): Product[] =>
  products.filter((p) => p.sellerId === sellerId);

export const getLiveProducts = (): Product[] =>
  products.filter((p) => p.status === "LIVE");

export const getOrdersByBuyer = (buyerId: string): Order[] =>
  orders.filter((o) => o.buyerId === buyerId);

export const getBuyerById = (id: string): Buyer | undefined =>
  buyers.find((b) => b.id === id);

export const getPassport = (productId: string): TraceabilityPassport | undefined =>
  passports.find((p) => p.productId === productId);

/** The "current" signed-in buyer for demo purposes. */
export const currentBuyer = buyers[0];
