-- Ensure the PrimeIT domain trigger exists and is current
CREATE OR REPLACE FUNCTION public.enforce_primeit_domain()
RETURNS trigger
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

-- Ensure signup automation is attached after recent schema updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'recruiter')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure authenticated PrimeIT staff can manage opportunities without stale policy issues
DROP POLICY IF EXISTS "Staff insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Staff update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Staff delete jobs" ON public.jobs;

CREATE POLICY "Staff insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff delete jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));