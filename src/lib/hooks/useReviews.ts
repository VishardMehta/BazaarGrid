import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbProductReview } from "@/lib/supabase";

/** All reviews written by this buyer — used to mark order items as already rated */
export function useMyReviews(buyerId: string | null) {
  return useQuery({
    queryKey: ["reviews", "mine", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("buyer_id", buyerId!);
      if (error) throw error;
      return (data ?? []) as DbProductReview[];
    },
    enabled: !!buyerId,
  });
}

/** Recent reviews for a product — shown on the product detail page */
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as DbProductReview[];
    },
    enabled: !!productId,
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      product_id: string;
      order_id:   string;
      buyer_id:   string;
      rating:     number;
      review?:    string | null;
    }) => {
      const { error } = await supabase.from("product_reviews").insert({
        ...input,
        review: input.review?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["products"] });   // rating changed
      qc.invalidateQueries({ queryKey: ["product", vars.product_id] });
    },
  });
}
