-- Allow admins to see attempts of other users

-- 1. Update cbt_attempts select policy
drop policy if exists "attempts_select_own" on public.cbt_attempts;
create policy "attempts_select_own" on public.cbt_attempts
  for select using (auth.uid() = user_id or public.is_admin());

-- 2. Update osce_attempts select policy
drop policy if exists "osce_attempts_select" on public.osce_attempts;
create policy "osce_attempts_select" on public.osce_attempts
  for select using (auth.uid() = user_id or public.is_admin());
