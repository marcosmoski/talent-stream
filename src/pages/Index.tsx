import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BusinessUnit, Candidate, Job, PRIORITY_ORDER } from "@/lib/jobs";
import { useBusinessUnits, useCandidates, useJobs } from "@/hooks/queries";
import { JobCard } from "@/components/JobCard";
import { PrimeLogo } from "@/components/PrimeLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Inbox, LayoutDashboard, Search, Tv, Pause, BarChart3, Star, MapPin } from "lucide-react";
import { familyFor } from "@/lib/roleFamilies";

function jobFamily(job: Job) {
  return familyFor([job.role_name, ...(job.tech_stack ?? [])].join(" "));
}
function candidateFamily(c: Candidate) {
  return familyFor([c.full_name, c.headline ?? "", ...(c.tech_stack ?? [])].join(" "));
}

export default function Index() {
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: allJobs = [] } = useJobs();
  const { data: allCandidates = [] } = useCandidates();
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [tvMode, setTvMode] = useState(false);

  useEffect(() => {
    document.title = "PrimeIT Portugal · Open Roles Overview";
    const md = document.querySelector('meta[name="description"]') ?? document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    md.setAttribute("content", "PrimeIT Portugal — overview of urgent open roles across all business units.");
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Toggle TV mode with the "T" key (handy when casting to a screen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && !(e.target instanceof HTMLInputElement)) {
        setTvMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bus = useMemo<BusinessUnit[]>(
    () => [...businessUnits].sort((a, b) => a.sort_order - b.sort_order),
    [businessUnits],
  );

  const jobs = useMemo<Job[]>(
    () =>
      allJobs
        .filter((job) => job.status === "open")
        .sort((a, b) => {
          const pa = PRIORITY_ORDER[a.priority ?? "p2"];
          const pb = PRIORITY_ORDER[b.priority ?? "p2"];
          if (pa !== pb) return pa - pb;
          return (b.opened_at ?? b.created_at).localeCompare(a.opened_at ?? a.created_at);
        }),
    [allJobs],
  );

  const tops = useMemo<Candidate[]>(
    () => [...allCandidates].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [allCandidates],
  );

  const buMap = new Map(bus.map((b) => [b.id, b]));

  // Filter by search query (role, client, stack, BU name)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      const buName = buMap.get(j.business_unit_id)?.name ?? "";
      return (
        j.role_name.toLowerCase().includes(q) ||
        j.client_company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        buName.toLowerCase().includes(q) ||
        j.tech_stack.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [jobs, query, buMap]);

  // Group by role family
  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: Job[]; candidates: Candidate[] }>();
    for (const job of filtered) {
      const fam = jobFamily(job);
      if (!map.has(fam.key)) map.set(fam.key, { ...fam, items: [], candidates: [] });
      map.get(fam.key)!.items.push(job);
    }
    // Attach candidates to the matching family bucket (only families that already have jobs).
    for (const cand of tops) {
      const fam = candidateFamily(cand);
      const bucket = map.get(fam.key);
      if (bucket) bucket.candidates.push(cand);
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [filtered, tops]);

  // Candidates that didn't match any visible role family → shown in a fallback section.
  const orphanCandidates = useMemo(() => {
    const visibleFamilyKeys = new Set(grouped.map((g) => g.key));
    return tops.filter((c) => !visibleFamilyKeys.has(candidateFamily(c).key));
  }, [tops, grouped]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <PrimeLogo />
        <div className="flex items-center gap-4 text-sm">
          <Button size="sm" variant={tvMode ? "default" : "outline"} onClick={() => setTvMode((v) => !v)}>
            {tvMode ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Tv className="mr-1.5 h-3.5 w-3.5" />}
            {tvMode ? "Stop rotation" : "TV mode"}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/reports"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Reports</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Dashboard</Link>
          </Button>
          <div className="text-right hidden sm:block">
            <div className="font-mono text-base font-semibold tabular-nums">{now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "short" })}</div>
          </div>
        </div>
      </header>

      {/* Compact toolbar (headline removed for more space) */}
      <section className="flex flex-col gap-3 px-4 pt-3 pb-3 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {filtered.length} open role{filtered.length === 1 ? "" : "s"} · grouped by role &amp; stack
        </p>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search role, stack, client, BU…"
            className="pl-9"
          />
        </div>
      </section>

      {filtered.length > 0 ? (
        tvMode ? (
          <section className="relative px-4 pb-4 md:px-6">
            <div
              className="relative h-[calc(100vh-160px)] overflow-hidden"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 32px), transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 32px), transparent 100%)",
              }}
            >
              <div
                className="animate-scroll-y space-y-8"
                style={{ ["--scroll-duration" as any]: `${Math.max(45, filtered.length * 6 + tops.length * 4)}s` }}
              >
                {[0, 1].map((dup) => (
                  <div key={dup} className="space-y-6">
                    {grouped.map(({ key, label, items, candidates }) => (
                      <div key={`${dup}-${key}`}>
                        <div className="mb-3 flex items-baseline gap-3">
                          <h2 className="text-xl font-bold uppercase tracking-wider text-primary md:text-2xl">
                            <span className="border-b-2 border-accent pb-1">{label}</span>
                          </h2>
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground">
                            {items.length} role{items.length === 1 ? "" : "s"}
                            {candidates.length > 0 && <> · {candidates.length} candidate{candidates.length === 1 ? "" : "s"}</>}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(360px,auto)]">
                          {items.map((j) => (
                            <JobCard key={`${dup}-${j.id}`} job={j} bu={buMap.get(j.business_unit_id)} tvMode />
                          ))}
                        </div>
                        {candidates.length > 0 && (
                          <FamilyCandidateStrip candidates={candidates} bus={bus} keyPrefix={`${dup}-${key}`} />
                        )}
                      </div>
                    ))}
                    {orphanCandidates.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-baseline gap-3">
                          <h2 className="text-xl font-bold uppercase tracking-wider md:text-2xl text-accent">★ Other Top Candidates</h2>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <CompactCandidateGrid candidates={orphanCandidates} bus={bus} keyPrefix={`${dup}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6 px-4 pb-8 md:px-6">
            {grouped.map(({ key, label, items, candidates }) => (
              <div key={key}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-primary md:text-2xl">
                    <span className="border-b-2 border-accent pb-1">{label}</span>
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {items.length} role{items.length === 1 ? "" : "s"}
                    {candidates.length > 0 && <> · {candidates.length} candidate{candidates.length === 1 ? "" : "s"}</>}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(360px,auto)]">
                  {items.map((j) => (
                    <JobCard key={j.id} job={j} bu={buMap.get(j.business_unit_id)} tvMode={tvMode} />
                  ))}
                </div>
                {candidates.length > 0 && (
                  <FamilyCandidateStrip candidates={candidates} bus={bus} keyPrefix={key} />
                )}
              </div>
            ))}

            {orphanCandidates.length > 0 && (
              <div>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="text-xl font-bold uppercase tracking-wider md:text-2xl text-accent">★ Other Top Candidates</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <CompactCandidateGrid candidates={orphanCandidates} bus={bus} />
              </div>
            )}
          </section>
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-8 py-20 text-center">
      <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-2xl font-bold">No urgent openings right now</h2>
      <p className="mt-2 text-muted-foreground">Recruiters can add new opportunities from the admin dashboard.</p>
    </div>
  );
}

function CompactCandidateGrid({ candidates, bus, keyPrefix = "" }: { candidates: Candidate[]; bus: BusinessUnit[]; keyPrefix?: string }) {
  // Group by business unit, keep BU sort order
  const byBu = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!byBu.has(c.business_unit_id)) byBu.set(c.business_unit_id, []);
    byBu.get(c.business_unit_id)!.push(c);
  }
  const groups = bus
    .filter((b) => byBu.has(b.id))
    .map((b) => ({ bu: b, items: byBu.get(b.id)! }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map(({ bu, items }) => (
        <div key={`${keyPrefix}-${bu.id}`} className="rounded-lg border border-border/60 bg-card/60 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{bu.name}</div>
          <ul className="space-y-2.5">
            {items.slice(0, 5).map((c) => (
              <li key={`${keyPrefix}-${c.id}`} className="flex items-start gap-2 text-base leading-snug">
                <Star className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 whitespace-nowrap">
                    <span className="truncate text-lg font-bold text-foreground">{c.full_name}</span>
                    {c.location && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />{c.location}
                      </span>
                    )}
                  </div>
                  {c.tech_stack.length > 0 && (
                    <div className="truncate text-sm text-muted-foreground">{c.tech_stack.slice(0, 3).join(" · ")}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Compact horizontal strip of candidates shown directly under a role-family group.
function FamilyCandidateStrip({ candidates, bus, keyPrefix = "" }: { candidates: Candidate[]; bus: BusinessUnit[]; keyPrefix?: string }) {
  const buMap = new Map(bus.map((b) => [b.id, b]));
  return (
    <div className="mt-4 rounded-lg border border-accent/30 bg-accent/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        <Star className="h-4 w-4" /> Top candidates for this stack
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {candidates.map((c) => {
          const bu = buMap.get(c.business_unit_id);
          return (
            <li key={`${keyPrefix}-${c.id}`} className="flex items-start gap-2 text-base leading-snug">
              <Star className="mt-1 h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                {/* Line 1: name */}
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="truncate text-lg font-bold text-foreground">{c.full_name}</span>
                  {c.location && <span className="shrink-0 truncate text-xs text-muted-foreground">📍 {c.location}</span>}
                </div>
                {/* Line 2: top 3 techs */}
                {c.tech_stack.length > 0 && (
                  <div className="truncate text-sm text-muted-foreground">{c.tech_stack.slice(0, 3).join(" · ")}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
