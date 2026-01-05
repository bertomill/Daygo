-- Add description column to kanban_columns table
alter table kanban_columns add column description text default '' not null;
