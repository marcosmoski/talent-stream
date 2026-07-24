-- Admin-issued invitations.
-- An admin invites an email and picks the role that person should receive. The
-- auth user + email delivery are handled by the `invite-user` edge function;
-- this table is the audit trail and the "pending invites" list in the UI, and
-- the trigger below grants the chosen role when the invited user is created.

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'recruiter',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days'
);

-- At most one pending invite per email (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS invitations_pending_email_uidx
  ON public.invitations (lower(email))
  WHERE status = 'pending';

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can see or manage invitations.
DROP POLICY IF EXISTS "Admins read invitations" ON public.invitations;
CREATE POLICY "Admins read invitations" ON public.invitations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert invitations" ON public.invitations;
CREATE POLICY "Admins insert invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update invitations" ON public.invitations;
CREATE POLICY "Admins update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete invitations" ON public.invitations;
CREATE POLICY "Admins delete invitations" ON public.invitations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- When the invited user lands in auth.users, grant the role the admin chose and
-- flip the invite to 'accepted'. Runs AFTER handle_new_user's trigger
-- (on_auth_user_created), which already created the profile + default recruiter
-- role — trigger names fire in alphabetical order, and this one sorts later.
CREATE OR REPLACE FUNCTION public.apply_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv
  FROM public.invitations
  WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- The invite sets the user's exact role. Drop the default 'recruiter' row
    -- that handle_new_user just added when a different role was chosen, so an
    -- invited admin ends up as admin only (not admin + recruiter). Safe here
    -- because this runs at user creation, when those are the only roles present.
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role <> inv.role;

    UPDATE public.invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = inv.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Keep this function callable only by the trigger owner (definer), like the
-- other signup automation functions in this schema.
REVOKE EXECUTE ON FUNCTION public.apply_invitation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_apply_invitation ON auth.users;
CREATE TRIGGER on_auth_user_created_apply_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.apply_invitation();
