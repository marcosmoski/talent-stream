import { User, MapPin, Calendar } from "lucide-react";
import { Candidate, BusinessUnit, SENIORITY_LABELS } from "@/lib/jobs";

export function CandidateCard({ c, bu }: { c: Candidate; bu?: BusinessUnit; variant?: "tv" | "admin" }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/10 blur-xl" />
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
        ★ Top Candidate
      </div>
      {bu && (
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{bu.name}</div>
      )}
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <User className="h-4 w-4 opacity-70" />
        {c.full_name}
      </h3>
      {c.headline && (
        <p className="mt-1 text-sm text-muted-foreground">{c.headline}</p>
      )}
      {c.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.tech_stack.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[11px]">{t}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{SENIORITY_LABELS[c.seniority]}</span>
        {c.location && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>)}
        {c.availability && (<span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{c.availability}</span>)}
      </div>
    </article>
  );
}