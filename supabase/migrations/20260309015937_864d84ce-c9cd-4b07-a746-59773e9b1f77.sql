
-- Fix the investor browsing policy - the previous one was too restrictive
-- Investors are public profiles meant to be discoverable, but email should be protected
-- Since RLS can't restrict columns, allow browsing active investors
-- and handle email visibility in application code
DROP POLICY IF EXISTS "Authenticated can browse active investors" ON public.investors;

CREATE POLICY "Authenticated can browse active investors"
ON public.investors
FOR SELECT
TO authenticated
USING (is_active = true);
