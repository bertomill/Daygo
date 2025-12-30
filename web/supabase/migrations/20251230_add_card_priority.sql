-- Add high_priority column to kanban_cards table
alter table kanban_cards add column high_priority boolean default false not null;

-- Create index for filtering high priority cards
create index kanban_cards_high_priority_idx on kanban_cards(high_priority) where high_priority = true;
