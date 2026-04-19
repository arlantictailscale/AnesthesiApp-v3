-- Idempotent version of the anesthesia_cases migration.
-- Safe to run multiple times.

create extension if not exists "pgcrypto";

create table if not exists public.anesthesia_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Step 1: General & patient details
  procedure_date date not null,
  patient_name text not null,
  sex text not null check (sex in ('Male','Female')),
  age int not null,
  medical_record_number text not null,
  room text not null,
  weight_kg numeric not null,
  height_cm numeric not null,
  bmi numeric,

  -- Step 2: Clinical assessment
  diagnosis text not null,
  procedure_intervention text not null,
  allergy text,
  medication text,
  past_illness text,
  last_meal text,
  event text,

  -- Step 3: Objective examination (B1-B6)
  b1_breathing text,
  b2_blood text,
  b3_brain text,
  b4_bladder text,
  b5_bowel text,
  b6_body_temp text,
  others text,

  -- Step 4: Investigations & planning
  inv_laboratory jsonb default '{"enabled":false,"result":""}'::jsonb,
  inv_xray jsonb default '{"enabled":false,"result":""}'::jsonb,
  inv_ecg jsonb default '{"enabled":false,"result":""}'::jsonb,
  inv_ct jsonb default '{"enabled":false,"result":""}'::jsonb,
  inv_mri jsonb default '{"enabled":false,"result":""}'::jsonb,
  inv_other_label text,
  inv_other_result text,
  assessment text,
  planning text,

  -- Step 5: Anesthesia management
  anesthesia_management text,
  regimen_pre_induction text,
  regimen_induction text,
  regimen_maintenance text,
  analgesia_pre_op text,
  analgesia_intra_op text,
  analgesia_post_op text,

  -- Step 6: Intra-operative monitoring
  post_induction_side_effects text,
  ventilator_settings text,
  hemodynamics_intra text,
  duration_surgery text,
  bleeding text,
  transfusion text,
  urine_output text,
  fluid_balance text,

  -- Step 7: Post-operative
  post_op_room text check (post_op_room in ('Low Care','High Care','ICU')),
  hemodynamics_post text,
  lab_results_post text
);

-- Row-level security
alter table public.anesthesia_cases enable row level security;

drop policy if exists "cases_select_own" on public.anesthesia_cases;
create policy "cases_select_own"
  on public.anesthesia_cases for select
  using (auth.uid() = user_id);

drop policy if exists "cases_insert_own" on public.anesthesia_cases;
create policy "cases_insert_own"
  on public.anesthesia_cases for insert
  with check (auth.uid() = user_id);

drop policy if exists "cases_update_own" on public.anesthesia_cases;
create policy "cases_update_own"
  on public.anesthesia_cases for update
  using (auth.uid() = user_id);

drop policy if exists "cases_delete_own" on public.anesthesia_cases;
create policy "cases_delete_own"
  on public.anesthesia_cases for delete
  using (auth.uid() = user_id);

create index if not exists anesthesia_cases_user_id_idx on public.anesthesia_cases(user_id);
create index if not exists anesthesia_cases_created_at_idx on public.anesthesia_cases(created_at desc);
