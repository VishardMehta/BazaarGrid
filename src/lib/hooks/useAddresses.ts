import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbAddress } from "@/lib/supabase";

export function useAddresses(profileId: string | null) {
  return useQuery({
    queryKey: ["addresses", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("profile_id", profileId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbAddress[];
    },
    enabled: !!profileId,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: Omit<DbAddress, "id" | "created_at">) => {
      const { data, error } = await supabase.from("addresses").insert(addr).select().single();
      if (error) throw error;
      return data as DbAddress;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["addresses", vars.profile_id] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      return profileId;
    },
    onSuccess: (profileId) => qc.invalidateQueries({ queryKey: ["addresses", profileId] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      // Clear existing default
      await supabase.from("addresses").update({ is_default: false }).eq("profile_id", profileId);
      // Set new default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
      return profileId;
    },
    onSuccess: (profileId) => qc.invalidateQueries({ queryKey: ["addresses", profileId] }),
  });
}
