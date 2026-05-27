-- Create a storage bucket for CBT question images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('cbt-images', 'cbt-images', true)
on conflict (id) do nothing;

-- Set up Row-Level Security (RLS) policies for storage.objects on the cbt-images bucket
-- Note: Supabase enables RLS on storage.objects by default.

-- Policy 1: Allow anyone to view images
create policy "Allow public read access to cbt-images"
on storage.objects for select
to public
using (bucket_id = 'cbt-images');

-- Policy 2: Allow authenticated users to upload/insert images
create policy "Allow authenticated uploads to cbt-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cbt-images');

-- Policy 3: Allow authenticated users to update their uploaded images
create policy "Allow authenticated updates to cbt-images"
on storage.objects for update
to authenticated
using (bucket_id = 'cbt-images');

-- Policy 4: Allow authenticated users to delete their uploaded images
create policy "Allow authenticated deletes from cbt-images"
on storage.objects for delete
to authenticated
using (bucket_id = 'cbt-images');
