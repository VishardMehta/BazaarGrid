import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbPaymentMethod } from "@/lib/supabase";

export function usePaymentMethods(profileId: string | null) {
  return useQuery({
    queryKey: ["payment_methods", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("profile_id", profileId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbPaymentMethod[];
    },
    enabled: !!profileId,
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pm: Omit<DbPaymentMethod, "id" | "created_at">) => {
      const { data, error } = await supabase.from("payment_methods").insert(pm).select().single();
      if (error) throw error;
      return data as DbPaymentMethod;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["payment_methods", vars.profile_id] }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
      return profileId;
    },
    onSuccess: (profileId) => qc.invalidateQueries({ queryKey: ["payment_methods", profileId] }),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      await supabase.from("payment_methods").update({ is_default: false }).eq("profile_id", profileId);
      const { error } = await supabase.from("payment_methods").update({ is_default: true }).eq("id", id);
      if (error) throw error;
      return profileId;
    },
    onSuccess: (profileId) => qc.invalidateQueries({ queryKey: ["payment_methods", profileId] }),
  });
}
