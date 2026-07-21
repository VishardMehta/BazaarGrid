import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type DbProfile, type UserRole } from "@/lib/supabase";

interface AuthContextValue {
  session:     Session | null;
  user:        User    | null;
  profile:     DbProfile | null;
  loading:     boolean;
  /** Email + password sign-in */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Google OAuth sign-in */
  signInWithGoogle: () => Promise<{ error: string | null }>;
  /** Email + password sign-up — sends verification email automatically */
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signOut: () => Promise<void>;
  /** Update profile role (used in Onboarding); villageId links producers/admins to their village */
  updateRole: (role: UserRole, villageId?: string | null) => Promise<{ error: string | null }>;
  /** Refresh profile from DB */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      return;
    }

    // Profile row missing (trigger may have failed on signup) — auto-create as BUYER
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const name =
      authUser?.user_metadata?.name ??
      authUser?.user_metadata?.full_name ??
      (authUser?.email ? authUser.email.split("@")[0] : null);

    const { data: created } = await supabase
      .from("profiles")
      .upsert({ id: userId, role: "BUYER", status: "ACTIVE", name })
      .select()
      .single();

    setProfile(created ?? null);
  }, []);

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) await fetchProfile(s.user.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e: unknown) {
      return { error: (e instanceof Error ? e.message : null) ?? "Sign-in failed. Please try again." };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) return { error: error.message || "Google sign-in failed. Check Supabase → Auth → Providers → Google is enabled." };
      // Supabase auto-redirects, but manually redirect as fallback
      if (data?.url) window.location.href = data.url;
      return { error: null };
    } catch (e: unknown) {
      return { error: (e instanceof Error ? e.message : null) ?? "Google sign-in failed. Please try again." };
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        const raw = error.message ?? "";
        let msg = raw;
        if (!raw || raw === "{}" || raw.trim() === "") {
          msg = "Sign-up failed. This email may already be registered — try signing in instead.";
        } else if (raw.toLowerCase().includes("already registered") || raw.toLowerCase().includes("already exists")) {
          msg = "This email is already registered. Please sign in instead.";
        } else if (raw.toLowerCase().includes("rate limit") || raw.toLowerCase().includes("too many")) {
          msg = "Too many attempts. Please wait a minute and try again.";
        }
        return { error: msg, needsVerification: false };
      }
      // If session is null after signup, email confirmation is required
      const needsVerification = !data.session;
      return { error: null, needsVerification };
    } catch (e: unknown) {
      return {
        error: (e instanceof Error ? e.message : null) ?? "An unexpected error occurred. Please try again.",
        needsVerification: false,
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const updateRole = async (role: UserRole, villageId?: string | null) => {
    if (!session?.user) return { error: "Not authenticated" };
    const status = role === "BUYER" ? "ACTIVE" : "PENDING";
    const patch: Record<string, unknown> = { role, status, updated_at: new Date().toISOString() };
    if (villageId !== undefined) patch.village_id = villageId;
    let { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", session.user.id);
    if (error && villageId !== undefined && error.message?.includes("village_id")) {
      // fixes.sql not run yet — retry without the village column
      delete patch.village_id;
      ({ error } = await supabase.from("profiles").update(patch).eq("id", session.user.id));
    }
    if (!error) await fetchProfile(session.user.id);
    return { error: error?.message ?? null };
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        updateRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
