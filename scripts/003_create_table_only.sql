-- Minimal table creation, split out to diagnose migration errors
create table if not exists public.anesthesia_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Step 1: General
  operation_date date,
  time_start time,
  time_end time,
  surgery_duration integer,
  recovery_time integer,
  room text,
  patient_name text not null,
  mrn text,
  age integer,
  sex text,
  weight numeric,
  height numeric,
  bmi numeric,

  -- Step 2: Clinical assessment
  diagnosis text,
  subjective text,

  -- Step 3: Objective (B1-B6)
  b1_breathing text,
  b2_blood text,
  b3_brain text,
  b4_bladder_bowel text,
  b5_bone text,
  b6_blood_sugar text,

  -- Step 4: Investigations
  investigations jsonb default '{}'::jsonb,

  -- Step 5: Anesthesia management
  anesthesia_plan text,
  analgesia_plan text,

  -- Step 6: Intra-operative
  monitoring jsonb default '{}'::jsonb,
  intraop_notes text,

  -- Step 7: Post-op
  postop_destination text,
  postop_notes text,
  complications text,

  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anesthesia_cases enable row level security;
