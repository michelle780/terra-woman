CREATE TABLE public.share_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  recipient_email text,
  relationship text NOT NULL DEFAULT 'other',
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  revoked_at timestamptz,
  consent_signature text NOT NULL,
  consent_signed_at timestamptz NOT NULL DEFAULT now(),
  consent_version text NOT NULL DEFAULT 'v1',
  consent_statement text NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_grants TO authenticated;
GRANT ALL ON public.share_grants TO service_role;
ALTER TABLE public.share_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their own share grants"
  ON public.share_grants FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX share_grants_owner_idx ON public.share_grants(owner_id);

CREATE TRIGGER update_share_grants_updated_at
  BEFORE UPDATE ON public.share_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.share_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grant_id uuid NOT NULL REFERENCES public.share_grants(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);

GRANT SELECT ON public.share_access_log TO authenticated;
GRANT ALL ON public.share_access_log TO service_role;
ALTER TABLE public.share_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their own share access log"
  ON public.share_access_log FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX share_access_log_grant_idx ON public.share_access_log(grant_id, viewed_at DESC);