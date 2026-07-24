import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BusinessUnit, Job } from "@/lib/jobs";
import { useBusinessUnits, useJobs } from "@/hooks/queries";
import { PrimeLogo } from "@/components/PrimeLogo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Tv, Loader2, ArrowLeft } from "lucide-react";
import { familyFor } from "@/lib/roleFamilies";

const MONTHS_BACK = 6;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function Reports() {
  const { user, loading, isStaff } = useAuth();
  const nav = useNavigate();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: jobs = [] } = useJobs();
  const [buFilter, setBuFilter] = useState<string>("all");

  useEffect(() => { document.title = "Reports · PrimeIT"; }, []);
  useEffect(() => { if (!loading && (!user || !isStaff)) nav("/auth", { replace: true }); }, [user, isStaff, loading, nav]);

  const bus = useMemo<BusinessUnit[]>(
    () => [...businessUnits].sort((a, b) => a.sort_order - b.sort_order),
    [businessUnits],
  );

  const buMap = useMemo(() => new Map(bus.map((b) => [b.id, b])), [bus]);

  const filteredJobs = useMemo(
    () => (buFilter === "all" ? jobs : jobs.filter((j) => j.business_unit_id === buFilter)),
    [jobs, buFilter]
  );

  // Build last N months
  const months = useMemo(() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(monthKey(d));
    }
    return out;
  }, []);

  // For each month: opened during, closed during
  type MonthRow = { key: string; label: string; openedTotal: number; closedTotal: number; perBu: Record<string, { opened: number; closed: number }> };
  const monthRows: MonthRow[] = useMemo(() => {
    return months.map((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const start = new Date(y, m - 1, 1).getTime();
      const end = new Date(y, m, 1).getTime();
      const perBu: Record<string, { opened: number; closed: number }> = {};
      let openedTotal = 0;
      let closedTotal = 0;
      for (const j of filteredJobs) {
        const openedAt = new Date(j.opened_at ?? j.created_at).getTime();
        const closedAt = j.closed_at ? new Date(j.closed_at).getTime() : null;
        const buId = j.business_unit_id;
        perBu[buId] ??= { opened: 0, closed: 0 };
        if (openedAt >= start && openedAt < end) { perBu[buId].opened++; openedTotal++; }
        if (closedAt && closedAt >= start && closedAt < end) { perBu[buId].closed++; closedTotal++; }
      }
      return { key: mk, label: monthLabel(mk), openedTotal, closedTotal, perBu };
    });
  }, [months, filteredJobs]);

  // Successfully closed (PrimeIT hired) jobs with time-to-close
  const wonJobs = useMemo(
    () =>
      filteredJobs
        .filter((j) => j.status === "closed_primeit" && j.closed_at)
        .map((j) => {
          const opened = new Date(j.opened_at ?? j.created_at).getTime();
          const closed = new Date(j.closed_at!).getTime();
          const days = Math.max(0, Math.round((closed - opened) / 86400000));
          return { job: j, days };
        })
        .sort((a, b) => (b.job.closed_at! > a.job.closed_at! ? 1 : -1)),
    [filteredJobs]
  );

  const lostJobs = useMemo(
    () => filteredJobs.filter((j) => j.status === "closed_client"),
    [filteredJobs]
  );

  const avgDays = wonJobs.length
    ? Math.round(wonJobs.reduce((s, x) => s + x.days, 0) / wonJobs.length)
    : 0;

  // Decided = PrimeIT-hired + client-closed (excludes still-open / on-hold)
  const decidedCount = wonJobs.length + lostJobs.length;
  const winRate = decidedCount ? Math.round((wonJobs.length / decidedCount) * 100) : 0;

  // Per-BU summary (lifetime within filter)
  const buSummary = useMemo(() => {
    return bus
      .filter((b) => buFilter === "all" || b.id === buFilter)
      .map((b) => {
        const buJobs = jobs.filter((j) => j.business_unit_id === b.id);
        const won = buJobs.filter((j) => j.status === "closed_primeit" && j.closed_at);
        const lost = buJobs.filter((j) => j.status === "closed_client");
        const open = buJobs.filter((j) => j.status === "open").length;
        const avg = won.length
          ? Math.round(
              won.reduce((s, j) => s + Math.round((new Date(j.closed_at!).getTime() - new Date(j.opened_at ?? j.created_at).getTime()) / 86400000), 0) / won.length
            )
          : null;
        const decided = won.length + lost.length;
        const rate = decided ? Math.round((won.length / decided) * 100) : null;
        return { bu: b, total: buJobs.length, open, won: won.length, lost: lost.length, avg, rate };
      });
  }, [bus, jobs, buFilter]);

  // Strengths / Gaps analysis — by Role family and by Technology
  type Bucket = { label: string; won: number; lost: number };
  function bucketize(getKeys: (j: Job) => string[]): Bucket[] {
    const map = new Map<string, Bucket>();
    for (const j of filteredJobs) {
      if (j.status !== "closed_primeit" && j.status !== "closed_client") continue;
      const won = j.status === "closed_primeit" ? 1 : 0;
      const lost = j.status === "closed_client" ? 1 : 0;
      for (const key of getKeys(j)) {
        if (!map.has(key)) map.set(key, { label: key, won: 0, lost: 0 });
        const b = map.get(key)!;
        b.won += won;
        b.lost += lost;
      }
    }
    return Array.from(map.values());
  }

  const familyBuckets = useMemo(
    () => bucketize((j) => [familyFor(j.role_name, j.tech_stack ?? []).label]),
    [filteredJobs]
  );
  const techBuckets = useMemo(
    () => bucketize((j) => (j.tech_stack ?? []).map((t) => t.trim()).filter(Boolean)),
    [filteredJobs]
  );

  function rank(buckets: Bucket[], best: boolean) {
    return [...buckets]
      .map((b) => ({ ...b, decided: b.won + b.lost, rate: (b.won + b.lost) ? b.won / (b.won + b.lost) : 0 }))
      .filter((b) => b.decided >= 1)
      .sort((a, b) => (best ? b.rate - a.rate || b.decided - a.decided : a.rate - b.rate || b.decided - a.decided))
      .slice(0, 6);
  }

  const strongFamilies = rank(familyBuckets, true);
  const weakFamilies = rank(familyBuckets, false);
  const strongTechs = rank(techBuckets, true);
  const weakTechs = rank(techBuckets, false);

  // Average opportunities OPENED per month (over the last N months window)
  const avgOpenedPerMonth = monthRows.length
    ? Math.round((monthRows.reduce((s, m) => s + m.openedTotal, 0) / monthRows.length) * 10) / 10
    : 0;

  // Most successful role family (by hire count, then hire rate as tiebreaker)
  const topRole = [...familyBuckets]
    .map((b) => ({ ...b, decided: b.won + b.lost, rate: (b.won + b.lost) ? b.won / (b.won + b.lost) : 0 }))
    .filter((b) => b.won > 0)
    .sort((a, b) => b.won - a.won || b.rate - a.rate)[0];

  if (loading || !user || !isStaff) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const visibleBus = buFilter === "all" ? bus : bus.filter((b) => b.id === buFilter);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-6">
          <PrimeLogo />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">Reports</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline"><Link to="/board"><Tv className="mr-1.5 h-3.5 w-3.5" /> Live board</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/admin"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Dashboard</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recruitment Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monthly activity by business unit and time-to-close performance.</p>
          </div>
          <Select value={buFilter} onValueChange={setBuFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Business Units" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Units</SelectItem>
              {bus.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards — single uniform grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi label="Total opportunities" value={filteredJobs.length} />
          <Kpi label="PrimeIT hired" value={wonJobs.length} suffix={decidedCount ? `${winRate}% win` : undefined} />
          <Kpi label="Closed by client" value={lostJobs.length} />
          <Kpi label="Avg. time to hire" value={avgDays} suffix="days" />
          <Kpi label="Currently open" value={filteredJobs.filter((j) => j.status === "open").length} />
          <Kpi label="On hold" value={filteredJobs.filter((j) => j.status === "on_hold").length} />
          <Kpi label={`Avg. opened / month`} value={avgOpenedPerMonth} suffix={`last ${MONTHS_BACK}m`} />
          <Kpi
            label="Most successful role"
            value={topRole ? topRole.label : "—"}
            suffix={topRole ? `${topRole.won} hire${topRole.won === 1 ? "" : "s"}` : undefined}
            compact
          />
        </div>

        {/* Strengths / Gaps */}
        <section className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StrengthsGapsCard
            title="Where we win"
            subtitle="Highest hire rate (PrimeIT closed vs lost to client)"
            tone="positive"
            families={strongFamilies}
            techs={strongTechs}
          />
          <StrengthsGapsCard
            title="Where we struggle"
            subtitle="Lowest hire rate — clients closed these themselves"
            tone="negative"
            families={weakFamilies}
            techs={weakTechs}
          />
        </section>

        {/* Closed roles list */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recently closed roles</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Business Unit</th>
                  <th className="px-4 py-3 text-left">Outcome</th>
                  <th className="px-4 py-3 text-left">Opened</th>
                  <th className="px-4 py-3 text-left">Closed</th>
                  <th className="px-4 py-3 text-right">Days to close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...wonJobs, ...lostJobs.map((j) => {
                  const opened = new Date(j.opened_at ?? j.created_at).getTime();
                  const closed = j.closed_at ? new Date(j.closed_at).getTime() : opened;
                  return { job: j, days: Math.max(0, Math.round((closed - opened) / 86400000)) };
                })]
                  .sort((a, b) => (b.job.closed_at ?? "").localeCompare(a.job.closed_at ?? ""))
                  .map(({ job, days }) => (
                  <tr key={job.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold">{job.role_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.client_company}</td>
                    <td className="px-4 py-3 text-xs">{buMap.get(job.business_unit_id)?.name}</td>
                    <td className="px-4 py-3 text-xs">
                      {job.status === "closed_primeit" ? (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">PrimeIT hired</span>
                      ) : (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">By client</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(job.opened_at ?? job.created_at).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-xs">{job.closed_at ? new Date(job.closed_at).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{days}</td>
                  </tr>
                ))}
                {wonJobs.length + lostJobs.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No closed roles in this filter yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, suffix, compact }: { label: string; value: number | string; suffix?: string; compact?: boolean }) {
  const isText = typeof value === "string";
  const valueClass = compact || isText ? "text-lg font-bold leading-tight" : "text-3xl font-bold";
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-auto flex items-baseline gap-2 pt-2">
        <div className={valueClass}>{value}</div>
        {suffix && <div className="text-xs font-semibold text-accent">{suffix}</div>}
      </div>
    </div>
  );
}

type RankItem = { label: string; won: number; lost: number; decided: number; rate: number };

function StrengthsGapsCard({
  title, subtitle, tone, families, techs,
}: { title: string; subtitle: string; tone: "positive" | "negative"; families: RankItem[]; techs: RankItem[] }) {
  const accent = tone === "positive" ? "text-accent" : "text-destructive";
  const bar = tone === "positive" ? "bg-accent" : "bg-destructive";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className={`text-base font-bold ${accent}`}>{title}</h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">hire rate · sample</span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>

      <div className="mb-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">By role family</div>
        <RankList items={families} barClass={bar} />
      </div>
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">By technology</div>
        <RankList items={techs} barClass={bar} />
      </div>
    </div>
  );
}

function RankList({ items, barClass }: { items: RankItem[]; barClass: string }) {
  if (items.length === 0) {
    return <div className="text-xs text-muted-foreground">Not enough closed roles yet.</div>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const pct = Math.round(it.rate * 100);
        return (
          <li key={it.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-semibold">{it.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <span className="font-bold text-foreground">{pct}%</span> · {it.won}/{it.decided}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}