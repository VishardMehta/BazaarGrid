import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbOrder, type DbOrderItem } from "@/lib/supabase";
import type { OrderStatus } from "@/shared/types";

interface OrderWithItems extends DbOrder {
  order_items: DbOrderItem[];
}

// ── Buyer's own orders ────────────────────────────────────────────────────────

export function useMyOrders(buyerId: string | null) {
  return useQuery({
    queryKey: ["orders", "buyer", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("buyer_id", buyerId!)
        .order("placed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
    enabled: !!buyerId,
  });
}

// ── Seller's incoming orders ──────────────────────────────────────────────────

export function useSellerOrders(sellerId: string | null) {
  return useQuery({
    queryKey: ["orders", "seller", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("seller_id", sellerId!)
        .order("placed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
    enabled: !!sellerId,
  });
}

// ── All orders (operator) ─────────────────────────────────────────────────────

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("placed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
  });
}

// ── Place order (buyer checkout) ──────────────────────────────────────────────

interface PlaceOrderInput {
  buyer_id:         string;
  seller_id:        string;
  total:            number;
  subtotal:         number;
  delivery_fee:     number;
  rewards_discount: number;
  channel:          "APP" | "WHATSAPP";
  fulfillment:      "DELIVERY" | "PICKUP";
  delivery_address: Record<string, unknown> | null;
  items: {
    product_id:  string;
    seller_id:   string;
    name:        string;
    unit:        string | null;
    quantity:    number;
    price:       number;
    subtotal:    number;
    traceable:   boolean;
    batch_id:    string | null;
  }[];
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      const orderId = `BG-${Date.now().toString(36).toUpperCase()}`;
      const { items, ...orderData } = input;

      // Insert order
      const { error: orderErr } = await supabase
        .from("orders")
        .insert({ id: orderId, ...orderData });
      if (orderErr) throw orderErr;

      // Insert items
      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((it) => ({ ...it, order_id: orderId }))
      );
      if (itemsErr) throw itemsErr;

      return orderId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stock may change
    },
  });
}

// ── Advance order status ──────────────────────────────────────────────────────

export function useAdvanceOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
