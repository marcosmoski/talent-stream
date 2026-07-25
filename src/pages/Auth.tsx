import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimeLogo } from "@/components/PrimeLogo";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email")
  .max(255);

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72),
});

const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  displayName: z.string().trim().max(100).optional(),
});

type Mode = "login" | "signup" | "reset";

const TITLES: Record<Mode, string> = {
  login: "Sign In · PrimeIT",
  signup: "Create account · PrimeIT",
  reset: "Reset password · PrimeIT",
};

export default function Auth() {
  const nav = useNavigate();
  const { user, loading, rolesLoading, isStaff, roles, roleError, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = TITLES[mode];
  }, [mode]);

  // Redirect to /admin only after roles have loaded AND the user is staff,
  // so we don't bounce against ProtectedRoute during the roles-loading window.
  useEffect(() => {
    if (loading || rolesLoading) return;
    if (user && isStaff) nav("/admin", { replace: true });
  }, [user, isStaff, loading, rolesLoading, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Password recovery: send the email, no password field involved.
    if (mode === "reset") {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      setBusy(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(error.message);
        toast.success("If that email exists, a recovery link is on its way.");
        setMode("login");
      } catch (err: any) {
        toast.error(err.message ?? "Could not send the recovery email");
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsed = (mode === "login" ? loginSchema : signupSchema).safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Welcome back");
      } else {
        await signUp(email, password, displayName || email.split("@")[0]);
        toast.success("Account ready");
      }
      // No manual nav: the redirect effect above fires once roles load.
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const heading = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";
  const subtitle =
    mode === "login" ? "Access the recruitment dashboard." :
    mode === "signup" ? "Create a local dashboard account." :
    "Enter your email and we'll send you a link to set a new password.";
  const cta = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send recovery link";

  return (
    <div className="grid min-h-screen overflow-hidden bg-background lg:grid-cols-[42%_58%]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--accent)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--accent)/0.12)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="relative"><PrimeLogo size="lg" /></div>
        <div className="relative max-w-lg">
          <div className="mb-6 inline-flex rounded-full border border-accent/35 bg-accent/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-accent">Internal · Recruitment</div>
          <h1 className="text-balance text-6xl font-bold leading-[1.05] xl:text-7xl"><span className="text-accent">Spotlight</span> act fast on what matters!</h1>
          <p className="mt-8 max-w-sm text-lg text-primary-foreground/65">Office overview for open opportunities across PrimeIT teams.</p>
        </div>
        <div className="relative text-xs text-primary-foreground/55">© {new Date().getFullYear()} PrimeIT</div>
      </aside>

      <main className="flex flex-col justify-center rounded-l-[2rem] bg-background px-6 py-12 shadow-elevated sm:px-12 lg:-ml-8">
        <div className="mx-auto w-full max-w-lg">
          <h2 className="text-3xl font-bold">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ana Silva" maxLength={100} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} placeholder="you@primeit.pt" />
            </div>
            {mode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("reset")} className="text-xs font-medium text-accent hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} placeholder="••••••••" />
              </div>
            )}
            <Button type="submit" disabled={busy} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cta}
              {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "reset" ? (
              <button onClick={() => setMode("login")} className="font-semibold text-accent hover:underline">
                Back to sign in
              </button>
            ) : (
              <>
                {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-accent hover:underline">
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </>
            )}
          </p>

          {/* Diagnostic panel — shows current auth context so we can see why
              the redirect isn't firing. Remove once auth flow is verified. */}
          {(user || roleError) && (
            <div className="mt-8 rounded-lg border border-border bg-card/60 p-4 text-xs">
              <div className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground">Auth status</div>
              <div className="space-y-1 font-mono">
                <div>user: {user ? user.email : "—"}</div>
                <div>user.id: {user?.id ?? "—"}</div>
                <div>rolesLoading: {String(rolesLoading)}</div>
                <div>roles: {roles.length ? roles.join(", ") : "[]"}</div>
                <div>isStaff: {String(isStaff)}</div>
                {roleError && <div className="text-destructive">roleError: {roleError}</div>}
              </div>
              {user && !rolesLoading && !isStaff && (
                <div className="mt-3 space-y-2">
                  <p className="text-destructive">
                    You're signed in but have no role assigned. In Supabase Studio run:
                  </p>
                  <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px]">
INSERT INTO user_roles (user_id, role)
VALUES ('{user.id}', 'admin');
                  </pre>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
