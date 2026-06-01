-- SQL migration to create OSCE preparation tables
-- Run this in your Supabase SQL Editor.

-- Create osce_stations table
create table if not exists public.osce_stations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null for standard system stations
  title text not null unique,
  category text not null,
  duration_minutes integer not null default 17,
  scenario text not null,
  instructions_participant text not null,
  instructions_examiner text not null,
  rubric jsonb not null default '[]'::jsonb,
  equipment text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create osce_attempts table
create table if not exists public.osce_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null, -- can be uuid or string for default seeded IDs (like 'builtin-obstetric-sc')
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  chat_history jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  feedback text not null,
  total_score integer not null default 0,
  max_score integer not null default 30,
  status text not null default 'completed'
);

-- Enable RLS
alter table public.osce_stations enable row level security;
alter table public.osce_attempts enable row level security;

-- Policies for osce_stations
drop policy if exists "osce_stations_select" on public.osce_stations;
create policy "osce_stations_select" on public.osce_stations
  for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "osce_stations_insert" on public.osce_stations;
create policy "osce_stations_insert" on public.osce_stations
  for insert with check (auth.uid() = user_id);

drop policy if exists "osce_stations_update" on public.osce_stations;
create policy "osce_stations_update" on public.osce_stations
  for update using (auth.uid() = user_id);

drop policy if exists "osce_stations_delete" on public.osce_stations;
create policy "osce_stations_delete" on public.osce_stations
  for delete using (auth.uid() = user_id);

-- Policies for osce_attempts
drop policy if exists "osce_attempts_select" on public.osce_attempts;
create policy "osce_attempts_select" on public.osce_attempts
  for select using (auth.uid() = user_id);

drop policy if exists "osce_attempts_insert" on public.osce_attempts;
create policy "osce_attempts_insert" on public.osce_attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "osce_attempts_delete" on public.osce_attempts;
create policy "osce_attempts_delete" on public.osce_attempts
  for delete using (auth.uid() = user_id);

-- Seed initial OSCE station from the UNDIP Nov 23 Rubric
insert into public.osce_stations (
  id,
  user_id,
  title,
  category,
  duration_minutes,
  scenario,
  instructions_participant,
  instructions_examiner,
  equipment,
  rubric
) values (
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  null,
  'Anestesia Obstetrik – Sectio Caesarea & Appendiktomi Akut',
  'Anestesia Obstetrik',
  17,
  'Seorang perempuan berusia 28 tahun berat badan 75 kg dengan G1P0A0 kehamilan aterm inpartu, letak sungsang, disertai appendicitis akut dengan Tekanan Darah 138/88 mmHg laju nadi 112 x/menit, laju napas 18x/mnt, suhu: 39,2 oC. Pasien akan dilakukan operasi SC cito dan appendiktomi, dengan anestesi spinal.',
  '- Sebutkan problem potensial dan aktual pada pasien ini!\n- Sebutkan persiapan pasien sebelum tindakan Anestesi!\n- Lakukan peragaan/penjelasan tindakan anestesi spinal pada pasien ini!\n- Sebutkan manajemen nyeri pasca anestesi spinal pada pasien ini!',
  'Pastikan identitas peserta ujian. Amati dan berikan skor (0/1/2/3) atas tugas yang dikerjakan peserta ujian serta skor Global Rating sesuai rubrik penilaian.',
  array['Spinal set', 'Nampan alat', 'Duk lobang', 'Spinocain no 25, 26, 27', 'Bupivacaine', 'Lidocaine', 'Sarung tangan steril', 'Masker', 'Plester', 'Antiseptik'],
  '[
    {"aspect": "Diagnosis dan problem aktual - potensial", "weight": 2, "items": ["Problem aktual: Kehamilan, hipertermia, nyeri akut", "Problem potensial: Mual muntah, aspirasi, hipotensi, bradikardia, high spinal block"]},
    {"aspect": "Rencana tindakan anestesi / Persiapan", "weight": 1, "items": ["Pasang IV line nomor besar dan lancar", "Rehidrasi dengan cairan kristaloid", "Puasa / nothing per oral", "Turunkan suhu tubuh", "Pemberian anti-muntah", "Pemberian antibiotik"]},
    {"aspect": "Keterampilan klinis (Spinal Anestesi)", "weight": 3, "items": ["Pasang monitor standar & cek vital sign", "Posisi lateral decubitus kiri / duduk", "Landmark L3-L4 (Tuffier line)", "Cuci tangan & sarung tangan steril", "Aseptik & antiseptik landmark", "Infiltrasi anestesi lokal", "Penusukan jarum spinal sampai keluar LCS", "Masukkan obat spinal bupivacaine perlahan", "Pastikan blok spinal Th 4-6 berjalan baik"]},
    {"aspect": "Manajemen nyeri pasca anestesi", "weight": 3, "items": ["Multimodal analgesi: NSAID, Opioid, Paracetamol"]},
    {"aspect": "Komunikasi dan Perilaku profesional", "weight": 1, "items": ["Melakukan tindakan hati-hati", "Memperhatikan kenyamanan pasien", "Melakukan tindakan sesuai prioritas", "Menunjukkan rasa hormat kepada pasien", "Mengetahui keterbatasan dan melakukan konsultasi jika perlu"]}
  ]'::jsonb
) on conflict (title) do update set
  scenario = excluded.scenario,
  instructions_participant = excluded.instructions_participant,
  rubric = excluded.rubric;
