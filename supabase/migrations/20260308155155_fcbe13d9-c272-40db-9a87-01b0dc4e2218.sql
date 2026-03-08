
-- Fix: Payment Bypass via Subscription Self-Activation

-- 1. Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;

-- 2. Replace with restrictive INSERT: users can only insert with status 'pending'
CREATE POLICY "Users can insert own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND plan IN ('pro', 'premium'));

-- 3. Drop the permissive user UPDATE policy (only admins should change status)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
