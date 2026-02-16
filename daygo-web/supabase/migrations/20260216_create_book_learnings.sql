-- Create book_learnings table
CREATE TABLE IF NOT EXISTS book_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by book
CREATE INDEX idx_book_learnings_book_id ON book_learnings(book_id);

-- Enable RLS
ALTER TABLE book_learnings ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as books table)
CREATE POLICY "Users can view their own book learnings"
  ON book_learnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book learnings"
  ON book_learnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book learnings"
  ON book_learnings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book learnings"
  ON book_learnings FOR DELETE
  USING (auth.uid() = user_id);
