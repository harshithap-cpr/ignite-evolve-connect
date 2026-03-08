ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS video_url text;

UPDATE public.courses SET video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ' WHERE video_url IS NULL;