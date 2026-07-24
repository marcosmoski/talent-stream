import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BusinessUnit, Candidate, Job, PRIORITY_LABELS, SENIORITY_LABELS, STATUS_LABELS, WORK_MODEL_LABELS, daysOpenLabel } from "@/lib/jobs";
import {
  useBusinessUnits,
  useCandidates,
  useDeleteCandidate,
  useDeleteJob,
  useJobs,
  useSetJobStatus,
} from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobFormDialog } from "@/components/JobFormDialog";
import { CandidateFormDialog } from "@/components/CandidateFormDialog";
import { InviteUserDialog } from "@/components/InviteUserDialog";
import { PrimeLogo } from "@/components/PrimeLogo";
import { useInvitations, useRevokeInvitation } from "@/hooks/queries";
import { Plus, Pencil, X, LogOut, Loader2, ExternalLink, Search, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Admin() {
  const { user, loading, isStaff, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: allJobs = [] } = useJobs();
  const { data: allCands = [] } = useCandidates();
  const setStatusMut = useSetJobStatus();
  const deleteJobMut = useDeleteJob();
  const deleteCandMut = useDeleteCandidate();
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [jobOpen, setJobOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [candOpen, setCandOpen] = useState(false);
  const [editCand, setEditCand] = useState<Candidate | null>(null);
  const [notesView, setNotesView] = useState<{ title: string; subtitle?: string; notes: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: invitations = [] } = useInvitations({ enabled: isAdmin });
  const revokeInvite = useRevokeInvitation();

  useEffect(() => { document.title = "Admin · PrimeIT"; }, []);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) nav("/auth", { replace: true });
  }, [user, isStaff, loading, nav]);

  const bus = useMemo<BusinessUnit[]>(
    () => [...businessUnits].sort((a, b) => a.sort_order - b.sort_order),
    [businessUnits],
  );
  const jobs = useMemo<Job[]>(
    () => [...allJobs].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allJobs],
  );
  const cands = useMemo<Candidate[]>(
    () => [...allCands].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allCands],
  );

  function changeStatus(j: Job, status: Job["status"]) {
    setStatusMut.mutate(
      { id: j.id, status },
      {
        onSuccess: () => toast.success(`Marked as ${STATUS_LABELS[status]}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function deleteJob(j: Job) {
    if (!confirm(`Delete "${j.role_name}"?`)) return;
    deleteJobMut.mutate(j.id, {
      onSuccess: () => toast.success("Deleted"),
      onError: (err) => toast.error(err.message),
    });
  }

  function deleteCand(c: Candidate) {
    if (!confirm(`Remove "${c.full_name}"?`)) return;
    deleteCandMut.mutate(c.id, {
      onSuccess: () => toast.success("Removed"),
      onError: (err) => toast.error(err.message),
    });
  }

  if (loading || !user || !isStaff) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const buMap = new Map(bus.map((b) => [b.id, b]));
  const filteredJobs = jobs.filter((j) =>
    (filter === "all" || j.business_unit_id === filter) &&
    (statusFilter === "all" || j.status === statusFilter)
  );
  const filteredCands = cands.filter((c) => filter === "all" || c.business_unit_id === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-6">
          <PrimeLogo />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">Recruitment Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => nav("/board")}>Live board</Button>
          <Button variant="outline" size="sm" onClick={() => nav("/reports")}>Reports</Button>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); nav("/auth"); }}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recruitment Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage opportunities and top candidates across all business units.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Business Units" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {bus.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="jobs">
          <TabsList>
            <TabsTrigger value="jobs">Opportunities <Badge variant="secondary" className="ml-2">{jobs.length}</Badge></TabsTrigger>
            <TabsTrigger value="cands">Top Candidates <Badge variant="secondary" className="ml-2">{cands.length}</Badge></TabsTrigger>
            {isAdmin && <TabsTrigger value="team">Team <Badge variant="secondary" className="ml-2">{invitations.length}</Badge></TabsTrigger>}
          </TabsList>

          <TabsContent value="jobs" className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="closed_primeit">Closed · PrimeIT hired</SelectItem>
                  <SelectItem value="closed_client">Closed · by client</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setEditJob(null); setJobOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-1.5 h-4 w-4" /> New opportunity
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">BU</th>
                    <th className="px-4 py-3 text-left">Sen.</th>
                    <th className="px-4 py-3 text-left">Stack</th>
                    <th className="px-4 py-3 text-left">Loc.</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-semibold">
                        {j.role_name}
                        {j.status === "open" && <span className="ml-2 inline-block rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">{PRIORITY_LABELS[j.priority ?? "p2"]}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{j.client_company}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{buMap.get(j.business_unit_id)?.name}</td>
                      <td className="px-4 py-3 text-xs">{SENIORITY_LABELS[j.seniority]}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{j.tech_stack.slice(0,3).join(", ")}</td>
                      <td className="px-4 py-3 text-xs">{j.location}</td>
                      <td className="px-4 py-3 text-xs">{WORK_MODEL_LABELS[j.working_model]}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{daysOpenLabel(j.opened_at ?? j.created_at)}</td>
                      <td className="px-4 py-3">
                        <Select value={j.status} onValueChange={(v: any) => changeStatus(j, v)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="on_hold">On hold</SelectItem>
                            <SelectItem value="closed_primeit">Closed · PrimeIT hired</SelectItem>
                            <SelectItem value="closed_client">Closed · by client</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {j.keywork_url && (
                          <Button size="icon" variant="ghost" asChild title="Open in Keywork">
                            <a href={j.keywork_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        {(j.notes || j.project_context) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="View notes"
                            onClick={() =>
                              setNotesView({
                                title: j.role_name,
                                subtitle: `${j.client_company} · ${buMap.get(j.business_unit_id)?.name ?? ""}`,
                                notes: [
                                  j.project_context ? `Project context:\n${j.project_context}` : "",
                                  j.notes ? `Notes:\n${j.notes}` : "",
                                ].filter(Boolean).join("\n\n"),
                              })
                            }
                          >
                            <Search className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => { setEditJob(j); setJobOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteJob(j)}><X className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">No opportunities yet. Click "New opportunity" to add one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="cands" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => { setEditCand(null); setCandOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-1.5 h-4 w-4" /> Add Top Candidate
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCands.map((c) => (
                <div key={c.id} className="group relative rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                    {c.keywork_url && (
                      <Button size="icon" variant="ghost" asChild title="Open in Keywork">
                        <a href={c.keywork_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                      </Button>
                    )}
                    {c.notes && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="View notes"
                        onClick={() =>
                          setNotesView({
                            title: c.full_name,
                            subtitle: c.headline ?? buMap.get(c.business_unit_id)?.name,
                            notes: c.notes ?? "",
                          })
                        }
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => { setEditCand(c); setCandOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCand(c)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  <Badge className="mb-2 bg-accent/15 text-accent hover:bg-accent/15">★ Top</Badge>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{buMap.get(c.business_unit_id)?.name}</div>
                  <h3 className="mt-1 text-lg font-bold">{c.full_name}</h3>
                  {c.headline && <p className="text-sm text-muted-foreground">{c.headline}</p>}
                  {c.recruiter && <p className="mt-1 text-xs text-muted-foreground">Recruiter · <span className="font-medium text-foreground">{c.recruiter}</span></p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tech_stack.slice(0, 5).map((t) => <span key={t} className="rounded bg-secondary px-2 py-0.5 text-[11px]">{t}</span>)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{SENIORITY_LABELS[c.seniority]}</span>
                    {c.location && <span>· {c.location}</span>}
                    {c.availability && <span>· {c.availability}</span>}
                  </div>
                </div>
              ))}
              {filteredCands.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  No top candidates yet.
                </div>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team" className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Invite colleagues and choose their access level. Invites go to <span className="font-medium text-foreground">@primeit.pt</span> emails.
                </p>
                <Button onClick={() => setInviteOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Invite member
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Invited</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{inv.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={inv.role === "admin" ? "default" : "secondary"} className="capitalize">{inv.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={
                            inv.status === "accepted" ? "text-green-600" :
                            inv.status === "revoked" ? "text-muted-foreground line-through" :
                            "text-amber-600"
                          }>
                            {inv.status === "pending" ? "Pending" : inv.status === "accepted" ? "Accepted" : "Revoked"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inv.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={revokeInvite.isPending}
                              onClick={() => {
                                if (!confirm(`Revoke the invite for ${inv.email}?`)) return;
                                revokeInvite.mutate(inv.id, {
                                  onSuccess: () => toast.success("Invite revoked"),
                                  onError: (err) => toast.error(err.message),
                                });
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {invitations.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No invitations yet. Click "Invite member" to add someone.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <JobFormDialog open={jobOpen} onOpenChange={setJobOpen} bus={bus} job={editJob} />
      <CandidateFormDialog open={candOpen} onOpenChange={setCandOpen} bus={bus} candidate={editCand} />
      {isAdmin && <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />}

      <Dialog open={!!notesView} onOpenChange={(o) => !o && setNotesView(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{notesView?.title}</DialogTitle>
            {notesView?.subtitle && (
              <p className="text-xs text-muted-foreground">{notesView.subtitle}</p>
            )}
          </DialogHeader>
          <div className="overflow-y-auto whitespace-pre-wrap text-sm text-foreground">
            {notesView?.notes || "No notes."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}