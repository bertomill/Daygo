-- Add tags column to kanban_cards table
alter table kanban_cards add column tags text[] default '{}' not null;

-- Create index for tags for faster filtering
create index kanban_cards_tags_idx on kanban_cards using gin(tags);
