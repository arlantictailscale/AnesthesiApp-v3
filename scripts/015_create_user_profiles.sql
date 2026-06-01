-- Create public.profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  title_role text,
  department text,
  bio text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Allow public read access to profiles"
  on public.profiles for select
  using ( true );

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Allow users to update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Create trigger function with error safety to prevent registration failures
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'Could not create profile for user %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for all existing users
insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do nothing;

-- Create avatars storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage RLS Policies for avatars bucket
-- Note: split_part(name, '/', 1) matches the user's ID folder in the path (e.g. avatars/<user_id>/avatar.png)

create policy "Allow public read access to avatars"
  on storage.objects for select
  to public
  using ( bucket_id = 'avatars' );

create policy "Allow users to upload avatars in their own directory"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' and auth.uid()::text = split_part(name, '/', 1) );

create policy "Allow users to update avatars in their own directory"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' and auth.uid()::text = split_part(name, '/', 1) );

create policy "Allow users to delete avatars in their own directory"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' and auth.uid()::text = split_part(name, '/', 1) );
