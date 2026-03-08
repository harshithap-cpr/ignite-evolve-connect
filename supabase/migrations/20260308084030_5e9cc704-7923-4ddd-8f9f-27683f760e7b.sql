
-- Allow authenticated users to insert themselves as mentors
CREATE POLICY "Users can insert own mentor profile" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow mentors to update their own profile
CREATE POLICY "Users can update own mentor profile" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to insert themselves as investors (need user_id column first)
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS user_id UUID;

-- Allow investors to insert own profile
CREATE POLICY "Users can insert own investor profile" ON public.investors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow investors to update own profile
CREATE POLICY "Users can update own investor profile" ON public.investors FOR UPDATE USING (auth.uid() = user_id);
