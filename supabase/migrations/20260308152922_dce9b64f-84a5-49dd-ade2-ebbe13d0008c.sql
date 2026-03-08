CREATE POLICY "Anyone can count active subscriptions"
ON public.subscriptions
FOR SELECT
TO anon, authenticated
USING (status = 'active');