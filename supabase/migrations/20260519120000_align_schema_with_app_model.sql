-- Wave 0 — Align DB schema with the app data model (src/lib/jobs.ts).
-- Apply on Supabase project resume, then regenerate src/integrations/supabase/types.ts.
-- Safe to run once; uses IF NOT EXISTS / additive changes only.

-- 1) Priority enum + column on jobs (UI: color coding + sort order)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE public.priority_level AS ENUM ('asap', 'p1', 'p2', 'p3');
  END IF;
END $$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS priority public.priority_level NOT NULL DEFAULT 'p2',
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS years_experience INT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS project_context TEXT,
  ADD COLUMN IF NOT EXISTS keywork_url TEXT;

-- Backfill opened_at for any pre-existing rows so age math is sane.
UPDATE public.jobs SET opened_at = created_at WHERE opened_at IS NULL;

-- 2) Extend job_status enum to match the app (closed_primeit / closed_client).
-- Existing 'closed' value is left in place for back-compat; app never emits it.
-- ADD VALUE is non-transactional in Postgres, so each runs standalone & idempotent.
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'closed_primeit';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'closed_client';

-- 3) Candidate fields used by the app but absent from top_candidates.
ALTER TABLE public.top_candidates
  ADD COLUMN IF NOT EXISTS recruiter TEXT,
  ADD COLUMN IF NOT EXISTS keywork_url TEXT;

-- 4) Keep closed_at consistent on status change (mirror localData.setJobStatus).
CREATE OR REPLACE FUNCTION public.sync_job_closed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('closed_primeit', 'closed_client') THEN
    NEW.closed_at = COALESCE(NEW.closed_at, now());
  ELSE
    NEW.closed_at = NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_jobs_closed_at ON public.jobs;
CREATE TRIGGER sync_jobs_closed_at
  BEFORE INSERT OR UPDATE OF status ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_closed_at();
