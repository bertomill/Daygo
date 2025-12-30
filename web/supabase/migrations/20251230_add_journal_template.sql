-- Add template_text column to journal_prompts table
ALTER TABLE journal_prompts
ADD COLUMN template_text text;

-- Add comment to explain the column
COMMENT ON COLUMN journal_prompts.template_text IS 'Optional preset text that pre-fills new journal entries to provide structure';
