-- Create pep_talks table for storing daily motivational messages
create table pep_talks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  date date default current_date not null,
  created_at timestamp with time zone default now() not null,
  unique(user_id, date)
);

-- Enable Row Level Security
alter table pep_talks enable row level security;

-- Policy: Users can only access their own pep talks
create policy "Users can manage their own pep talks"
  on pep_talks for all using (auth.uid() = user_id);
