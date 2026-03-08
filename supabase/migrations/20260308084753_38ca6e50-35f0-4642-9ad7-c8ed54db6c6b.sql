
-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  avatar_url TEXT,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team messages (chat)
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team notes
CREATE TABLE public.team_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notes ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Teams policies
CREATE POLICY "Anyone can view open teams" ON public.teams FOR SELECT USING (is_open = true);
CREATE POLICY "Members can view their teams" ON public.teams FOR SELECT USING (public.is_team_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team creator can update" ON public.teams FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Team creator can delete" ON public.teams FOR DELETE USING (auth.uid() = created_by);

-- Team members policies
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Users can join open teams" ON public.team_members FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    (SELECT is_open FROM public.teams WHERE id = team_id) = true
    OR (SELECT created_by FROM public.teams WHERE id = team_id) = auth.uid()
  )
);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Team creator can manage members" ON public.team_members FOR DELETE USING (
  (SELECT created_by FROM public.teams WHERE id = team_id) = auth.uid()
);

-- Team messages policies
CREATE POLICY "Members can view messages" ON public.team_messages FOR SELECT USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Members can send messages" ON public.team_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid(), team_id));

-- Team notes policies
CREATE POLICY "Members can view notes" ON public.team_notes FOR SELECT USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Members can create notes" ON public.team_notes FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Note author can update" ON public.team_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Note author can delete" ON public.team_notes FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_notes_updated_at BEFORE UPDATE ON public.team_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
