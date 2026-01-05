-- Add note_type column to distinguish between text and canvas notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'text';

-- Add canvas_data column for storing Excalidraw JSON data
ALTER TABLE notes ADD COLUMN IF NOT EXISTS canvas_data JSONB;

-- Add index for filtering by note type
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
