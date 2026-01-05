-- Add screenshot field to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
