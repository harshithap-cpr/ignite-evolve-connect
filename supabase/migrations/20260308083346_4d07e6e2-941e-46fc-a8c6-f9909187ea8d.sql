
-- Create copyrights table
CREATE TABLE public.copyrights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT DEFAULT 'literary',
  authors TEXT[] DEFAULT '{}',
  registration_number TEXT,
  filing_date TIMESTAMP WITH TIME ZONE,
  stage TEXT DEFAULT 'draft',
  notes TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copyrights ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own copyrights" ON public.copyrights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own copyrights" ON public.copyrights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own copyrights" ON public.copyrights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own copyrights" ON public.copyrights FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_copyrights_updated_at BEFORE UPDATE ON public.copyrights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
