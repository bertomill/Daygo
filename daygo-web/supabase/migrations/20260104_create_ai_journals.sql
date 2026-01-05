-- Create AI journals table (stores prompts and their daily responses)
CREATE TABLE IF NOT EXISTS ai_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE ai_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI journals"
  ON ai_journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI journals"
  ON ai_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI journals"
  ON ai_journals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI journals"
  ON ai_journals FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_ai_journals_user_id ON ai_journals(user_id);
CREATE INDEX idx_ai_journals_user_date ON ai_journals(user_id, date);
CREATE INDEX idx_ai_journals_created_at ON ai_journals(created_at DESC);

-- Unique constraint: one response per prompt per day
CREATE UNIQUE INDEX idx_ai_journals_unique_prompt_date ON ai_journals(user_id, prompt, date) WHERE is_active = true;
