import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      phone,
      avatar_url,
    }: {
      id:          string;
      name?:       string;
      phone?:      string;
      avatar_url?: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ name, phone, avatar_url, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
