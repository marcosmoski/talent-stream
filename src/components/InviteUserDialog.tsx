import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInviteUser, type InviteRole } from "@/hooks/queries";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  role: z.enum(["admin", "recruiter"]),
});

const ROLE_HINT: Record<InviteRole, string> = {
  recruiter: "Can manage opportunities and candidates.",
  admin: "Full access, including inviting other people.",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("recruiter");
  const invite = useInviteUser();

  function reset() {
    setEmail("");
    setRole("recruiter");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, role });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@primeit.pt")) {
      toast.error("Only @primeit.pt emails can be invited");
      return;
    }
    invite.mutate({ email: cleanEmail, role }, {
      onSuccess: (data) => {
        if (data?.warning) toast.warning(data.warning);
        else toast.success(`Invitation sent to ${cleanEmail}`);
        reset();
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They'll get an email to set a password and join with the role you pick.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@primeit.pt"
              maxLength={255}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v: InviteRole) => setRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_HINT[role]}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={invite.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {invite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
