-- Create kanban_time_entries table for tracking time spent on cards
create table kanban_time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references kanban_cards(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- Create indexes for faster queries
create index kanban_time_entries_user_idx on kanban_time_entries(user_id);
create index kanban_time_entries_card_idx on kanban_time_entries(card_id);
create index kanban_time_entries_start_time_idx on kanban_time_entries(start_time);

-- Enable RLS
alter table kanban_time_entries enable row level security;

-- Policy: Users can manage their own time entries
create policy "Users can manage their own kanban time entries"
  on kanban_time_entries for all using (auth.uid() = user_id);
