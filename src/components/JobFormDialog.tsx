import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessUnit, Job, PRIORITY_LABELS, SENIORITY_LABELS, STATUS_LABELS, WORK_MODEL_LABELS } from "@/lib/jobs";
import { LocationCombobox } from "@/components/LocationCombobox";
import { useSaveJob } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  business_unit_id: z.string().uuid(),
  client_company: z.string().trim().min(1).max(120),
  role_name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  tech_stack: z.string().max(500),
  notes: z.string().max(1000).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bus: BusinessUnit[];
  job?: Job | null;
  onSaved?: () => void;
}

export function JobFormDialog({ open, onOpenChange, bus, job, onSaved }: Props) {
  const { user } = useAuth();
  const saveJobMut = useSaveJob();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_unit_id: "",
    client_company: "",
    role_name: "",
    seniority: "mid" as Job["seniority"],
    tech_stack: "",
    location: "",
    working_model: "hybrid" as Job["working_model"],
    status: "open" as Job["status"],
    is_urgent: true,
    priority: "p2" as Job["priority"],
    opened_at: "" as string,
    years_experience: "" as string,
    notes: "",
    project_context: "",
    keywork_url: "",
  });

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({
        business_unit_id: job.business_unit_id,
        client_company: job.client_company,
        role_name: job.role_name,
        seniority: job.seniority,
        tech_stack: job.tech_stack.join(", "),
        location: job.location,
        working_model: job.working_model,
        status: job.status,
        is_urgent: job.is_urgent,
        priority: job.priority ?? "p2",
        opened_at: (job.opened_at ?? job.created_at).slice(0, 10),
        years_experience: job.years_experience != null ? String(job.years_experience) : "",
        notes: job.notes ?? "",
        project_context: job.project_context ?? "",
        keywork_url: job.keywork_url ?? "",
      });
    } else {
      setForm({
        business_unit_id: bus[0]?.id ?? "",
        client_company: "",
        role_name: "",
        seniority: "mid",
        tech_stack: "",
        location: "Lisboa, PT",
        working_model: "hybrid",
        status: "open",
        is_urgent: true,
        priority: "p2",
        opened_at: new Date().toISOString().slice(0, 10),
        years_experience: "",
        notes: "",
        project_context: "",
        keywork_url: "",
      });
    }
  }, [job, open]);

  // If BUs load AFTER the dialog opens, auto-select the first one for new jobs
  useEffect(() => {
    if (!open || job) return;
    if (!form.business_unit_id && bus.length > 0) {
      setForm((f) => ({ ...f, business_unit_id: bus[0].id }));
    }
  }, [bus, open, job, form.business_unit_id]);

  async function save() {
    if (!form.business_unit_id) {
      toast.error("Please select a Business Unit");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message ?? "Please fill in all required fields");
      return;
    }
    setBusy(true);
    const openedIso = form.opened_at
      ? new Date(form.opened_at + "T00:00:00").toISOString()
      : new Date().toISOString();
    const payload = {
      business_unit_id: form.business_unit_id,
      client_company: form.client_company.trim(),
      role_name: form.role_name.trim(),
      seniority: form.seniority,
      tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
      location: form.location.trim(),
      working_model: form.working_model,
      status: form.status,
      is_urgent: form.priority === "asap" || form.priority === "p1",
      priority: form.priority,
      opened_at: openedIso,
      years_experience: form.years_experience.trim() === "" ? null : Math.max(0, Math.min(50, Number(form.years_experience))),
      notes: form.notes?.trim() || null,
      project_context: form.project_context?.trim() || null,
      keywork_url: form.keywork_url?.trim() || null,
      closed_at: (form.status === "closed_primeit" || form.status === "closed_client")
        ? (job?.closed_at ?? new Date().toISOString())
        : null,
    };
    try {
      await saveJobMut.mutateAsync({
        input: { ...payload, created_by: user?.id ?? null },
        id: job?.id,
      });
      toast.success(job ? "Job updated" : "Job created");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{job ? "Edit opportunity" : "New opportunity"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 overflow-y-auto px-1 -mx-1 flex-1 min-h-0">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business Unit</Label>
            <Select value={form.business_unit_id || undefined} onValueChange={(v) => setForm({ ...form, business_unit_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select a business unit" /></SelectTrigger>
              <SelectContent className="z-[100]">{bus.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Client Company</Label>
            <Input value={form.client_company} maxLength={120} onChange={(e) => setForm({ ...form, client_company: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input value={form.role_name} maxLength={120} onChange={(e) => setForm({ ...form, role_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Seniority</Label>
            <Select value={form.seniority} onValueChange={(v: any) => setForm({ ...form, seniority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">{Object.entries(SENIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <LocationCombobox value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>Working Model</Label>
            <Select value={form.working_model} onValueChange={(v: any) => setForm({ ...form, working_model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">{Object.entries(WORK_MODEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">{Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date opened</Label>
            <Input type="date" value={form.opened_at} onChange={(e) => setForm({ ...form, opened_at: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Years of experience</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
              placeholder="e.g. 5"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tech stack (comma separated)</Label>
            <Input value={form.tech_stack} maxLength={500} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, TypeScript, AWS" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Project context</Label>
            <Textarea
              value={form.project_context}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, project_context: e.target.value })}
              rows={3}
              placeholder="What is the project about? Domain, team, scope, mission…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Link to Keywork (CRM)</Label>
            <Input
              value={form.keywork_url}
              maxLength={500}
              onChange={(e) => setForm({ ...form, keywork_url: e.target.value })}
              placeholder="https://keywork.primeit.pt/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {busy ? "Saving…" : job ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}