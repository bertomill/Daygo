-- Add tags column to notes table
alter table notes add column tags text[] default '{}' not null;

-- Create index for tags for faster filtering
create index notes_tags_idx on notes using gin(tags);
