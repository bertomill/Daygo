-- Create kanban_columns table for life area columns
create table kanban_columns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  color text default '#3b82f6' not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Create index for faster queries
create index kanban_columns_user_idx on kanban_columns(user_id);

-- Enable RLS
alter table kanban_columns enable row level security;

-- Policy: Users can manage their own columns
create policy "Users can manage their own kanban columns"
  on kanban_columns for all using (auth.uid() = user_id);

-- Create kanban_cards table
create table kanban_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  column_id uuid references kanban_columns(id) on delete cascade not null,
  title text not null,
  description text default '' not null,
  status text default 'todo' not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  -- Constraint to ensure valid status values
  constraint valid_status check (status in ('todo', 'in_progress', 'done'))
);

-- Create indexes
create index kanban_cards_user_idx on kanban_cards(user_id);
create index kanban_cards_column_status_idx on kanban_cards(column_id, status);

-- Enable RLS
alter table kanban_cards enable row level security;

-- Policy: Users can manage their own cards
create policy "Users can manage their own kanban cards"
  on kanban_cards for all using (auth.uid() = user_id);

-- Create kanban_subtasks table for checklist items
create table kanban_subtasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references kanban_cards(id) on delete cascade not null,
  text text not null,
  completed boolean default false not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Create index
create index kanban_subtasks_card_idx on kanban_subtasks(card_id);

-- Enable RLS
alter table kanban_subtasks enable row level security;

-- Policy: Users can manage their own subtasks
create policy "Users can manage their own kanban subtasks"
  on kanban_subtasks for all using (auth.uid() = user_id);

-- Create kanban_goal_links junction table (follows habit_goal_links pattern)
create table kanban_goal_links (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references kanban_cards(id) on delete cascade not null,
  goal_id uuid references goals(id) on delete cascade not null,

  -- Unique constraint: each card can only link to a goal once
  unique(card_id, goal_id)
);

-- Create indexes
create index kanban_goal_links_card_idx on kanban_goal_links(card_id);
create index kanban_goal_links_goal_idx on kanban_goal_links(goal_id);

-- Enable RLS
alter table kanban_goal_links enable row level security;

-- Policy: Users can manage their own kanban-goal links
create policy "Users can manage their own kanban goal links"
  on kanban_goal_links for all
  using (
    exists (
      select 1 from kanban_cards
      where kanban_cards.id = card_id
      and kanban_cards.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function update_kanban_cards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_kanban_cards_updated_at
  before update on kanban_cards
  for each row
  execute function update_kanban_cards_updated_at();
