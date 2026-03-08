
-- Incubators table
CREATE TABLE public.incubators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  website_url TEXT,
  image_url TEXT,
  focus_areas TEXT[] DEFAULT '{}',
  facilities TEXT[] DEFAULT '{}',
  application_deadline TEXT,
  program_duration TEXT,
  equity_requirement TEXT,
  funding_support TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Incubator registrations
CREATE TABLE public.incubator_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incubator_id UUID NOT NULL REFERENCES public.incubators(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  pitch_deck_data JSONB,
  elevator_pitch TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, incubator_id)
);

ALTER TABLE public.incubators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incubator_registrations ENABLE ROW LEVEL SECURITY;

-- Everyone can view incubators
CREATE POLICY "Anyone can view incubators" ON public.incubators FOR SELECT USING (true);

-- Users can view own registrations
CREATE POLICY "Users can view own registrations" ON public.incubator_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Users can insert own registrations
CREATE POLICY "Users can insert own registrations" ON public.incubator_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Users can update own registrations
CREATE POLICY "Users can update own registrations" ON public.incubator_registrations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seed some incubators
INSERT INTO public.incubators (name, description, location, focus_areas, facilities, program_duration, funding_support, equity_requirement) VALUES
('TechSpark Incubator', 'India''s premier tech startup incubator offering world-class mentorship, funding, and workspace for early-stage ventures.', 'Bangalore, India', ARRAY['AI/ML', 'FinTech', 'HealthTech', 'EdTech'], ARRAY['Co-working Space', 'High-speed Internet', 'Meeting Rooms', 'Prototyping Lab', 'Cafeteria'], '6 months', '₹10L - ₹50L seed funding', '5-8%'),
('InnoVenture Hub', 'A government-backed incubation center focused on deep-tech and hardware startups with state-of-the-art labs.', 'Hyderabad, India', ARRAY['IoT', 'Robotics', 'CleanTech', 'AgriTech'], ARRAY['Hardware Lab', 'Testing Facility', '3D Printing', 'Server Room', 'Auditorium'], '12 months', '₹25L - ₹1Cr grant-based', 'No equity'), 
('StartupNest', 'Community-driven incubator with strong alumni network and industry connections across Southeast Asia.', 'Mumbai, India', ARRAY['SaaS', 'E-commerce', 'Social Impact', 'Media'], ARRAY['Private Offices', 'Event Space', 'Recording Studio', 'Gym', 'Lounge'], '4 months', '₹5L - ₹20L convertible note', '3-5%'),
('DeepTech Labs', 'Research-focused incubator partnered with top universities for cutting-edge science and technology ventures.', 'Chennai, India', ARRAY['Biotech', 'Nanotech', 'Space Tech', 'Quantum Computing'], ARRAY['Research Lab', 'Clean Room', 'Computational Cluster', 'Library', 'Conference Hall'], '18 months', '₹50L - ₹2Cr equity + grants', '8-12%'),
('GreenStart Accelerator', 'Sustainability-focused accelerator helping climate-tech and green energy startups scale rapidly.', 'Pune, India', ARRAY['CleanTech', 'Renewable Energy', 'Circular Economy', 'Water Tech'], ARRAY['Solar Testing Lab', 'Workshop', 'Demo Area', 'Mentorship Lounge', 'Networking Hub'], '3 months', '₹15L - ₹75L', '6-10%');
