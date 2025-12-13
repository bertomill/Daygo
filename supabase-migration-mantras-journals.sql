-- DayGo Migration: Add Mantras and Journal Prompts
-- Run this in Supabase SQL Editor (https://app.supabase.com)

-- Mantras table (daily affirmations)
CREATE TABLE mantras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Prompts table
CREATE TABLE journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries table (responses to prompts)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES journal_prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, date)
);

-- Enable Row Level Security
ALTER TABLE mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mantras
CREATE POLICY "Users can view own mantras"
  ON mantras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mantras"
  ON mantras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mantras"
  ON mantras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mantras"
  ON mantras FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for journal_prompts
CREATE POLICY "Users can view own journal prompts"
  ON journal_prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal prompts"
  ON journal_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal prompts"
  ON journal_prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal prompts"
  ON journal_prompts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);
