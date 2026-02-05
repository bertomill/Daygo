-- Create crystal_day_logs table for tracking daily completion and notes on Crystal Day items
create table crystal_day_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  item_key text not null,
  completed boolean default false not null,
  note text,
  created_at timestamp with time zone default now() not null,

  -- One log per item per day per user
  unique(user_id, date, item_key)
);

-- Index for fetching all logs for a user on a given date
create index crystal_day_logs_user_date_idx on crystal_day_logs(user_id, date);

-- Enable Row Level Security
alter table crystal_day_logs enable row level security;

-- Policy: Users can only access their own logs
create policy "Users can manage their own crystal day logs"
  on crystal_day_logs for all using (auth.uid() = user_id);
