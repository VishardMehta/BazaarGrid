import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbProduct } from "@/lib/supabase";
import type { ProductCategory } from "@/shared/types";

// ── Queries ───────────────────────────────────────────────────────────────────

export function useProducts(filters?: { category?: string; sellerId?: string; status?: string }) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (filters?.category && filters.category !== "ALL") q = q.eq("category", filters.category);
      if (filters?.sellerId) q = q.eq("seller_id", filters.sellerId);
      if (filters?.status)   q = q.eq("status", filters.status);
      else q = q.eq("status", "LIVE");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DbProduct[];
    },
  });
}

export function useAllSellerProducts(sellerId: string | null) {
  return useQuery({
    queryKey: ["products", "seller", sellerId, "all"],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbProduct[];
    },
    enabled: !!sellerId,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

interface AddProductInput {
  seller_id:   string;
  name:        string;
  description: string;
  price:       number;
  unit:        string;
  category:    ProductCategory;
  stock:       number;
  organic:     boolean;
  traceable:   boolean;
  status:      "LIVE" | "DRAFT" | "PENDING_APPROVAL";
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddProductInput) => {
      const { data, error } = await supabase.from("products").insert(input).select().single();
      if (error) throw error;
      return data as DbProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbProduct> & { id: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
