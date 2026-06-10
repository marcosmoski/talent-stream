export type WorkModel = "remote" | "hybrid" | "onsite";
export type JobStatus = "open" | "on_hold" | "closed_primeit" | "closed_client";
export type Seniority = "intern" | "junior" | "mid" | "senior" | "lead" | "principal";
export type Priority = "asap" | "p1" | "p2" | "p3";

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Job {
  id: string;
  business_unit_id: string;
  client_company: string;
  role_name: string;
  seniority: Seniority;
  tech_stack: string[];
  location: string;
  working_model: WorkModel;
  status: JobStatus;
  is_urgent: boolean;
  priority: Priority;
  opened_at: string;
  years_experience: number | null;
  closed_at: string | null;
  notes: string | null;
  project_context: string | null;
  keywork_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type JobInsert = Omit<Job, "id" | "created_at" | "updated_at"> & Partial<Pick<Job, "id" | "created_at" | "updated_at">>;

export interface Candidate {
  id: string;
  business_unit_id: string;
  job_id: string | null;
  full_name: string;
  headline: string | null;
  seniority: Seniority;
  tech_stack: string[];
  location: string | null;
  availability: string | null;
  notes: string | null;
  recruiter: string | null;
  keywork_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CandidateInsert = Omit<Candidate, "id" | "created_at" | "updated_at"> & Partial<Pick<Candidate, "id" | "created_at" | "updated_at">>;

export const SENIORITY_LABELS: Record<Seniority, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
  principal: "Principal",
};

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  open: "Open",
  on_hold: "On hold",
  closed_primeit: "Closed · PrimeIT hired",
  closed_client: "Closed · by client",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  asap: "ASAP",
  p1: "P1",
  p2: "P2",
  p3: "P3",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  asap: 0,
  p1: 1,
  p2: 2,
  p3: 3,
};

export function daysOpen(openedAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(openedAt).getTime()) / 86400000));
}

export function isClosed(status: JobStatus): boolean {
  return status === "closed_primeit" || status === "closed_client";
}

export function daysOpenLabel(openedAt: string): string {
  const d = daysOpen(openedAt);
  if (d === 0) return "Opened today";
  if (d === 1) return "Open for 1 day";
  return `Open for ${d} days`;
}

export type AgeSeverity = "fresh" | "warning" | "stale";

export function ageSeverity(createdAt: string): AgeSeverity {
  const d = daysOpen(createdAt);
  if (d < 5) return "fresh";
  if (d <= 10) return "warning";
  return "stale";
}
