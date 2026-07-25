-- Fix: invitations flipped to 'accepted' the moment the edge function created the
-- auth user (generateLink), not when the person actually accepted. Keep granting
-- the role at user creation, but only mark 'accepted' once the invited user
-- confirms their email (i.e. clicks the invite link).

-- 1) apply_invitation: grant the chosen role + drop the default recruiter for
--    admin invites, but DO NOT flip the status here anymore.
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

    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role <> inv.role;
    -- status stays 'pending' until the user confirms — see mark_invitation_accepted.
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Flip the invitation to 'accepted' when the invited user confirms their email
--    (email_confirmed_at goes from NULL to a timestamp on the first accept/sign-in).
CREATE OR REPLACE FUNCTION public.mark_invitation_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.invitations
    SET status = 'accepted', accepted_at = now()
    WHERE lower(email) = lower(NEW.email) AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_invitation_accepted() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_confirmed_mark_invitation ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_mark_invitation
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.mark_invitation_accepted();

-- 3) Data fix: reset invitations that were prematurely marked 'accepted' but whose
--    user has not actually confirmed yet, back to 'pending'.
UPDATE public.invitations i
SET status = 'pending', accepted_at = NULL
WHERE i.status = 'accepted'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) = lower(i.email) AND u.email_confirmed_at IS NULL
  );
