CREATE POLICY "Users read own connector connections"
  ON public.app_user_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own connector connections"
  ON public.app_user_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own connector connections"
  ON public.app_user_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own connector connections"
  ON public.app_user_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO authenticated;