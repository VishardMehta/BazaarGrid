import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbCatalogItem, type DbProduct } from "@/lib/supabase";

// ── Shared catalogue (commodity SKUs kirana stores list against) ──────────────

/** Search the shared catalogue by name/brand. Empty query = full list. */
export function useCatalogItems(search?: string) {
  const q = (search ?? "").trim();
  return useQuery({
    queryKey: ["catalog-items", q],
    queryFn: async () => {
      let query = supabase.from("catalog_items").select("*").order("name");
      if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as DbCatalogItem[];
    },
  });
}

export function useAddCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; brand?: string | null; category: string; unit?: string | null }) => {
      const { data, error } = await supabase.from("catalog_items").insert(input).select().single();
      if (error) throw error;
      return data as DbCatalogItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog-items"] }),
  });
}

// ── Multi-seller offers on one catalogue SKU (the buy-box) ────────────────────

export interface ProductOffer {
  product: DbProduct;
  seller: {
    id: string;
    name: string;
    village: string | null;
    region: string | null;
    rating: number;
    verified: boolean;
    district: string | null;
    state: string | null;
  } | null;
}

type OfferRow = DbProduct & {
  sellers: {
    id: string;
    name: string;
    village: string | null;
    region: string | null;
    rating: number;
    verified: boolean;
    villages: { district: string | null; state: string | null } | null;
  } | null;
};

/** Every LIVE store offer on a catalogue SKU, with seller + location, so the
 *  buyer can pick which store to buy the same product from. */
export function useProductOffers(catalogItemId: string | null | undefined) {
  return useQuery({
    queryKey: ["product-offers", catalogItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, sellers!inner(id, name, village, region, rating, verified, villages(district, state))")
        .eq("catalog_item_id", catalogItemId!)
        .eq("status", "LIVE");
      if (error) throw error;
      return ((data ?? []) as OfferRow[]).map((row): ProductOffer => {
        const { sellers, ...product } = row;
        return {
          product: product as DbProduct,
          seller: sellers
            ? {
                id: sellers.id,
                name: sellers.name,
                village: sellers.village,
                region: sellers.region,
                rating: sellers.rating,
                verified: sellers.verified,
                district: sellers.villages?.district ?? null,
                state: sellers.villages?.state ?? null,
              }
            : null,
        };
      });
    },
    enabled: !!catalogItemId,
  });
}
