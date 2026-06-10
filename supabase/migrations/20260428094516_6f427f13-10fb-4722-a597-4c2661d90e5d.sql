-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'recruiter')
  )
$$;

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto profile + default recruiter role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recruiter');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Business Units
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BUs are public" ON public.business_units FOR SELECT USING (true);
CREATE POLICY "Staff manage BUs" ON public.business_units FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Enums for jobs
CREATE TYPE public.work_model AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE public.job_status AS ENUM ('open', 'on_hold', 'closed');
CREATE TYPE public.seniority_level AS ENUM ('intern', 'junior', 'mid', 'senior', 'lead', 'principal');

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  client_company TEXT NOT NULL,
  role_name TEXT NOT NULL,
  seniority seniority_level NOT NULL DEFAULT 'mid',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  working_model work_model NOT NULL DEFAULT 'hybrid',
  status job_status NOT NULL DEFAULT 'open',
  is_urgent BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open jobs public" ON public.jobs FOR SELECT USING (status = 'open' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- Top Candidates
CREATE TABLE public.top_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  headline TEXT,
  seniority seniority_level NOT NULL DEFAULT 'mid',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  availability TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.top_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Top candidates public" ON public.top_candidates FOR SELECT USING (true);
CREATE POLICY "Staff insert candidates" ON public.top_candidates FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update candidates" ON public.top_candidates FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete candidates" ON public.top_candidates FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER touch_jobs BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_candidates BEFORE UPDATE ON public.top_candidates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed business units
INSERT INTO public.business_units (name, slug, sort_order) VALUES
  ('Newgen Leaders', 'newgen-leaders', 1),
  ('Foster Kids', 'foster-kids', 2),
  ('Porto d''Ouro', 'porto-douro', 3),
  ('Nearshore', 'nearshore', 4),
  ('Go Gunners', 'go-gunners', 5),
  ('Partners in Prime', 'partners-in-prime', 6),
  ('Invictus', 'invictus', 7),
  ('Suricatas Engenheiros', 'suricatas-engenheiros', 8),
  ('Public Sector', 'public-sector', 9);
