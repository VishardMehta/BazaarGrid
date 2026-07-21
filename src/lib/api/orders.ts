/**
 * API client for Sameer's backend (Task 3 + Task 5).
 *
 * All requests go through Vite's /api proxy → http://localhost:3000
 *
 * ADAPTER STRATEGY
 * ─────────────────
 * Backend uses { qty, unitPrice, title }; frontend uses { quantity, price, name }.
 * Backend status values align with frontend now (FULFILLED/COMPLETED).
 * This file converts between the two shapes so the rest of the UI stays unchanged.
 */

import type {
  Order,
  OrderItem,
  BackendOrderType,
  BackendSellerType,
  FulfillmentMethod,
} from "@/shared/types";
import type { CartLine } from "@/features/cart/CartContext";
import type { Seller } from "@/shared/types";

const BASE = "/api";

/* ------------------------------------------------------------------ *
 * Backend wire shapes (what the server actually expects / returns)
 * ------------------------------------------------------------------ */

interface BackendItem {
  productId: string;
  batchId: string;
  title: string;
  qty: number;
  unitPrice: number;
}

interface BackendOrder {
  id: string;
  orderType: BackendOrderType;
  buyerId: string;
  sellerType: BackendSellerType;
  fulfillingSellerId: string;
  items: BackendItem[];
  channel: "APP" | "WHATSAPP";
  fulfillmentMode: "DELIVERY" | "PICKUP";
  status: string;
  total: number;
  hasQualityIssue: boolean;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: string; at: string }[];
}

interface CreateOrderPayload {
  orderType: BackendOrderType;
  buyerId: string;
  sellerType: BackendSellerType;
  fulfillingSellerId: string;
  items: BackendItem[];
  channel: "APP" | "WHATSAPP";
  fulfillmentMode: "DELIVERY" | "PICKUP";
}

interface CreateWhatsappPayload {
  buyerId: string;
  sellerType: BackendSellerType;
  fulfillingSellerId: string;
  phone: string;
  fulfillmentMode: "DELIVERY" | "PICKUP";
  items: BackendItem[];
}

/* ------------------------------------------------------------------ *
 * Adapters
 * ------------------------------------------------------------------ */

function sellerTypeToBackend(type: Seller["type"]): BackendSellerType {
  return type === "VILLAGE_PRODUCER" ? "PRODUCER" : "LOCAL_STORE";
}

function cartLinesToBackendItems(lines: CartLine[]): BackendItem[] {
  return lines.map((l) => ({
    productId: l.product.id,
    batchId: l.product.batchId ?? `batch-${l.product.id}`,
    title: l.product.name,
    qty: l.quantity,
    unitPrice: l.product.price,
  }));
}

function backendOrderToFrontend(b: BackendOrder, sellerLines?: CartLine[]): Order {
  const items: OrderItem[] = b.items.map((i) => {
    const cartLine = sellerLines?.find((l) => l.product.id === i.productId);
    return {
      productId: i.productId,
      sellerId: b.fulfillingSellerId,
      name: i.title || i.productId,
      unit: cartLine?.product.unit ?? "",
      quantity: i.qty,
      price: i.unitPrice,
      traceable: cartLine?.product.traceable ?? false,
      batchId: i.batchId,
    };
  });

  return {
    id: b.id,
    buyerId: b.buyerId,
    channel: b.channel,
    status: b.status as Order["status"],
    items,
    subtotal: b.total,
    total: b.total,
    fulfillment: b.fulfillmentMode as FulfillmentMethod,
    placedAt: b.createdAt,
    fulfillingSellerId: b.fulfillingSellerId,
    orderType: b.orderType,
    sellerType: b.sellerType,
    hasQualityIssue: b.hasQualityIssue,
    updatedAt: b.updatedAt,
    statusHistory: b.statusHistory as Order["statusHistory"],
  };
}

/* ------------------------------------------------------------------ *
 * API helpers
 * ------------------------------------------------------------------ */

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`);
  }
  const json = await res.json() as { data: T };
  return json.data;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as { data: T };
  return json.data;
}

/* ------------------------------------------------------------------ *
 * Public API — called by CartPage, MyOrdersPage, etc.
 * ------------------------------------------------------------------ */

/**
 * Place one order per seller group in the cart.
 * Returns all created orders (one per unique seller).
 */
export async function placeOrdersFromCart(
  lines: CartLine[],
  sellers: Map<string, Seller>,
  buyerId: string,
  fulfillmentMode: FulfillmentMethod,
): Promise<Order[]> {
  // Group lines by sellerId
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    const existing = groups.get(line.product.sellerId) ?? [];
    groups.set(line.product.sellerId, [...existing, line]);
  }

  const results: Order[] = [];
  for (const [sellerId, sellerLines] of groups) {
    const seller = sellers.get(sellerId);
    const payload: CreateOrderPayload = {
      orderType: "CUSTOMER_ORDER",
      buyerId,
      sellerType: seller ? sellerTypeToBackend(seller.type) : "PRODUCER",
      fulfillingSellerId: sellerId,
      items: cartLinesToBackendItems(sellerLines),
      channel: "APP",
      fulfillmentMode,
    };
    const backendOrder = await post<BackendOrder>("/orders", payload);
    results.push(backendOrderToFrontend(backendOrder, sellerLines));
  }
  return results;
}

/**
 * Place a WhatsApp order for a single seller and return the wa.me URL.
 * Used when user taps "Order on WhatsApp" in CartPage.
 */
export async function placeWhatsappOrder(
  lines: CartLine[],
  seller: Seller,
  buyerId: string,
  fulfillmentMode: FulfillmentMethod,
): Promise<{ order: Order; whatsappUrl: string }> {
  const payload: CreateWhatsappPayload = {
    buyerId,
    sellerType: sellerTypeToBackend(seller.type),
    fulfillingSellerId: seller.id,
    phone: seller.phone,
    fulfillmentMode,
    items: cartLinesToBackendItems(lines),
  };
  const raw = await post<{ order: BackendOrder; whatsappUrl: string }>("/orders/whatsapp", payload);
  return {
    order: backendOrderToFrontend(raw.order, lines),
    whatsappUrl: raw.whatsappUrl,
  };
}

/**
 * Fetch all orders for a given buyer from the backend.
 * Falls back to an empty array if the backend is unreachable (dev mode).
 */
export async function fetchOrdersByBuyer(buyerId: string): Promise<Order[]> {
  const backendOrders = await get<BackendOrder[]>(`/orders?buyerId=${encodeURIComponent(buyerId)}`);
  return backendOrders.map((b) => backendOrderToFrontend(b));
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const b = await post<BackendOrder>(`/orders/${orderId}/cancel`, {});
  return backendOrderToFrontend(b);
}
