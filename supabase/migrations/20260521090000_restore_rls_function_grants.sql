-- Restore EXECUTE grants on the SECURITY DEFINER helpers used inside RLS
-- policies. Migration 20260428094534 REVOKEd EXECUTE from `authenticated`
-- and `anon` on `has_role`, `is_staff`, and `handle_new_user`, which broke
-- every policy that calls them (e.g. user_roles SELECT, jobs SELECT) — the
-- authenticated role has no EXECUTE, Postgres does not guarantee OR
-- short-circuit, the policy evaluation fails with 42501.
--
-- These functions are SECURITY DEFINER specifically so the caller does NOT
-- need direct access to the underlying tables; granting EXECUTE on the
-- function itself is the intended Supabase pattern.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;

-- handle_new_user and enforce_primeit_domain stay REVOKEd — they are
-- trigger functions, never called by application code.
