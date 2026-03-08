
-- Allow mentors to view bookings addressed to them
CREATE POLICY "Mentors can view their bookings"
ON public.mentor_bookings
FOR SELECT
TO authenticated
USING (
  mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
);

-- Allow mentors to update bookings (accept/reject)
CREATE POLICY "Mentors can update their bookings"
ON public.mentor_bookings
FOR UPDATE
TO authenticated
USING (
  mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
);

-- Allow investors to view connection requests addressed to them
CREATE POLICY "Investors can view their connections"
ON public.investor_connections
FOR SELECT
TO authenticated
USING (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid())
);

-- Allow investors to update connection requests (accept/reject)
CREATE POLICY "Investors can update their connections"
ON public.investor_connections
FOR UPDATE
TO authenticated
USING (
  investor_id IN (SELECT id FROM public.investors WHERE user_id = auth.uid())
);
