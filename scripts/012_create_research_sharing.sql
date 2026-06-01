-- SQL migration to enable case sharing for research purposes
-- Run this in your Supabase SQL Editor.

-- Add is_shared column to public.anesthesia_cases if it does not exist (default to true)
alter table public.anesthesia_cases add column if not exists is_shared boolean not null default true;

-- Update RLS Select Policy for anesthesia_cases
-- Drop the old policy which only allowed selecting own cases
drop policy if exists "cases_select_own" on public.anesthesia_cases;

-- Create the new select policy which allows selecting own cases or any case that is shared
create policy "cases_select_shared" on public.anesthesia_cases
  for select using (auth.uid() = user_id or is_shared = true);

-- Performance Index: Conditional index for fast filtering of shared cases
create index if not exists anesthesia_cases_is_shared_idx on public.anesthesia_cases(is_shared) where is_shared = true;
