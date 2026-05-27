-- SQL migration to add update policy for cbt_packages
-- Run this in your Supabase SQL Editor to allow authenticated users to update their own packages.

create policy "packages_update_own" on public.cbt_packages
  for update using (auth.uid() = user_id);
