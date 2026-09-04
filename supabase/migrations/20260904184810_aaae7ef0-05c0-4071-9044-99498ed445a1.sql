
-- 1) Feedback policies: use the non-exposed private.has_role instead of public.has_role
DROP POLICY "Users can read their own feedback, admins read all" ON public.feedback;
CREATE POLICY "Users can read their own feedback, admins read all"
ON public.feedback FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY "Admins can resolve feedback" ON public.feedback;
CREATE POLICY "Admins can resolve feedback"
ON public.feedback FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Remove direct EXECUTE on the public SECURITY DEFINER has_role from API roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;

-- 3) Explicit admin-only write policies on announcements (was fail-closed by absence;
--    now defense-in-depth alongside the server-side admin check)
CREATE POLICY "Admins can insert announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update announcements"
ON public.announcements FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete announcements"
ON public.announcements FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Explicit deny of anonymous access to share_grants (recipient reads go through a
--    server function that strictly scopes by token + revocation + expiry)
CREATE POLICY "Deny anonymous access to share grants"
ON public.share_grants AS RESTRICTIVE FOR ALL TO anon
USING (false) WITH CHECK (false);
