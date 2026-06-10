import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "recruiter";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  isStaff: boolean;
  loading: boolean;
  rolesLoading: boolean;
  roleError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function isPrimeItEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith("@primeit.pt"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Subscribe to auth state and hydrate the initial session.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[auth] getSession error", error.message);
      console.info("[auth] initial session", { hasSession: !!data.session, userId: data.session?.user?.id });
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info("[auth] state change", { event, hasSession: !!nextSession, userId: nextSession?.user?.id });
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load roles whenever the user changes. RLS policy "Users see own roles"
  // permits this select; the handle_new_user trigger guarantees every
  // confirmed user has at least a 'recruiter' row.
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setRoleError(null);
      setRolesLoading(false);
      return;
    }
    let cancelled = false;
    setRolesLoading(true);
    setRoleError(null);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[auth] user_roles fetch failed", error);
          setRoleError(error.message);
          setRoles([]);
        } else {
          const fetched = (data ?? []).map((r) => r.role as Role);
          console.info("[auth] roles loaded", { userId: user.id, roles: fetched });
          setRoles(fetched);
        }
        setRolesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message);
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          display_name: displayName || cleanEmail.split("@")[0],
        },
      },
    });
    if (error) throw new Error(error.message);
    // If the project requires email confirmation, no session is returned yet.
    if (!data.session) {
      throw new Error("Check your inbox to confirm the account before signing in.");
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  const isStaff = roles.length > 0;

  return (
    <AuthContext.Provider value={{ user, session, roles, isStaff, loading, rolesLoading, roleError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
