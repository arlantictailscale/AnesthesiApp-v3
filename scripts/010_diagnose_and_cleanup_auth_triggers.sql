-- Diagnose and clean up leftover triggers/functions on auth.users that can
-- cause Supabase signups to fail with "Database error finding user" or
-- "Database error saving new user".
--
-- Run this in your Supabase SQL editor (or via the v0 script runner if the
-- Supabase integration is connected).
--
-- It is safe to run multiple times. It only drops objects that exist.

-- 1. List any triggers currently attached to auth.users so you can see what's there.
--    (Look at the output in the SQL editor.)
select tgname as trigger_name,
       pg_get_triggerdef(oid) as trigger_definition
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;

-- 2. Drop the most common culprit: a handle_new_user trigger inserting into
--    public.profiles (or anywhere) that no longer exists or is blocked by RLS.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;

-- 3. Drop the backing function if present.
drop function if exists public.handle_new_user() cascade;

-- 4. (Optional) If you saw other custom triggers in step 1 that you don't need,
--    drop them the same way:
--    drop trigger if exists <trigger_name> on auth.users;

-- 5. Verify nothing remains (this should return 0 rows if all custom triggers
--    were removed).
select tgname
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;
