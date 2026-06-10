import { Briefcase, MapPin, Wifi, Building2, Sparkles, Clock, GraduationCap, FileText } from "lucide-react";
import { Job, BusinessUnit, PRIORITY_LABELS, SENIORITY_LABELS, WORK_MODEL_LABELS, daysOpenLabel, ageSeverity } from "@/lib/jobs";

const workIcon = { remote: Wifi, hybrid: Building2, onsite: Building2 } as const;

interface Props {
  job: Job;
  bu?: BusinessUnit;
  variant?: "tv" | "admin";
  /** When true, disables the hover-flip behavior (used on the live TV). */
  tvMode?: boolean;
}

export function JobCard({ job, bu, variant = "tv", tvMode = false }: Props) {
  const WIcon = workIcon[job.working_model];
  const openedAt = job.opened_at ?? job.created_at;
  const severity = ageSeverity(openedAt);
  const ageClass =
    severity === "fresh"
      ? "bg-emerald-100 text-emerald-700"
      : severity === "warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  const priority = job.priority ?? "p2";
  const priorityClass =
    priority === "asap"
      ? "bg-red-600 text-white"
      : priority === "p1"
      ? "bg-orange-500 text-white"
      : priority === "p2"
      ? "bg-amber-400 text-amber-950"
      : "bg-slate-300 text-slate-800";
  // Soft neon glow color behind the card, matching priority
  const priorityGlow =
    priority === "asap"
      ? "rgba(239,68,68,0.55)"   // red-500
      : priority === "p1"
      ? "rgba(249,115,22,0.5)"   // orange-500
      : priority === "p2"
      ? "rgba(245,158,11,0.45)"  // amber-500
      : "rgba(148,163,184,0.35)"; // slate-400

  const hasContext = !!(job.project_context && job.project_context.trim());
  const flipEnabled = hasContext && !tvMode;

  return (
    <div className={"group relative h-full " + (flipEnabled ? "[perspective:1200px]" : "")}>
      {/* Soft neon halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-3xl blur-2xl opacity-70 transition-opacity group-hover:opacity-100"
        style={{ background: `radial-gradient(60% 60% at 50% 50%, ${priorityGlow}, transparent 75%)` }}
      />
      <div
        className={
          "relative h-full transition-transform duration-700 [transform-style:preserve-3d] " +
          (flipEnabled ? "group-hover:[transform:rotateY(180deg)]" : "")
        }
      >
      <article className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-card transition hover:shadow-elevated [backface-visibility:hidden]">
      <div className={"absolute right-6 top-6 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wider " + priorityClass}>
        {priority === "asap" && <span className="h-2 w-2 rounded-full bg-white animate-pulse-dot" />}
        {PRIORITY_LABELS[priority]}
      </div>

      {bu && (
        <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {bu.name}
        </div>
      )}

      <h3 className="mb-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-[2.4rem]">
        {job.role_name}
      </h3>
      <p className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-accent md:text-[1.7rem]">
        <Briefcase className="h-6 w-6 shrink-0" />
        <span className="truncate">{job.client_company}</span>
      </p>

      {job.tech_stack.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {job.tech_stack.slice(0, 5).map((t) => (
            <span key={t} className="rounded-lg bg-secondary px-3 py-1.5 text-base font-bold text-secondary-foreground md:text-lg">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-base font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {SENIORITY_LABELS[job.seniority]}
        </span>
        {job.years_experience != null && (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <GraduationCap className="h-5 w-5" /> {job.years_experience}+ yrs
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-5 w-5" /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <WIcon className="h-5 w-5" /> {WORK_MODEL_LABELS[job.working_model]}
        </span>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold " +
            ageClass
          }
        >
          <Clock className="h-4 w-4" /> {daysOpenLabel(openedAt)}
        </span>
      </div>
      </article>
      {flipEnabled && (
        <article
          className="absolute inset-0 flex h-full flex-col overflow-hidden rounded-2xl border border-accent/40 bg-card p-8 shadow-elevated [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            <FileText className="h-3.5 w-3.5" /> Project context
          </div>
          <h3 className="mb-1 text-xl font-extrabold leading-tight text-foreground">{job.role_name}</h3>
          <p className="mb-4 text-sm font-semibold text-muted-foreground">{job.client_company}</p>
          <p className="overflow-y-auto whitespace-pre-line text-base leading-relaxed text-foreground/90">
            {job.project_context}
          </p>
        </article>
      )}
      </div>
    </div>
  );
}