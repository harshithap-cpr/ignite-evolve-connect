-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'innovator' CHECK (role IN ('student', 'innovator', 'mentor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Hackathons table
CREATE TABLE public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  max_team_size INT DEFAULT 4,
  prize_pool TEXT,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hackathons viewable by everyone" ON public.hackathons FOR SELECT USING (true);

-- Hackathon registrations
CREATE TABLE public.hackathon_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'submitted', 'evaluated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hackathon_id, user_id)
);

ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON public.hackathon_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register" ON public.hackathon_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mentors table
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  expertise TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  hourly_rate NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  total_sessions INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentors viewable by everyone" ON public.mentors FOR SELECT USING (true);

-- Mentor bookings
CREATE TABLE public.mentor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.mentor_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.mentor_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.mentor_bookings FOR UPDATE USING (auth.uid() = user_id);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_hours NUMERIC DEFAULT 0,
  lessons_count INT DEFAULT 0,
  image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  avg_rating NUMERIC DEFAULT 0,
  total_ratings INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);

-- Course ratings
CREATE TABLE public.course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.course_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate courses" ON public.course_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.course_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Seed sample hackathons
INSERT INTO public.hackathons (title, description, start_date, end_date, registration_deadline, prize_pool, difficulty, tags, image_url) VALUES
('AI for Good Hackathon', 'Build AI solutions that address social challenges in education, healthcare, and sustainability.', now() + interval '7 days', now() + interval '9 days', now() + interval '6 days', '₹50,000', 'intermediate', ARRAY['AI', 'Machine Learning', 'Social Impact'], 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600'),
('Green Tech Challenge', 'Create technology solutions for environmental sustainability and clean energy.', now() + interval '14 days', now() + interval '16 days', now() + interval '13 days', '₹75,000', 'advanced', ARRAY['CleanTech', 'IoT', 'Sustainability'], 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=600'),
('FinTech Innovation Sprint', 'Design next-gen financial solutions for rural India and underserved communities.', now() + interval '21 days', now() + interval '23 days', now() + interval '20 days', '₹1,00,000', 'intermediate', ARRAY['FinTech', 'Blockchain', 'Payments'], 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'),
('HealthTech Hackathon', 'Innovate in telemedicine, diagnostics, and health data analytics.', now() + interval '30 days', now() + interval '32 days', now() + interval '29 days', '₹60,000', 'beginner', ARRAY['HealthTech', 'Telemedicine', 'Data'], 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600'),
('EduTech Builders', 'Build tools to transform education for students across India.', now() + interval '35 days', now() + interval '37 days', now() + interval '34 days', '₹40,000', 'beginner', ARRAY['EdTech', 'Mobile', 'Gamification'], 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600');

-- Seed sample mentors
INSERT INTO public.mentors (name, title, company, expertise, bio, avatar_url, hourly_rate, rating, total_sessions, is_available) VALUES
('Dr. Priya Sharma', 'AI Research Lead', 'Google DeepMind', ARRAY['Artificial Intelligence', 'Machine Learning', 'NLP'], 'PhD in Computer Science with 10+ years in AI research. Passionate about mentoring the next generation of AI innovators.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', 500, 4.9, 120, true),
('Rahul Mehta', 'Startup Founder & CTO', 'TechNova Labs', ARRAY['Entrepreneurship', 'Product Development', 'React'], 'Serial entrepreneur with 3 successful exits. Love helping early-stage founders build scalable products.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 300, 4.7, 85, true),
('Ananya Krishnan', 'Design Director', 'Flipkart', ARRAY['UI/UX Design', 'Design Thinking', 'User Research'], 'Award-winning designer focused on building inclusive digital experiences for millions of users.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', 400, 4.8, 95, true),
('Vikram Patel', 'Blockchain Architect', 'Polygon', ARRAY['Blockchain', 'Web3', 'Smart Contracts'], 'Core contributor to Web3 protocols. Helping developers understand and build decentralized applications.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', 600, 4.6, 60, true),
('Sneha Reddy', 'Data Science Manager', 'Microsoft', ARRAY['Data Science', 'Python', 'Analytics'], 'Leading data teams at scale. Mentor for aspiring data scientists and analysts.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', 450, 4.8, 110, true),
('Arjun Das', 'IoT & Hardware Lead', 'Tata Elxsi', ARRAY['IoT', 'Embedded Systems', 'Robotics'], 'Building connected devices for smart cities. Love helping students bridge the hardware-software gap.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', 350, 4.5, 45, true);

-- Seed sample courses
INSERT INTO public.courses (title, description, instructor, category, difficulty, duration_hours, lessons_count, image_url, is_premium, avg_rating, total_ratings) VALUES
('Innovation & Design Thinking', 'Master the design thinking framework to solve real-world problems creatively.', 'Dr. Priya Sharma', 'Innovation', 'beginner', 8, 24, 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600', false, 4.8, 342),
('Startup Fundamentals', 'From idea validation to MVP — learn the essentials of launching a successful startup.', 'Rahul Mehta', 'Entrepreneurship', 'beginner', 12, 36, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600', false, 4.6, 278),
('AI & Machine Learning Essentials', 'A practical introduction to AI/ML concepts with Python projects and real datasets.', 'Sneha Reddy', 'Technology', 'intermediate', 20, 48, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600', true, 4.9, 567),
('Product Management Masterclass', 'Learn to build products users love — from discovery to delivery and beyond.', 'Ananya Krishnan', 'Product', 'intermediate', 15, 40, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', true, 4.7, 198),
('Blockchain Development', 'Build decentralized apps from scratch using Solidity, Ethereum, and Web3 tools.', 'Vikram Patel', 'Technology', 'advanced', 25, 52, 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600', true, 4.5, 145),
('IoT Project Building', 'Design and build IoT prototypes — from sensors to cloud dashboards.', 'Arjun Das', 'Technology', 'intermediate', 18, 32, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600', false, 4.4, 89),
('Public Speaking for Innovators', 'Present your ideas with confidence. Learn pitch creation and investor communication.', 'Rahul Mehta', 'Soft Skills', 'beginner', 6, 18, 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600', false, 4.3, 210),
('Data Analytics with Python', 'Learn data analysis, visualization, and storytelling with Python and Pandas.', 'Sneha Reddy', 'Technology', 'beginner', 14, 35, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', false, 4.7, 423);
