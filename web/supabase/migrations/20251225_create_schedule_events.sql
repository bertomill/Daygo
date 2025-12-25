-- Create schedule_events table for storing daily schedule items
create table schedule_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  created_at timestamp with time zone default now() not null,

  -- Ensure end_time is after start_time
  constraint valid_time_range check (end_time > start_time)
);

-- Create index for faster queries by user and date
create index schedule_events_user_date_idx on schedule_events(user_id, date);

-- Create index for ordering by start time
create index schedule_events_start_time_idx on schedule_events(start_time);

-- Enable Row Level Security
alter table schedule_events enable row level security;

-- Policy: Users can only access their own schedule events
create policy "Users can manage their own schedule events"
  on schedule_events for all using (auth.uid() = user_id);
