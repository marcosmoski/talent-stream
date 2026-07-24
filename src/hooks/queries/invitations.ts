import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./keys";

export type InviteRole = "admin" | "recruiter";
export type InviteStatus = "pending" | "accepted" | "revoked";

export interface Invitation {
  id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
}

export function useInvitations(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.invitations,
    enabled: opts?.enabled ?? true,
    queryFn: async (): Promise<Invitation[]> => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Invitation[];
    },
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: InviteRole }) => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim().toLowerCase(), role },
      });
      // On a non-2xx response supabase-js sets `error` and puts the body on
      // `error.context` (a Response); pull the server's message out of it.
      if (error) {
        let message = error.message;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const parsed = await ctx.json();
            if (parsed?.error) message = parsed.error;
          } catch {
            /* body wasn't JSON — keep the default message */
          }
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error as string);
      return data as { ok: boolean; warning?: string; action_link?: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.invitations }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.invitations }),
  });
}
