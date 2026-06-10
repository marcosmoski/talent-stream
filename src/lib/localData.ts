import type { BusinessUnit, Candidate, Job } from "@/lib/jobs";

const STORAGE_KEY = "primeit-recruitment-state-v6";

export const KEYWORK_BASE_URL = "https://keywork.primeit.pt";

type RecruitmentState = {
  businessUnits: BusinessUnit[];
  jobs: Job[];
  candidates: Candidate[];
};

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
const stamp = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const mockBusinessUnits: BusinessUnit[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Newgen Leaders", slug: "newgen-leaders", description: null, sort_order: 1, created_at: daysAgo(45) },
  { id: "22222222-2222-4222-8222-222222222222", name: "Foster Kids", slug: "foster-kids", description: null, sort_order: 2, created_at: daysAgo(45) },
  { id: "33333333-3333-4333-8333-333333333333", name: "Porto d'Ouro", slug: "porto-douro", description: null, sort_order: 3, created_at: daysAgo(45) },
  { id: "44444444-4444-4444-8444-444444444444", name: "Nearshore", slug: "nearshore", description: null, sort_order: 4, created_at: daysAgo(45) },
  { id: "55555555-5555-4555-8555-555555555555", name: "Go Gunners", slug: "go-gunners", description: null, sort_order: 5, created_at: daysAgo(45) },
  { id: "66666666-6666-4666-8666-666666666666", name: "Partners in Prime", slug: "partners-in-prime", description: null, sort_order: 6, created_at: daysAgo(45) },
  { id: "77777777-7777-4777-8777-777777777777", name: "Invictus", slug: "invictus", description: null, sort_order: 7, created_at: daysAgo(45) },
  { id: "88888888-8888-4888-8888-888888888888", name: "Suricatas Engenheiros", slug: "suricatas-engenheiros", description: null, sort_order: 8, created_at: daysAgo(45) },
  { id: "99999999-9999-4999-8999-999999999999", name: "Public Sector", slug: "public-sector", description: null, sort_order: 9, created_at: daysAgo(45) },
];

const jobSeed: Array<Omit<Job, "id" | "updated_at" | "created_by" | "project_context" | "keywork_url">> = [
  { business_unit_id: mockBusinessUnits[0].id, client_company: "PrimeIT Lab", role_name: "Tech Lead · React Platform", seniority: "lead", tech_stack: ["React", "TypeScript", "Node.js", "Azure"], location: "Lisbon, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "asap", opened_at: daysAgo(2), years_experience: 8, closed_at: null, notes: "High-priority leadership role for a web platform team.", created_at: daysAgo(2) },
  { business_unit_id: mockBusinessUnits[1].id, client_company: "HealthTech Client", role_name: "QA Automation Engineer", seniority: "senior", tech_stack: ["Cypress", "Playwright", "API Testing"], location: "Lisbon, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "p1", opened_at: daysAgo(4), years_experience: 6, closed_at: null, notes: "Automation profile with strong stakeholder communication.", created_at: daysAgo(4) },
  { business_unit_id: mockBusinessUnits[2].id, client_company: "Retail Group", role_name: "Backend Developer · Java", seniority: "mid", tech_stack: ["Java", "Spring Boot", "PostgreSQL", "Kafka"], location: "Porto, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "p2", opened_at: daysAgo(6), years_experience: 4, closed_at: null, notes: "Product squad role based in Porto.", created_at: daysAgo(6) },
  { business_unit_id: mockBusinessUnits[3].id, client_company: "Nordic SaaS", role_name: "Full Stack Engineer · React", seniority: "senior", tech_stack: ["React", ".NET", "Azure", "SQL"], location: "Remote, EU", working_model: "remote", status: "open", is_urgent: true, priority: "p1", opened_at: daysAgo(1), years_experience: 5, closed_at: null, notes: "Nearshore delivery team for a scale-up client.", created_at: daysAgo(1) },
  { business_unit_id: mockBusinessUnits[4].id, client_company: "Sports Analytics", role_name: "Data Engineer", seniority: "mid", tech_stack: ["Python", "dbt", "Snowflake", "Airflow"], location: "Lisbon, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "p2", opened_at: daysAgo(8), years_experience: 3, closed_at: null, notes: "Data pipeline ownership for analytics platform.", created_at: daysAgo(8) },
  { business_unit_id: mockBusinessUnits[5].id, client_company: "Banking Partner", role_name: "Business Analyst · Payments", seniority: "senior", tech_stack: ["Agile", "Jira", "SQL", "Payments"], location: "Lisbon, PT", working_model: "onsite", status: "open", is_urgent: true, priority: "p1", opened_at: daysAgo(3), years_experience: 7, closed_at: null, notes: "Functional analyst for payments modernization.", created_at: daysAgo(3) },
  { business_unit_id: mockBusinessUnits[6].id, client_company: "Logistics Platform", role_name: "DevOps Engineer", seniority: "lead", tech_stack: ["Kubernetes", "Terraform", "AWS", "GitHub Actions"], location: "Porto, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "asap", opened_at: daysAgo(11), years_experience: 10, closed_at: null, notes: "Platform reliability and deployment automation.", created_at: daysAgo(11) },
  { business_unit_id: mockBusinessUnits[7].id, client_company: "Engineering Services", role_name: "Embedded Software Engineer", seniority: "senior", tech_stack: ["C++", "Linux", "Yocto", "CAN"], location: "Braga, PT", working_model: "onsite", status: "open", is_urgent: true, priority: "p2", opened_at: daysAgo(5), years_experience: 6, closed_at: null, notes: "Industrial engineering project with embedded Linux.", created_at: daysAgo(5) },
  { business_unit_id: mockBusinessUnits[8].id, client_company: "Public Agency", role_name: "Cybersecurity Consultant", seniority: "principal", tech_stack: ["ISO 27001", "Risk", "SIEM", "Cloud Security"], location: "Lisbon, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "p3", opened_at: daysAgo(7), years_experience: 9, closed_at: null, notes: "Security governance role for public sector program.", created_at: daysAgo(7) },
  { business_unit_id: mockBusinessUnits[3].id, client_company: "Retail Group", role_name: "Frontend Engineer · React", seniority: "mid", tech_stack: ["React", "TypeScript", "Tailwind"], location: "Remote, PT", working_model: "remote", status: "open", is_urgent: true, priority: "p2", opened_at: daysAgo(3), years_experience: 3, closed_at: null, notes: "Second React seat for the same client.", created_at: daysAgo(3) },
  { business_unit_id: mockBusinessUnits[2].id, client_company: "FinServ Co", role_name: "Java Developer · Microservices", seniority: "senior", tech_stack: ["Java", "Spring Boot", "Kafka", "AWS"], location: "Porto, PT", working_model: "hybrid", status: "open", is_urgent: true, priority: "p1", opened_at: daysAgo(2), years_experience: 5, closed_at: null, notes: "Backend microservices role.", created_at: daysAgo(2) },
  { business_unit_id: mockBusinessUnits[4].id, client_company: "AdTech Co", role_name: "Senior Data Engineer", seniority: "senior", tech_stack: ["Python", "Airflow", "dbt", "BigQuery"], location: "Lisbon, PT", working_model: "remote", status: "open", is_urgent: true, priority: "asap", opened_at: daysAgo(1), years_experience: 4, closed_at: null, notes: "Pipeline scaling for ads platform.", created_at: daysAgo(1) },
  // Closed historical roles (for reports)
  { business_unit_id: mockBusinessUnits[0].id, client_company: "PrimeIT Lab", role_name: "Senior React Engineer", seniority: "senior", tech_stack: ["React", "TypeScript"], location: "Lisbon, PT", working_model: "hybrid", status: "closed_primeit", is_urgent: false, priority: "p1", opened_at: daysAgo(95), years_experience: 5, closed_at: daysAgo(70), notes: null, created_at: daysAgo(95) },
  { business_unit_id: mockBusinessUnits[2].id, client_company: "Retail Group", role_name: "Java Developer", seniority: "mid", tech_stack: ["Java", "Spring"], location: "Porto, PT", working_model: "hybrid", status: "closed_primeit", is_urgent: false, priority: "p2", opened_at: daysAgo(80), years_experience: 4, closed_at: daysAgo(55), notes: null, created_at: daysAgo(80) },
  { business_unit_id: mockBusinessUnits[3].id, client_company: "Nordic SaaS", role_name: ".NET Engineer", seniority: "senior", tech_stack: [".NET", "Azure"], location: "Remote, EU", working_model: "remote", status: "closed_client", is_urgent: false, priority: "p1", opened_at: daysAgo(70), years_experience: 6, closed_at: daysAgo(40), notes: null, created_at: daysAgo(70) },
  { business_unit_id: mockBusinessUnits[4].id, client_company: "AdTech Co", role_name: "Data Engineer", seniority: "mid", tech_stack: ["Python", "Airflow"], location: "Lisbon, PT", working_model: "remote", status: "closed_primeit", is_urgent: false, priority: "p2", opened_at: daysAgo(60), years_experience: 3, closed_at: daysAgo(30), notes: null, created_at: daysAgo(60) },
  { business_unit_id: mockBusinessUnits[6].id, client_company: "Logistics Platform", role_name: "SRE Engineer", seniority: "senior", tech_stack: ["Kubernetes", "AWS"], location: "Porto, PT", working_model: "hybrid", status: "closed_primeit", is_urgent: false, priority: "p1", opened_at: daysAgo(50), years_experience: 7, closed_at: daysAgo(20), notes: null, created_at: daysAgo(50) },
  { business_unit_id: mockBusinessUnits[1].id, client_company: "HealthTech Client", role_name: "QA Engineer", seniority: "mid", tech_stack: ["Cypress"], location: "Lisbon, PT", working_model: "hybrid", status: "closed_client", is_urgent: false, priority: "p2", opened_at: daysAgo(40), years_experience: 3, closed_at: daysAgo(15), notes: null, created_at: daysAgo(40) },
  { business_unit_id: mockBusinessUnits[5].id, client_company: "Banking Partner", role_name: "Scrum Master", seniority: "senior", tech_stack: ["Agile", "Jira"], location: "Lisbon, PT", working_model: "onsite", status: "closed_primeit", is_urgent: false, priority: "p3", opened_at: daysAgo(120), years_experience: 8, closed_at: daysAgo(95), notes: null, created_at: daysAgo(120) },
  { business_unit_id: mockBusinessUnits[8].id, client_company: "Public Agency", role_name: "Security Analyst", seniority: "senior", tech_stack: ["SIEM"], location: "Lisbon, PT", working_model: "hybrid", status: "closed_client", is_urgent: false, priority: "p2", opened_at: daysAgo(110), years_experience: 5, closed_at: daysAgo(80), notes: null, created_at: daysAgo(110) },
];

const candidateSeed: Array<Omit<Candidate, "id" | "updated_at" | "created_by" | "job_id" | "recruiter" | "keywork_url">> = [
  { business_unit_id: mockBusinessUnits[0].id, full_name: "Mariana Costa", headline: "Engineering Manager · React and delivery leadership", seniority: "lead", tech_stack: ["React", "TypeScript", "Agile", "Azure"], location: "Lisbon", availability: "30 days", notes: "Strong team leadership background.", created_at: daysAgo(1) },
  { business_unit_id: mockBusinessUnits[1].id, full_name: "Rui Almeida", headline: "Senior QA Automation · Playwright/Cypress", seniority: "senior", tech_stack: ["Playwright", "Cypress", "Postman"], location: "Setúbal", availability: "Immediate", notes: "Available for quick interviews.", created_at: daysAgo(2) },
  { business_unit_id: mockBusinessUnits[2].id, full_name: "Beatriz Rocha", headline: "Java Backend Developer · fintech experience", seniority: "mid", tech_stack: ["Java", "Spring", "Kafka"], location: "Porto", availability: "15 days", notes: "Good match for backend squads.", created_at: daysAgo(3) },
  { business_unit_id: mockBusinessUnits[3].id, full_name: "Tiago Ferreira", headline: "Full Stack Engineer · remote-first teams", seniority: "senior", tech_stack: ["React", ".NET", "Azure"], location: "Coimbra", availability: "30 days", notes: "Excellent English and distributed-team experience.", created_at: daysAgo(1) },
  { business_unit_id: mockBusinessUnits[4].id, full_name: "Sofia Martins", headline: "Data Engineer · analytics and orchestration", seniority: "senior", tech_stack: ["Python", "Airflow", "dbt", "BigQuery"], location: "Lisbon", availability: "Immediate", notes: "Strong technical screening.", created_at: daysAgo(4) },
  { business_unit_id: mockBusinessUnits[5].id, full_name: "João Pereira", headline: "Business Analyst · banking/payments", seniority: "senior", tech_stack: ["Payments", "SQL", "UAT", "Jira"], location: "Lisbon", availability: "20 days", notes: "Domain knowledge in banking operations.", created_at: daysAgo(5) },
  { business_unit_id: mockBusinessUnits[6].id, full_name: "Inês Gomes", headline: "DevOps Lead · Kubernetes and IaC", seniority: "lead", tech_stack: ["Kubernetes", "Terraform", "AWS"], location: "Porto", availability: "45 days", notes: "Senior cloud profile.", created_at: daysAgo(2) },
  { business_unit_id: mockBusinessUnits[7].id, full_name: "Miguel Santos", headline: "Embedded Linux Engineer · C++", seniority: "senior", tech_stack: ["C++", "Linux", "Yocto"], location: "Braga", availability: "Immediate", notes: "Rare embedded profile.", created_at: daysAgo(6) },
  { business_unit_id: mockBusinessUnits[8].id, full_name: "Carolina Nunes", headline: "Cybersecurity Consultant · governance and SIEM", seniority: "principal", tech_stack: ["ISO 27001", "SIEM", "Risk"], location: "Lisbon", availability: "30 days", notes: "Public-sector-ready security profile.", created_at: daysAgo(3) },
];

const initialState = (): RecruitmentState => ({
  businessUnits: clone(mockBusinessUnits),
  jobs: jobSeed.map((job, index) => ({ ...job, project_context: (job as any).project_context ?? null, keywork_url: null, id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index + 1).padStart(12, "0")}`, created_by: null, updated_at: job.created_at })),
  candidates: candidateSeed.map((candidate, index) => ({ ...candidate, id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index + 1).padStart(12, "0")}`, job_id: null, recruiter: null, keywork_url: null, created_by: null, updated_at: candidate.created_at })),
});

function readState(): RecruitmentState {
  if (typeof window === "undefined") return initialState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = initialState();
    writeState(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as RecruitmentState;
    return {
      businessUnits: parsed.businessUnits?.length ? parsed.businessUnits : clone(mockBusinessUnits),
      jobs: parsed.jobs ?? [],
      candidates: parsed.candidates ?? [],
    };
  } catch {
    const seeded = initialState();
    writeState(seeded);
    return seeded;
  }
}

function writeState(state: RecruitmentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("primeit-local-data-change"));
}

export function getRecruitmentState() {
  return clone(readState());
}

export function saveJob(payload: Omit<Job, "id" | "created_at" | "updated_at">, jobId?: string) {
  const state = readState();
  const updatedAt = stamp();
  if (jobId) {
    state.jobs = state.jobs.map((job) => (job.id === jobId ? { ...job, ...payload, updated_at: updatedAt } : job));
  } else {
    state.jobs.unshift({ ...payload, id: id(), created_at: updatedAt, updated_at: updatedAt });
  }
  writeState(state);
}

export function saveCandidate(payload: Omit<Candidate, "id" | "created_at" | "updated_at">, candidateId?: string) {
  const state = readState();
  const updatedAt = stamp();
  if (candidateId) {
    state.candidates = state.candidates.map((candidate) => (candidate.id === candidateId ? { ...candidate, ...payload, updated_at: updatedAt } : candidate));
  } else {
    state.candidates.unshift({ ...payload, id: id(), created_at: updatedAt, updated_at: updatedAt });
  }
  writeState(state);
}

export function setJobStatus(jobId: string, status: Job["status"]) {
  const state = readState();
  state.jobs = state.jobs.map((job) => {
    if (job.id !== jobId) return job;
    const closed_at = (status === "closed_primeit" || status === "closed_client") ? (job.closed_at ?? stamp()) : null;
    return { ...job, status, closed_at, updated_at: stamp() };
  });
  writeState(state);
}

export function deleteJobById(jobId: string) {
  const state = readState();
  state.jobs = state.jobs.filter((job) => job.id !== jobId);
  writeState(state);
}

export function deleteCandidateById(candidateId: string) {
  const state = readState();
  state.candidates = state.candidates.filter((candidate) => candidate.id !== candidateId);
  writeState(state);
}

export function resetMockData() {
  writeState(initialState());
}