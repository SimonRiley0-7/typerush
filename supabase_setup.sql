-- 1. Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Profiles Security Policies
drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);


-- 2. Create trigger function to automatically populate profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_username text;
  raw_full_name text;
begin
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
  );
  raw_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    'Anonymous Typist'
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, raw_username, raw_full_name)
  on conflict (id) do update
  set username = excluded.username,
      display_name = excluded.display_name;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger binding
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Backfill existing user profiles if they don't exist yet
insert into public.profiles (id, username, display_name)
select 
  id, 
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1) || '_' || substr(id::text, 1, 4)), 
  coalesce(raw_user_meta_data->>'full_name', 'Anonymous Typist')
from auth.users
on conflict (id) do nothing;


-- 4. Create friends table
create table if not exists public.friends (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (sender_id, receiver_id)
);

-- Enable RLS
alter table public.friends enable row level security;

-- Friends Security Policies
drop policy if exists "Allow users to select their own friend rows" on public.friends;
create policy "Allow users to select their own friend rows" on public.friends
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Allow users to insert friend requests" on public.friends;
create policy "Allow users to insert friend requests" on public.friends
  for insert with check (auth.uid() = sender_id);

drop policy if exists "Allow users to update friend requests if they are the receiver" on public.friends;
create policy "Allow users to update friend requests if they are the receiver" on public.friends
  for update using (auth.uid() = receiver_id);

drop policy if exists "Allow users to delete friend requests / unfriend" on public.friends;
create policy "Allow users to delete friend requests / unfriend" on public.friends
  for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);
