import type {
  BusinessUnit,
  Candidate,
  CandidateInsert,
  Job,
  JobInsert,
  JobStatus,
} from "@/lib/jobs";
import {
  deleteCandidateById,
  deleteJobById,
  getRecruitmentState,
  saveCandidate as saveCandidateLocal,
  saveJob as saveJobLocal,
  setJobStatus as setJobStatusLocal,
} from "@/lib/localData";
import { supabase } from "@/integrations/supabase/client";

// The single data-access contract. React Query hooks (src/hooks/queries/*)
// depend ONLY on this interface. Agent C migrates consumers to the hooks.
// Agent B implements `supabaseProvider`. Until then the app runs on
// `localStorageProvider` with zero behavior change.
export interface DataProvider {
  listBusinessUnits(): Promise<BusinessUnit[]>;
  listJobs(): Promise<Job[]>;
  listCandidates(): Promise<Candidate[]>;
  saveJob(input: JobInsert, id?: string): Promise<Job>;
  saveCandidate(input: CandidateInsert, id?: string): Promise<Candidate>;
  setJobStatus(id: string, status: JobStatus): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  deleteCandidate(id: string): Promise<void>;
}

const localStorageProvider: DataProvider = {
  async listBusinessUnits() {
    return getRecruitmentState().businessUnits;
  },
  async listJobs() {
    return getRecruitmentState().jobs;
  },
  async listCandidates() {
    return getRecruitmentState().candidates;
  },
  async saveJob(input, id) {
    saveJobLocal(input as Omit<Job, "id" | "created_at" | "updated_at">, id);
    const jobs = getRecruitmentState().jobs;
    const found = id
      ? jobs.find((j) => j.id === id)
      : jobs.find((j) => j.role_name === input.role_name);
    return found ?? jobs[0];
  },
  async saveCandidate(input, id) {
    saveCandidateLocal(
      input as Omit<Candidate, "id" | "created_at" | "updated_at">,
      id,
    );
    const candidates = getRecruitmentState().candidates;
    const found = id
      ? candidates.find((c) => c.id === id)
      : candidates.find((c) => c.full_name === input.full_name);
    return found ?? candidates[0];
  },
  async setJobStatus(id, status) {
    setJobStatusLocal(id, status);
    const job = getRecruitmentState().jobs.find((j) => j.id === id);
    if (!job) throw new Error(`Job ${id} not found`);
    return job;
  },
  async deleteJob(id) {
    deleteJobById(id);
  },
  async deleteCandidate(id) {
    deleteCandidateById(id);
  },
};

// Supabase-backed implementation. Maps app `Candidate` <-> DB `top_candidates`.
// The DB schema was aligned with the app model by the reconciliation migration
// (20260519120000), so payloads can flow through with minimal transformation.
function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error("Supabase returned no data");
  return data;
}

const supabaseProvider: DataProvider = {
  async listBusinessUnits() {
    const res = await supabase
      .from("business_units")
      .select("*")
      .order("sort_order", { ascending: true });
    return unwrap(res) as BusinessUnit[];
  },

  async listJobs() {
    const res = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    return unwrap(res) as Job[];
  },

  async listCandidates() {
    const res = await supabase
      .from("top_candidates")
      .select("*")
      .order("created_at", { ascending: false });
    return unwrap(res) as Candidate[];
  },

  async saveJob(input, id) {
    if (id) {
      const res = await supabase
        .from("jobs")
        .update(input as never)
        .eq("id", id)
        .select("*")
        .single();
      return unwrap(res) as Job;
    }
    const res = await supabase
      .from("jobs")
      .insert(input as never)
      .select("*")
      .single();
    return unwrap(res) as Job;
  },

  async saveCandidate(input, id) {
    if (id) {
      const res = await supabase
        .from("top_candidates")
        .update(input as never)
        .eq("id", id)
        .select("*")
        .single();
      return unwrap(res) as Candidate;
    }
    const res = await supabase
      .from("top_candidates")
      .insert(input as never)
      .select("*")
      .single();
    return unwrap(res) as Candidate;
  },

  async setJobStatus(id, status) {
    // The sync_jobs_closed_at trigger keeps closed_at consistent.
    const res = await supabase
      .from("jobs")
      .update({ status } as never)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap(res) as Job;
  },

  async deleteJob(id) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteCandidate(id) {
    const { error } = await supabase
      .from("top_candidates")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// Flip via VITE_DATA_BACKEND=supabase once Agent B + live DB are ready.
export function getDataProvider(): DataProvider {
  return import.meta.env.VITE_DATA_BACKEND === "supabase"
    ? supabaseProvider
    : localStorageProvider;
}
