-- Create identities table
create table identities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Create index for faster queries by user
create index identities_user_idx on identities(user_id);

-- Enable Row Level Security
alter table identities enable row level security;

-- Policy: Users can only access their own identities
create policy "Users can manage their own identities"
  on identities for all using (auth.uid() = user_id);
