-- User scheduling preferences table
create table if not exists user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  wake_time time default '07:00:00' not null,
  bed_time time default '22:00:00' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists user_preferences_user_idx on user_preferences(user_id);
alter table user_preferences enable row level security;

create policy "Users can view their own preferences"
  on user_preferences for select using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on user_preferences for update using (auth.uid() = user_id);
