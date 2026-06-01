-- SQL migration to update anesthesia_guidelines for multiple files and images
-- Run this in your Supabase SQL Editor.

-- Drop columns file_url and image_url if they exist
alter table public.anesthesia_guidelines drop column if exists file_url;
alter table public.anesthesia_guidelines drop column if exists image_url;

-- Add new JSONB columns for multiple URLs
alter table public.anesthesia_guidelines add column if not exists file_urls jsonb not null default '[]'::jsonb;
alter table public.anesthesia_guidelines add column if not exists image_urls jsonb not null default '[]'::jsonb;
