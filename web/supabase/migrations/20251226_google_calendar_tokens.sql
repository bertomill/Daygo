-- Store Google Calendar OAuth tokens for users
create table google_calendar_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text not null,
  token_expiry timestamp with time zone not null,
  calendar_id text default 'primary',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create index for faster queries by user
create index google_calendar_tokens_user_idx on google_calendar_tokens(user_id);

-- Enable Row Level Security
alter table google_calendar_tokens enable row level security;

-- Policy: Users can only access their own tokens
create policy "Users can manage their own Google Calendar tokens"
  on google_calendar_tokens for all using (auth.uid() = user_id);
