-- DayGo Migration: Add sort_order to enable drag-and-drop reordering
-- Run this in Supabase SQL Editor

-- Add sort_order to habits
ALTER TABLE habits ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order to mantras
ALTER TABLE mantras ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order to journal_prompts
ALTER TABLE journal_prompts ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create indexes for faster ordering queries
CREATE INDEX idx_habits_sort_order ON habits(user_id, sort_order);
CREATE INDEX idx_mantras_sort_order ON mantras(user_id, sort_order);
CREATE INDEX idx_journal_prompts_sort_order ON journal_prompts(user_id, sort_order);
