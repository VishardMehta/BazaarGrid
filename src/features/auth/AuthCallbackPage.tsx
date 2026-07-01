import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { redirectPathForRole } from "./redirectForRole";

/**
 * Handles the redirect back from Supabase OAuth (Google) and email verification links.
 * Supabase sets the session via the URL fragment/query params automatically.
 * We just wait for the session to be set, then redirect to the right place.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const params = new URL(window.location.href).searchParams;
      const code   = params.get("code");

      let session = null;

      if (code) {
        // PKCE flow: exchange the one-time code for a session
        const { data } = await supabase.auth.exchangeCodeForSession(window.location.href);
        session = data.session;
      }

      // Hash-based implicit flow (or PKCE already exchanged): session is in localStorage
      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", session.user.id)
        .single();

      if (!profile) { navigate("/onboarding", { replace: true }); return; }
      if (profile.status === "PENDING") { navigate("/pending-approval", { replace: true }); return; }

      // New user (signed up < 2 min ago) → let them pick their role
      const isNewUser = Date.now() - new Date(session.user.created_at).getTime() < 120_000;
      if (isNewUser && profile.role === "BUYER") {
        navigate("/onboarding", { replace: true });
        return;
      }

      navigate(redirectPathForRole(profile.role, profile.status), { replace: true });
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center gap-3 bg-surface-low">
      <span className="h-7 w-7 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      <span className="text-body-md text-on-surface-variant">Finishing sign-in…</span>
    </div>
  );
}
