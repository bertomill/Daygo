-- Add priority field to kanban_cards (1-5 scale)
alter table kanban_cards add column priority integer;

-- Add constraint to ensure priority is between 1 and 5 (or null)
alter table kanban_cards add constraint valid_priority
  check (priority is null or (priority >= 1 and priority <= 5));

-- Create index for priority-based queries
create index kanban_cards_priority_idx on kanban_cards(priority);
