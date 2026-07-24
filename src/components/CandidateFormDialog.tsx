import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessUnit, Candidate, SENIORITY_LABELS } from "@/lib/jobs";
import { LocationCombobox } from "@/components/LocationCombobox";
import { useSaveCandidate } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  business_unit_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bus: BusinessUnit[];
  candidate?: Candidate | null;
  onSaved?: () => void;
}

export function CandidateFormDialog({ open, onOpenChange, bus, candidate, onSaved }: Props) {
  const { user } = useAuth();
  const saveCandidateMut = useSaveCandidate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_unit_id: "",
    recruiter: "",
    full_name: "",
    headline: "",
    seniority: "senior" as Candidate["seniority"],
    tech_stack: "",
    location: "",
    availability: "",
    notes: "",
    keywork_url: "",
  });

  useEffect(() => {
    if (!open) return;
    if (candidate) {
      setForm({
        business_unit_id: candidate.business_unit_id,
        recruiter: candidate.recruiter ?? "",
        full_name: candidate.full_name,
        headline: candidate.headline ?? "",
        seniority: candidate.seniority,
        tech_stack: candidate.tech_stack.join(", "),
        location: candidate.location ?? "",
        availability: candidate.availability ?? "",
        notes: candidate.notes ?? "",
        keywork_url: candidate.keywork_url ?? "",
      });
    } else {
      setForm({
        business_unit_id: bus[0]?.id ?? "",
        recruiter: "",
        full_name: "",
        headline: "",
        seniority: "senior",
        tech_stack: "",
        location: "",
        availability: "Immediate",
        notes: "",
        keywork_url: "",
      });
    }
  }, [candidate, open]);

  useEffect(() => {
    if (!open || candidate) return;
    if (!form.business_unit_id && bus.length > 0) {
      setForm((f) => ({ ...f, business_unit_id: bus[0].id }));
    }
  }, [bus, open, candidate, form.business_unit_id]);

  async function save() {
    if (!form.business_unit_id) return toast.error("Please select a Business Unit");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const payload = {
      business_unit_id: form.business_unit_id,
      recruiter: form.recruiter.trim() || null,
      full_name: form.full_name.trim(),
      headline: form.headline.trim() || null,
      seniority: form.seniority,
      tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
      location: form.location.trim() || null,
      availability: form.availability.trim() || null,
      notes: form.notes.trim() || null,
      keywork_url: form.keywork_url.trim() || null,
    };
    try {
      await saveCandidateMut.mutateAsync({
        input: { ...payload, job_id: candidate?.job_id ?? null, created_by: user?.id ?? null },
        id: candidate?.id,
      });
      toast.success(candidate ? "Candidate updated" : "Candidate added");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save candidate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{candidate ? "Edit candidate" : "Add Top Candidate"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 overflow-y-auto px-1 -mx-1 flex-1 min-h-0">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business Unit</Label>
            <Select value={form.business_unit_id || undefined} onValueChange={(v) => setForm({ ...form, business_unit_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select a business unit" /></SelectTrigger>
              <SelectContent className="z-[100]">{bus.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Recruiter</Label>
            <Input value={form.recruiter} maxLength={120} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} placeholder="e.g. Ana Silva" />
          </div>
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.full_name} maxLength={120} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Seniority</Label>
            <Select value={form.seniority} onValueChange={(v: any) => setForm({ ...form, seniority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">{Object.entries(SENIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Headline</Label>
            <Input value={form.headline} maxLength={200} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Backend Engineer · 8y exp" />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <LocationCombobox value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>Availability</Label>
            <Input value={form.availability} maxLength={80} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Immediate / 30 days" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tech stack (comma separated)</Label>
            <Input value={form.tech_stack} maxLength={500} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Link to Keywork (CRM)</Label>
            <Input value={form.keywork_url} maxLength={500} onChange={(e) => setForm({ ...form, keywork_url: e.target.value })} placeholder="https://keywork.primeit.pt/..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}