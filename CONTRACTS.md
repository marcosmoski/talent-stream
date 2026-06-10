# Wave 0 Contracts — READ BEFORE STARTING ANY LANE

Frozen interfaces the parallel agents build against. Do **not** change
signatures in this doc without re-syncing all four lanes.

## The big finding: DB schema drifted from the app model

`supabase/migrations/*` (and the generated `types.ts`) were behind
`src/lib/jobs.ts`. The reconciliation migration
`supabase/migrations/20260519120000_align_schema_with_app_model.sql`
fixes this. It must be applied (on Supabase resume) **before** the
supabase data provider can work, and `src/integrations/supabase/types.ts`
regenerated afterward.

What it adds: `jobs.priority|opened_at|years_experience|closed_at|project_context|keywork_url`,
`job_status` += `closed_primeit`/`closed_client`, `top_candidates.recruiter|keywork_url`,
and a `closed_at` sync trigger.

Auth/roles/RLS are **already fully scaffolded** in earlier migrations
(`profiles`, `user_roles`, `app_role`, `has_role`, `is_staff`,
auto-profile-on-signup trigger, `@primeit.pt` enforcement, full RLS).
Agent A's job is mostly client-side; Agent D's RLS task is an *audit*.

## Data access contract — `src/lib/dataProvider.ts`

All data flows through `DataProvider`. App currently runs on
`localStorageProvider` (zero regression). Switch with
`VITE_DATA_BACKEND=supabase` once Agent B + live DB are ready.

```ts
interface DataProvider {
  listBusinessUnits(): Promise<BusinessUnit[]>;
  listJobs(): Promise<Job[]>;
  listCandidates(): Promise<Candidate[]>;
  saveJob(input: JobInsert, id?: string): Promise<Job>;
  saveCandidate(input: CandidateInsert, id?: string): Promise<Candidate>;
  setJobStatus(id: string, status: JobStatus): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  deleteCandidate(id: string): Promise<void>;
}
```

## React Query hooks — `src/hooks/queries/`

Consumers use ONLY these (never `localData.ts` directly, never the
provider directly). Keys are centralized in `keys.ts`.

- `useBusinessUnits()` · `useJobs()` · `useCandidates()` — queries
- `useSaveJob()` → `mutate({ input, id? })`
- `useSetJobStatus()` → `mutate({ id, status })` (optimistic)
- `useDeleteJob()` → `mutate(id)` (optimistic)
- `useSaveCandidate()` → `mutate({ input, id? })`
- `useDeleteCandidate()` → `mutate(id)` (optimistic)

## Auth contract — `src/hooks/useAuth.tsx`

Keep the `AuthCtx` interface **byte-for-byte identical**
(`user, session, roles, isStaff, loading, roleError, signIn, signUp,
signOut`). Agent A swaps internals to Supabase Auth; no consumer changes.

## Lane ownership (no file touched by two agents)

| Lane | Owns |
|---|---|
| **A · Auth & Access** | `hooks/useAuth.tsx`, `pages/Auth.tsx`, `App.tsx`, new admin-users UI |
| **B · Data layer** | `supabaseProvider` in `lib/dataProvider.ts`, regenerated `integrations/supabase/types.ts` |
| **C · Consumers** | `pages/Index|Admin|Reports`, `JobFormDialog`, `CandidateFormDialog` (swap to hooks + Zod) |
| **D · Infra/DB** | `supabase/migrations/*`, RLS audit, seed, Vercel deploy/env |

Rules: only Agent A edits `App.tsx`. Only Agent B edits `supabaseProvider`
and `types.ts`. C codes against hook signatures; never touches the
provider. `localData.ts` stays as the local backend — do not delete it
until Supabase is verified live.

Integration order at the end: **D → B → A → C**.
