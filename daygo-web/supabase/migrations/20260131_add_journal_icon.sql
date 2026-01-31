-- Add icon and color columns to journal_prompts table
ALTER TABLE journal_prompts ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE journal_prompts ADD COLUMN IF NOT EXISTS color text;
