-- 1. Create is_admin helper function if it doesn't exist
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Update cbt_packages RLS update policy
drop policy if exists "packages_update_own" on public.cbt_packages;
create policy "packages_update_own" on public.cbt_packages
  for update using (auth.uid() = user_id or public.is_admin());

-- 3. Update cbt_packages RLS delete policy
drop policy if exists "packages_delete_own" on public.cbt_packages;
create policy "packages_delete_own" on public.cbt_packages
  for delete using (auth.uid() = user_id or public.is_admin());

-- 4. Update cbt_packages RLS insert policy
drop policy if exists "packages_insert_own" on public.cbt_packages;
create policy "packages_insert_own" on public.cbt_packages
  for insert with check (auth.uid() = user_id or public.is_admin());

-- 5. Update osce_stations RLS update policy
drop policy if exists "osce_stations_update" on public.osce_stations;
create policy "osce_stations_update" on public.osce_stations
  for update using (auth.uid() = user_id or public.is_admin());

-- 6. Update osce_stations RLS delete policy
drop policy if exists "osce_stations_delete" on public.osce_stations;
create policy "osce_stations_delete" on public.osce_stations
  for delete using (auth.uid() = user_id or public.is_admin());

-- 7. Update osce_stations RLS insert policy
drop policy if exists "osce_stations_insert" on public.osce_stations;
create policy "osce_stations_insert" on public.osce_stations
  for insert with check (auth.uid() = user_id or public.is_admin());
