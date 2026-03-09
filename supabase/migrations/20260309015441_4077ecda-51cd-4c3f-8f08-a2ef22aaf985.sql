
-- Fix: Remove policy that exposes full subscription rows to anon users
DROP POLICY IF EXISTS "Anyone can count active subscriptions" ON public.subscriptions;

-- Create a secure function that returns only the count
CREATE OR REPLACE FUNCTION public.get_active_subscriber_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.subscriptions WHERE status = 'active';
$$;
