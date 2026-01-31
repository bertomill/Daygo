-- Create books table for tracking reading progress
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  is_reading BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);

-- Create index for filtering currently reading vs completed
CREATE INDEX IF NOT EXISTS idx_books_is_reading ON books(user_id, is_reading);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON books
  FOR DELETE USING (auth.uid() = user_id);
