-- SQL migration to enable Community Hub features (Ratings, Comments & Discussions) for OSCE stations
-- Run this in your Supabase SQL Editor.

-- 1. Add creator_email column to osce_stations if not exists
alter table public.osce_stations add column if not exists creator_email text;

-- 2. Create osce_ratings table
create table if not exists public.osce_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id uuid not null references public.osce_stations(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  unique (user_id, station_id)
);

-- 3. Create osce_comments table
create table if not exists public.osce_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  station_id uuid not null references public.osce_stations(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

-- 4. Enable Row-Level Security
alter table public.osce_ratings enable row level security;
alter table public.osce_comments enable row level security;

-- 5. RLS Policies for osce_ratings
drop policy if exists "ratings_select_public" on public.osce_ratings;
create policy "ratings_select_public" on public.osce_ratings
  for select using (true);

drop policy if exists "ratings_insert_own" on public.osce_ratings;
create policy "ratings_insert_own" on public.osce_ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.osce_ratings;
create policy "ratings_update_own" on public.osce_ratings
  for update using (auth.uid() = user_id);

drop policy if exists "ratings_delete_own" on public.osce_ratings;
create policy "ratings_delete_own" on public.osce_ratings
  for delete using (auth.uid() = user_id);

-- 6. RLS Policies for osce_comments
drop policy if exists "comments_select_public" on public.osce_comments;
create policy "comments_select_public" on public.osce_comments
  for select using (true);

drop policy if exists "comments_insert_own" on public.osce_comments;
create policy "comments_insert_own" on public.osce_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.osce_comments;
create policy "comments_delete_own" on public.osce_comments
  for delete using (auth.uid() = user_id);

-- 7. Update select policy of public.osce_stations to let everyone view them
drop policy if exists "osce_stations_select" on public.osce_stations;
create policy "osce_stations_select" on public.osce_stations
  for select using (true);

-- 8. Performance Indexes
create index if not exists osce_ratings_station_id_idx on public.osce_ratings(station_id);
create index if not exists osce_comments_station_id_idx on public.osce_comments(station_id);
create index if not exists osce_comments_created_at_idx on public.osce_comments(created_at desc);
