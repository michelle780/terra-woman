CREATE TYPE public.app_role AS ENUM ('admin','editor','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.roots_content (
  id text PRIMARY KEY,
  title text NOT NULL,
  short_title text,
  content_type text,
  historical_period text,
  approximate_year integer,
  exact_date date,
  month smallint,
  day smallint,
  woman_name text,
  woman_lifespan text,
  geography text,
  culture text,
  topic text,
  short_body text,
  body text,
  quote text,
  quote_attribution text,
  modern_context text,
  why_it_matters text,
  source_name text,
  source_url text,
  secondary_source_url text,
  historical_accuracy_status text NOT NULL DEFAULT 'DRAFT',
  medical_context_required boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  editorial_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.roots_content TO anon;
GRANT SELECT, INSERT, UPDATE ON public.roots_content TO authenticated;
GRANT ALL ON public.roots_content TO service_role;

ALTER TABLE public.roots_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published verified roots"
  ON public.roots_content FOR SELECT TO anon, authenticated
  USING (published = true AND historical_accuracy_status = 'VERIFIED');

CREATE POLICY "Editors can read all roots"
  ON public.roots_content FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Editors can insert roots"
  ON public.roots_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Editors can update roots"
  ON public.roots_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE TRIGGER trg_roots_content_updated
  BEFORE UPDATE ON public.roots_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_roots_status ON public.roots_content (historical_accuracy_status);
CREATE INDEX idx_roots_published ON public.roots_content (published);