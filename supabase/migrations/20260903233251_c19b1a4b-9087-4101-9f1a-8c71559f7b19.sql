CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Editors can read all roots" ON public.roots_content;
DROP POLICY IF EXISTS "Editors can insert roots" ON public.roots_content;
DROP POLICY IF EXISTS "Editors can update roots" ON public.roots_content;
DROP POLICY IF EXISTS "Editors read all roots content" ON public.roots_content;
DROP POLICY IF EXISTS "Editors insert roots content" ON public.roots_content;
DROP POLICY IF EXISTS "Editors update roots content" ON public.roots_content;

CREATE POLICY "Editors read all roots content" ON public.roots_content
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors insert roots content" ON public.roots_content
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors update roots content" ON public.roots_content
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'editor'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'editor'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);