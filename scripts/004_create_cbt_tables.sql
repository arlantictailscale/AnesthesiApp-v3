-- SQL script to create tables for the Anesthesiologist CBT Prep Portal
-- Run this script in the Supabase SQL Editor to enable database storage for packages and attempts.

-- cbt_packages table
create table if not exists public.cbt_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  questions jsonb not null -- Stores the 100-question package array directly for efficient serialization and fast Next.js loading
);

-- cbt_attempts table
create table if not exists public.cbt_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null,
  score numeric not null,
  total_questions int not null,
  correct_count int not null,
  time_spent int not null, -- duration in seconds
  answers jsonb not null, -- maps question index (as string keys) to the selected option
  created_at timestamptz not null default now()
);

-- Enable Row-Level Security
alter table public.cbt_packages enable row level security;
alter table public.cbt_attempts enable row level security;

-- Row-Level Security Policies for cbt_packages
-- 1. Anyone can view packages (both built-in shared ones and custom shared ones)
create policy "packages_select_public" on public.cbt_packages
  for select using (true);

-- 2. Authenticated users can insert their own custom packages
create policy "packages_insert_own" on public.cbt_packages
  for insert with check (auth.uid() = user_id);

-- 3. Authenticated users can delete only their own custom packages
create policy "packages_delete_own" on public.cbt_packages
  for delete using (auth.uid() = user_id);

-- Row-Level Security Policies for cbt_attempts
-- 1. Users can only select/view their own attempts
create policy "attempts_select_own" on public.cbt_attempts
  for select using (auth.uid() = user_id);

-- 2. Users can only insert attempts that belong to themselves
create policy "attempts_insert_own" on public.cbt_attempts
  for insert with check (auth.uid() = user_id);

-- 3. Users can only delete their own attempts
create policy "attempts_delete_own" on public.cbt_attempts
  for delete using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists cbt_packages_user_id_idx on public.cbt_packages(user_id);
create index if not exists cbt_attempts_user_id_idx on public.cbt_attempts(user_id);
create index if not exists cbt_attempts_package_id_idx on public.cbt_attempts(package_id);
create index if not exists cbt_attempts_created_at_idx on public.cbt_attempts(created_at desc);
