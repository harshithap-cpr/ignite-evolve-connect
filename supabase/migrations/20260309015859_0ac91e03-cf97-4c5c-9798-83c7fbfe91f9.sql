
-- Fix 1: Investor emails - restrict to own profile or admin
DROP POLICY IF EXISTS "Investors viewable by authenticated users" ON public.investors;

-- Allow viewing investor listings (without email) by anyone authenticated
-- But we can't column-restrict via RLS, so instead restrict full access to owner/admin
-- and create a view-safe policy for browsing
CREATE POLICY "Users can view own investor profile"
ON public.investors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all investors"
ON public.investors
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can browse active investors"
ON public.investors
FOR SELECT
TO authenticated
USING (is_active = true AND email IS NULL OR user_id = auth.uid());

-- Fix 2: Profiles - restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix 3: App feedback - restrict to own feedback or admin
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.app_feedback;

CREATE POLICY "Users can view own feedback"
ON public.app_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.app_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
