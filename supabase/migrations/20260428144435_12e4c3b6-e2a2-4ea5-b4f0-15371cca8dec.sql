CREATE OR REPLACE FUNCTION public.enforce_primeit_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR lower(NEW.email) NOT LIKE '%@primeit.pt' THEN
    RAISE EXCEPTION 'Only @primeit.pt emails are allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_primeit_domain_trigger ON auth.users;
CREATE TRIGGER enforce_primeit_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_primeit_domain();