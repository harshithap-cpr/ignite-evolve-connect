-- Patent registrations table
CREATE TABLE public.patents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  invention_type TEXT DEFAULT 'utility' CHECK (invention_type IN ('utility', 'design', 'plant', 'provisional')),
  stage TEXT DEFAULT 'draft' CHECK (stage IN ('draft', 'prior_art_search', 'application_filing', 'examination', 'published', 'granted', 'rejected')),
  filing_date TIMESTAMPTZ,
  application_number TEXT,
  inventors TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own patents" ON public.patents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patents" ON public.patents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patents" ON public.patents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patents" ON public.patents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_patents_updated_at BEFORE UPDATE ON public.patents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Idea submissions with ranking
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_statement TEXT,
  proposed_solution TEXT,
  target_audience TEXT,
  unique_value TEXT,
  market_size TEXT,
  stage TEXT DEFAULT 'ideation' CHECK (stage IN ('ideation', 'validation', 'prototype', 'mvp', 'growth')),
  innovation_score NUMERIC DEFAULT 0,
  feasibility_score NUMERIC DEFAULT 0,
  market_score NUMERIC DEFAULT 0,
  overall_score NUMERIC DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  feedback TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ideas" ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public ideas" ON public.ideas FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Idea votes/ranking by community
CREATE TABLE public.idea_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.idea_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.idea_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vote" ON public.idea_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vote" ON public.idea_votes FOR DELETE USING (auth.uid() = user_id);

-- Investors directory
CREATE TABLE public.investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  investor_type TEXT DEFAULT 'angel' CHECK (investor_type IN ('angel', 'vc', 'accelerator', 'incubator', 'corporate', 'government')),
  focus_areas TEXT[] DEFAULT '{}',
  investment_range TEXT,
  portfolio_size INT DEFAULT 0,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors viewable by authenticated users" ON public.investors FOR SELECT TO authenticated USING (true);

-- Startup-Investor connection requests
CREATE TABLE public.investor_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(investor_id, user_id)
);

ALTER TABLE public.investor_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON public.investor_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request connection" ON public.investor_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed investors
INSERT INTO public.investors (name, title, company, investor_type, focus_areas, investment_range, portfolio_size, bio, avatar_url, email, linkedin_url, location) VALUES
('Rajan Anandan', 'Managing Director', 'Sequoia Capital India', 'vc', ARRAY['AI/ML', 'SaaS', 'FinTech'], '₹2Cr - ₹50Cr', 45, 'Former Google India MD. Backing bold founders building for India and the world.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200', 'invest@sequoia.in', 'https://linkedin.com', 'Bengaluru'),
('Anu Hariharan', 'Partner', 'Y Combinator Continuity', 'accelerator', ARRAY['EdTech', 'HealthTech', 'B2B SaaS'], '₹50L - ₹5Cr', 80, 'Investing in early-stage startups with global ambitions. YC alumni network access.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', 'anu@yc.com', 'https://linkedin.com', 'San Francisco'),
('Kunal Shah', 'Angel Investor', 'CRED / Angel Fund', 'angel', ARRAY['Consumer Tech', 'FinTech', 'D2C'], '₹25L - ₹2Cr', 120, 'Founder of CRED & FreeCharge. Passionate about unique consumer behavior insights.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'kunal@cred.club', 'https://linkedin.com', 'Mumbai'),
('Vani Kola', 'Founder & MD', 'Kalaari Capital', 'vc', ARRAY['DeepTech', 'Healthcare', 'Enterprise'], '₹1Cr - ₹30Cr', 55, 'One of India''s most respected VCs. Focus on technology-driven businesses with large TAM.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', 'vani@kalaari.com', 'https://linkedin.com', 'Bengaluru'),
('Nithin Kamath', 'Angel Investor', 'Zerodha / Rainmatter', 'angel', ARRAY['FinTech', 'CleanTech', 'Sustainability'], '₹10L - ₹5Cr', 35, 'Founder of Zerodha. Investing in climate, health, and financial inclusion startups.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', 'nithin@rainmatter.com', 'https://linkedin.com', 'Bengaluru'),
('Padmaja Ruparel', 'Co-Founder', 'Indian Angel Network', 'angel', ARRAY['IoT', 'AgriTech', 'Social Impact'], '₹25L - ₹3Cr', 90, 'Pioneer of angel investing in India. Championing women-led and impact-driven ventures.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', 'padmaja@ian.org', 'https://linkedin.com', 'Delhi'),
('NITI Aayog AIM', 'Government Program', 'Atal Innovation Mission', 'government', ARRAY['Social Impact', 'EdTech', 'HealthTech', 'CleanTech'], 'Up to ₹10Cr', 200, 'Government of India initiative supporting innovation and entrepreneurship across the country.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200', 'aim@niti.gov.in', 'https://aim.gov.in', 'New Delhi'),
('T-Hub', 'Incubator', 'T-Hub Foundation', 'incubator', ARRAY['DeepTech', 'AI/ML', 'IoT', 'Blockchain'], '₹10L - ₹1Cr', 150, 'India''s largest innovation ecosystem. Mentorship, funding, and corporate partnerships.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200', 'startups@t-hub.co', 'https://t-hub.co', 'Hyderabad');
