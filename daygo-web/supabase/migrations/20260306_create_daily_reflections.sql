-- Daily reflections: "Did I live out the best possible day?"
create table if not exists daily_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  answer boolean not null,
  reason text not null default '',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, date)
);

create index if not exists daily_reflections_user_date_idx on daily_reflections(user_id, date);
alter table daily_reflections enable row level security;

create policy "Users can view their own daily reflections"
  on daily_reflections for select using (auth.uid() = user_id);

create policy "Users can insert their own daily reflections"
  on daily_reflections for insert with check (auth.uid() = user_id);

create policy "Users can update their own daily reflections"
  on daily_reflections for update using (auth.uid() = user_id);
