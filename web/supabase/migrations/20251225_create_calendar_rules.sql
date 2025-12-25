-- Calendar rules table for storing AI-powered scheduling rules
create table calendar_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  rule_text text not null,
  is_active boolean default true not null,
  priority integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Create index for faster queries by user
create index calendar_rules_user_idx on calendar_rules(user_id);

-- Enable Row Level Security
alter table calendar_rules enable row level security;

-- Policy: Users can only access their own calendar rules
create policy "Users can manage their own calendar rules"
  on calendar_rules for all using (auth.uid() = user_id);

-- Add is_ai_generated column to schedule_events to distinguish AI-created events
alter table schedule_events add column is_ai_generated boolean default false not null;
