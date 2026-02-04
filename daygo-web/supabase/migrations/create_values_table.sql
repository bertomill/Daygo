-- Create the values table
CREATE TABLE IF NOT EXISTS public.values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own values" ON public.values
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own values" ON public.values
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values" ON public.values
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own values" ON public.values
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS values_user_id_idx ON public.values(user_id);

-- ============================================
-- SEED DATA (run separately after getting your user_id)
-- ============================================

-- First, get your user ID:
-- SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Then insert your values (replace YOUR_USER_ID with the actual UUID):
-- INSERT INTO public.values (user_id, text, sort_order) VALUES
--   ('YOUR_USER_ID', 'Integrity', 0),
--   ('YOUR_USER_ID', 'Growth', 1),
--   ('YOUR_USER_ID', 'Health', 2),
--   ('YOUR_USER_ID', 'Family', 3),
--   ('YOUR_USER_ID', 'Creativity', 4);
