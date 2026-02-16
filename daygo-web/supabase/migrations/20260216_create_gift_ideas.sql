-- Gift ideas table
create table if not exists gift_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient text not null default 'Katie',
  idea text not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table gift_ideas enable row level security;

create policy "Users can manage their own gift ideas"
  on gift_ideas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index
create index gift_ideas_user_id_idx on gift_ideas(user_id);
