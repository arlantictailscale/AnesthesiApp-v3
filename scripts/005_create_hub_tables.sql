-- SQL migration to enable Hub features (Ratings, Comments & Discussions) for CBT packages
-- Run this in your Supabase SQL Editor.

-- 1. Add creator_email column to cbt_packages if not exists
alter table public.cbt_packages add column if not exists creator_email text;

-- 2. Create cbt_ratings table
create table if not exists public.cbt_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.cbt_packages(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  unique (user_id, package_id)
);

-- 3. Create cbt_comments table
create table if not exists public.cbt_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  package_id text not null references public.cbt_packages(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

-- 4. Enable Row-Level Security
alter table public.cbt_ratings enable row level security;
alter table public.cbt_comments enable row level security;

-- 5. RLS Policies for cbt_ratings
create policy "ratings_select_public" on public.cbt_ratings
  for select using (true);

create policy "ratings_insert_own" on public.cbt_ratings
  for insert with check (auth.uid() = user_id);

create policy "ratings_update_own" on public.cbt_ratings
  for update using (auth.uid() = user_id);

create policy "ratings_delete_own" on public.cbt_ratings
  for delete using (auth.uid() = user_id);

-- 6. RLS Policies for cbt_comments
create policy "comments_select_public" on public.cbt_comments
  for select using (true);

create policy "comments_insert_own" on public.cbt_comments
  for insert with check (auth.uid() = user_id);

create policy "comments_delete_own" on public.cbt_comments
  for delete using (auth.uid() = user_id);

-- 7. Performance Indexes
create index if not exists cbt_ratings_package_id_idx on public.cbt_ratings(package_id);
create index if not exists cbt_comments_package_id_idx on public.cbt_comments(package_id);
create index if not exists cbt_comments_created_at_idx on public.cbt_comments(created_at desc);
