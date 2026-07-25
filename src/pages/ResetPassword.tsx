import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimeLogo } from "@/components/PrimeLogo";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "Min 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export default function ResetPassword() {
  const nav = useNavigate();
  const { user, session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Reset password · PrimeIT";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw new Error(error.message);
      toast.success("Password updated. You're all set!");
      nav("/admin", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not update your password");
    } finally {
      setBusy(false);
    }
  }

  const hasRecoverySession = !!(user || session);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><PrimeLogo size="lg" /></div>

        {loading ? (
          <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : hasRecoverySession ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.email ? <>Updating the password for <span className="font-medium text-foreground">{user.email}</span>.</> : "Choose a new password for your account."}
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} placeholder="••••••••" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={busy} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
                {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-elevated">
            <h1 className="text-2xl font-bold">Recovery link invalid or expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password recovery link is no longer valid. Request a new one from the sign-in page.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => nav("/auth")}>Back to sign in</Button>
          </div>
        )}
      </div>
    </div>
  );
}
