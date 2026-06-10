
-- 1) Restrict candidate visibility to staff only
DROP POLICY IF EXISTS "Top candidates public" ON public.top_candidates;

CREATE POLICY "Staff view candidates"
ON public.top_candidates
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 2) Prevent self-assignment of admin role
-- Replace the broad "Admins manage roles" ALL policy with explicit, admin-only write policies.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
