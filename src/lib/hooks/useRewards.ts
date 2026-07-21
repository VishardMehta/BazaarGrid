import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type DbRewardTransaction } from "@/lib/supabase";

export function useRewardTransactions(profileId: string | null) {
  return useQuery({
    queryKey: ["rewards", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbRewardTransaction[];
    },
    enabled: !!profileId,
  });
}

export function useRewardBalance(profileId: string | null) {
  return useQuery({
    queryKey: ["rewards", "balance", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_balances")
        .select("balance")
        .eq("profile_id", profileId!)
        .single();
      if (error) return 0;
      return (data?.balance ?? 0) as number;
    },
    enabled: !!profileId,
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profileId,
      points,
      description,
    }: {
      profileId: string;
      points:    number;
      description: string;
    }) => {
      const { error } = await supabase.from("reward_transactions").insert({
        profile_id:  profileId,
        type:        "REDEEM",
        points,
        description,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["rewards", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["rewards", "balance", vars.profileId] });
    },
  });
}

export function useEarnReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profileId,
      points,
      description,
      orderId,
    }: {
      profileId:   string;
      points:      number;
      description: string;
      orderId?:    string;
    }) => {
      const { error } = await supabase.from("reward_transactions").insert({
        profile_id:  profileId,
        type:        "EARN",
        points,
        description,
        order_id:    orderId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["rewards", vars.profileId] });
      qc.invalidateQueries({ queryKey: ["rewards", "balance", vars.profileId] });
    },
  });
}
