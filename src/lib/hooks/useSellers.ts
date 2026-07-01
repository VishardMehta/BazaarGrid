import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbSeller } from "@/lib/supabase";

export function useSellers() {
  return useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("status", "ACTIVE")
        .order("rating", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbSeller[];
    },
  });
}

export function useAllSellers() {
  return useQuery({
    queryKey: ["sellers", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sellers").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as DbSeller[];
    },
  });
}

export function useSeller(id: string | undefined) {
  return useQuery({
    queryKey: ["seller", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DbSeller;
    },
    enabled: !!id,
  });
}

/** Get the seller record linked to the current profile */
export function useMySellerProfile(profileId: string | null) {
  return useQuery({
    queryKey: ["seller", "mine", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("profile_id", profileId!)
        .single();
      if (error) return null;
      return data as DbSeller;
    },
    enabled: !!profileId,
  });
}

export function useUpdateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbSeller> & { id: string }) => {
      const { error } = await supabase.from("sellers").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["seller", vars.id] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useAddSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seller: Partial<DbSeller> & { name: string }) => {
      const { data, error } = await supabase.from("sellers").insert(seller).select().single();
      if (error) throw error;
      return data as DbSeller;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sellers"] }),
  });
}
