-- Add completed_at timestamp to kanban_cards to track when cards are completed
ALTER TABLE kanban_cards
ADD COLUMN completed_at TIMESTAMPTZ;

-- Update existing done cards to have a completed_at timestamp (use updated_at as approximation)
UPDATE kanban_cards
SET completed_at = updated_at
WHERE status = 'done' AND completed_at IS NULL;

-- Create index for efficient date-range queries on completed cards
CREATE INDEX idx_kanban_cards_completed_at ON kanban_cards(user_id, completed_at)
WHERE completed_at IS NOT NULL;
