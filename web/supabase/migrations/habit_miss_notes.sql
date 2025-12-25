-- Create habit_miss_notes table
-- For tracking missed habits with improvement notes
CREATE TABLE IF NOT EXISTS habit_miss_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one miss note per habit per day
  UNIQUE(habit_id, date)
);

-- Enable RLS
ALTER TABLE habit_miss_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own miss notes
CREATE POLICY "Users can view their own habit miss notes"
  ON habit_miss_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit miss notes"
  ON habit_miss_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit miss notes"
  ON habit_miss_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit miss notes"
  ON habit_miss_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_habit_miss_notes_user_date ON habit_miss_notes(user_id, date);
CREATE INDEX idx_habit_miss_notes_habit_date ON habit_miss_notes(habit_id, date);
