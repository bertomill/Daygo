-- DayGo Database Schema
-- Run this in Supabase SQL Editor (https://app.supabase.com)

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habit logs table (daily completion tracking)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(habit_id, date)
);

-- 4. Goals table (SMART goals)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metric_name TEXT NOT NULL,
  metric_target NUMERIC NOT NULL,
  metric_current NUMERIC DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habit-Goal links (many-to-many)
CREATE TABLE habit_goal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(habit_id, goal_id)
);

-- 6. Mantras table (daily affirmations)
CREATE TABLE mantras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Journal Prompts table
CREATE TABLE journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Journal Entries table (responses to prompts)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES journal_prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, date)
);

-- 6. Daily scores view
CREATE VIEW daily_scores AS
SELECT
  user_id,
  date,
  ROUND((COUNT(*) FILTER (WHERE completed) * 100.0) / NULLIF(COUNT(*), 0)) as score,
  COUNT(*) FILTER (WHERE completed) as completed_count,
  COUNT(*) as total_count
FROM habit_logs
GROUP BY user_id, date;

-- 7. Create indexes for performance
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id, is_active);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_habit_goal_links_goal ON habit_goal_links(goal_id);
CREATE INDEX idx_habit_goal_links_habit ON habit_goal_links(habit_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_goal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 10. RLS Policies for habits
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- 11. RLS Policies for habit_logs
CREATE POLICY "Users can view own habit logs"
  ON habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit logs"
  ON habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs"
  ON habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 12. RLS Policies for goals
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- 13. RLS Policies for habit_goal_links
CREATE POLICY "Users can view own habit goal links"
  ON habit_goal_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE goals.id = habit_goal_links.goal_id AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create habit goal links for own goals"
  ON habit_goal_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own habit goal links"
  ON habit_goal_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals WHERE goals.id = habit_goal_links.goal_id AND goals.user_id = auth.uid()
    )
  );

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

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
