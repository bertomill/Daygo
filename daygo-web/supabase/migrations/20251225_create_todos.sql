-- Create todos table for storing daily to-do items
create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  date date not null,
  completed boolean default false not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Create index for faster queries by user and date
create index todos_user_date_idx on todos(user_id, date);

-- Enable Row Level Security
alter table todos enable row level security;

-- Policy: Users can only access their own todos
create policy "Users can manage their own todos"
  on todos for all using (auth.uid() = user_id);
