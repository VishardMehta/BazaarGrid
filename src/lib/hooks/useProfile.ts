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
      state,
      district,
    }: {
      id:          string;
      name?:       string;
      phone?:      string;
      avatar_url?: string;
      state?:      string;
      district?:   string;
    }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name       !== undefined) patch.name       = name;
      if (phone      !== undefined) patch.phone      = phone;
      if (avatar_url !== undefined) patch.avatar_url = avatar_url;
      if (state      !== undefined) patch.state      = state;
      if (district   !== undefined) patch.district   = district;
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
