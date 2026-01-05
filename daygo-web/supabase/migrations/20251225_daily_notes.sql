-- Daily notes for schedule context
create table if not exists daily_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  note text not null default '',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, date)
);

create index if not exists daily_notes_user_date_idx on daily_notes(user_id, date);
alter table daily_notes enable row level security;

create policy "Users can view their own daily notes"
  on daily_notes for select using (auth.uid() = user_id);

create policy "Users can insert their own daily notes"
  on daily_notes for insert with check (auth.uid() = user_id);

create policy "Users can update their own daily notes"
  on daily_notes for update using (auth.uid() = user_id);
