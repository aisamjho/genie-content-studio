-- Geenie AI Studio — complete database schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Profiles table — one row per user, created on sign up
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  plan text not null default 'starter' check (plan in ('starter', 'creator', 'studio')),
  anime_count integer not null default 0,
  cartoon_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security — users can only see/edit their own row
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Auto-create profile on sign up via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Increment count function (atomic, prevents race conditions)
create or replace function public.increment_count(user_id uuid, field_name text)
returns integer as $$
declare
  new_count integer;
begin
  if field_name = 'anime_count' then
    update public.profiles
    set anime_count = anime_count + 1, updated_at = now()
    where id = user_id
    returning anime_count into new_count;
  elsif field_name = 'cartoon_count' then
    update public.profiles
    set cartoon_count = cartoon_count + 1, updated_at = now()
    where id = user_id
    returning cartoon_count into new_count;
  end if;
  return coalesce(new_count, 0);
end;
$$ language plpgsql security definer;

-- 5. Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
