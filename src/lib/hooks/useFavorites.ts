import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbProduct } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";

// Product ids the current user has favorited
export function useFavoriteIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("profile_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.product_id as string));
    },
  });
}

// Full product rows for the favorites page
export function useFavoriteProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites", "products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product:products(*)")
        .eq("profile_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.product as unknown as DbProduct).filter(Boolean);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ productId, on }: { productId: string; on: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (on) {
        const { error } = await supabase
          .from("favorites")
          .insert({ profile_id: user.id, product_id: productId });
        if (error && error.code !== "23505") throw error; // ignore duplicate
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("profile_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
