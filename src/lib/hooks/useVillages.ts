import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbVillage, type DbCampaign } from "@/lib/supabase";

export function useVillages() {
  return useQuery({
    queryKey: ["villages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("villages").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as DbVillage[];
    },
  });
}

export function useVillage(id: string | undefined) {
  return useQuery({
    queryKey: ["village", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("villages").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as DbVillage;
    },
    enabled: !!id,
  });
}

export function useAddVillage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Omit<DbVillage, "id" | "created_at">) => {
      const { data, error } = await supabase.from("villages").insert(v).select().single();
      if (error) throw error;
      return data as DbVillage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["villages"] }),
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function useCampaigns(villageId?: string) {
  return useQuery({
    queryKey: ["campaigns", villageId],
    queryFn: async () => {
      let q = supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (villageId) q = q.eq("village_id", villageId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DbCampaign[];
    },
  });
}

export function useAddCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<DbCampaign, "id" | "created_at" | "reach">) => {
      const { data, error } = await supabase.from("campaigns").insert(c).select().single();
      if (error) throw error;
      return data as DbCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DbCampaign["status"] }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}
