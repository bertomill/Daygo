-- Add icon column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT;
