-- SQL migration to create the Anesthesia Guidelines Library table and storage bucket
-- Run this in your Supabase SQL Editor.

create table if not exists public.anesthesia_guidelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null for standard system guidelines
  title text not null unique,
  organization text not null,
  category text not null,
  summary text not null,
  full_content text not null, -- markdown supported
  file_url text, -- PDF file path in storage
  image_url text, -- chart or algorithm image path in storage
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security on the guidelines table
alter table public.anesthesia_guidelines enable row level security;

-- Table RLS Policies
-- 1. Anyone can read standard guidelines (user_id IS NULL) and their own custom guidelines
create policy "guidelines_select_policy" on public.anesthesia_guidelines
  for select using (user_id is null or auth.uid() = user_id);

-- 2. Authenticated users can insert their own custom guidelines
create policy "guidelines_insert_policy" on public.anesthesia_guidelines
  for insert with check (auth.uid() = user_id);

-- 3. Authenticated users can update their own custom guidelines
create policy "guidelines_update_policy" on public.anesthesia_guidelines
  for update using (auth.uid() = user_id);

-- 4. Authenticated users can delete their own custom guidelines
create policy "guidelines_delete_policy" on public.anesthesia_guidelines
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists anesthesia_guidelines_user_id_idx on public.anesthesia_guidelines(user_id);
create index if not exists anesthesia_guidelines_title_idx on public.anesthesia_guidelines(title);

-- --- Storage Bucket Configuration ---

-- Create the guideline-files bucket
insert into storage.buckets (id, name, public)
values ('guideline-files', 'guideline-files', true)
on conflict (id) do nothing;

-- Storage RLS Policies
-- 1. Allow public read access to guideline-files objects
create policy "Allow public read access to guideline-files"
on storage.objects for select
to public
using (bucket_id = 'guideline-files');

-- 2. Allow authenticated users to upload/insert files
create policy "Allow authenticated uploads to guideline-files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'guideline-files');

-- 3. Allow authenticated users to update their files
create policy "Allow authenticated updates to guideline-files"
on storage.objects for update
to authenticated
using (bucket_id = 'guideline-files');

-- 4. Allow authenticated users to delete their files
create policy "Allow authenticated deletes from guideline-files"
on storage.objects for delete
to authenticated
using (bucket_id = 'guideline-files');


-- --- Seed Initial Guidelines ---
insert into public.anesthesia_guidelines (
  title, organization, category, summary, full_content
) values 
(
  'ASA Difficult Airway Algorithm (2022)',
  'ASA',
  'Airway Management',
  'The American Society of Anesthesiologists practice guidelines for management of the difficult airway. Focuses on pre-planned strategies for anticipated and unanticipated difficult airways, highlighting the distinction between awake intubation and intubation after induction of anesthesia.',
  '### Key Clinical Recommendations:

1. **Pre-Anesthetic Airway Evaluation**:
   - Assess physical characteristics (Mallampati score, thyromental distance, mouth opening, neck mobility, presence of beard).
   - Review clinical history of airway management.

2. **Preparation for Difficult Airway Management**:
   - Check that difficult airway equipment is immediately available (videolaryngoscopes, fiberoptic scopes, supraglottic airways (SGA), surgical airway kits).
   - Ensure a helper is present or immediately available.
   - Pre-oxygenate with 100% O2 by face mask.

3. **Awake Intubation Strategy**:
   - **Indication**: Strongly consider awake intubation if there is anticipated difficult intubation AND one or more of: difficult mask ventilation, difficult SGA placement, or high risk of aspiration.
   - **Technique**: Flexible fiberoptic bronchoscope (default), videolaryngoscopy, or retrograde intubation under local anesthesia/sedation.

4. **Unanticipated Difficult Airway (Post-Induction)**:
   - **Limit Attempts**: Restrict the number of tracheal intubation attempts to a maximum of 3 + 1 additional attempt by an experienced colleague to prevent airway trauma, bleeding, and edema.
   - **Face Mask Ventilation**: If intubation fails, prioritize face mask ventilation. Use oral/nasal airways and two-handed technique.
   - **Supraglottic Airway (SGA)**: If mask ventilation is inadequate, insert an SGA (e.g., LMA, Supreme) to establish ventilation.
   - **Emergency Pathway (Cannot Intubate, Cannot Ventilate - CICV)**:
     - If both face mask ventilation and SGA fail to maintain oxygenation:
     - Declare a **CICV Emergency**.
     - Perform emergency invasive airway access immediately (cricothyroidotomy, scalpel-bougie technique, or jet ventilation).'
),
(
  'AHA ACLS Cardiac Arrest Algorithm (2020)',
  'AHA',
  'Emergency Protocols',
  'Advanced Cardiovascular Life Support guidelines for adult cardiac arrest. Covers cardiopulmonary resuscitation (CPR) and pharmaceutical interventions for shockable (VF/pVT) and non-shockable (Asystole/PEA) rhythms.',
  '### Core Guidelines:

#### 1. High-Quality CPR:
- Push hard (at least 2 inches / 5 cm) and fast (100–120 bpm) and allow complete chest recoil.
- Minimize interruptions in compressions (pause <10s for rhythm check).
- Avoid excessive ventilation (target 10 breaths/min or 1 breath every 6 seconds with advanced airway).
- Rotate compressor every 2 minutes or sooner if fatigued.
- Monitor quantitative waveform capnography (PETCO2). If PETCO2 < 10 mmHg, attempt to improve CPR quality.

#### 2. Shockable Rhythms (Ventricular Fibrillation / Pulseless VT):
- **Shock**: Deliver 1 unsynchronized defibrillation shock (biphasic 120-200 J; monophasic 360 J).
- **CPR**: Start chest compressions immediately for 2 minutes. Establish IV or IO access.
- **Rhythm Check**: If still shockable:
  - Deliver **Shock #2** + CPR 2 mins + **Epinephrine 1 mg IV/IO every 3–5 minutes**.
- **Rhythm Check**: If still shockable:
  - Deliver **Shock #3** + CPR 2 mins + **Amiodarone 300 mg IV/IO** (or Lidocaine 1–1.5 mg/kg IV/IO).
  - Second Amiodarone dose: 150 mg IV/IO (or Lidocaine 0.5–0.75 mg/kg).

#### 3. Non-Shockable Rhythms (Asystole / Pulseless Electrical Activity):
- **Epinephrine ASAP**: Administer Epinephrine 1 mg IV/IO immediately.
- **CPR**: Continue high-quality CPR for 2 minutes. Consider advanced airway and capnography.
- **Rhythm Check**:
  - If shockable: Transition to shockable rhythm pathway.
  - If non-shockable: Continue CPR for 2 minutes and treat reversible causes (**H''s and T''s**).

#### 4. Reversible Causes (H''s & T''s):
- **H''s**: Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo-/Hyperkalemia, Hypothermia.
- **T''s**: Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (pulmonary), Thrombosis (coronary).'
),
(
  'Malignant Hyperthermia Emergency Protocol',
  'MHAUS',
  'Emergency Protocols',
  'Step-by-step emergency response guidelines for managing a Malignant Hyperthermia (MH) crisis in the operating room. Triggered by volatile anesthetics (halothane, isoflurane, sevoflurane, desflurane) and depolarizing muscle relaxants (succinylcholine).',
  '### Diagnostic Indicators:
- Unexplained rise in end-tidal CO2 (hypercarbia) - *earliest and most sensitive sign*.
- Unexplained tachycardia, tachypnea, and cardiac arrhythmias.
- Masseter muscle rigidity (jaw locking) following succinylcholine.
- Generalized muscle rigidity.
- Rapidly rising core body temperature (hyperthermia - *often a late sign, can rise 1-2°C every 5 mins*).
- Respiratory and metabolic acidosis.
- Hyperkalemia, myoglobinuria, and elevated CK levels.

### Immediate Action Checklist:

1. **Stop Anesthetic Triggers**:
   - Immediately discontinue volatile inhalational agents and succinylcholine.
   - Switch to Total Intravenous Anesthesia (TIVA) using Propofol.
   - Flush the anesthesia machine with 100% Oxygen at high flows (>= 10 L/min).
   - Use clean charcoal filters (Vapor-Clean) on the inspiratory and expiratory limbs if available.

2. **Call for Help & Prepare Dantrolene**:
   - Declare an MH crisis. Get the MH emergency cart containing Dantrolene and cooling supplies.
   - Call the MHAUS Hotline for assistance if needed.

3. **Administer Dantrolene / Ryanodex**:
   - **Dantrolene Sodium (Dantrium/Revonto)**:
     - Dose: 2.5 mg/kg IV push.
     - Reconstitution: Mix each 20 mg vial with 60 mL sterile water (without bacteriostatic agent). Shake vigorously until clear.
   - **Ryanodex (suspension formulation)**:
     - Dose: 2.5 mg/kg IV push.
     - Reconstitution: Mix each 250 mg vial with 5 mL sterile water. Dissolves in less than 20 seconds.
   - Repeat dose as necessary until physiological symptoms stabilize (hypercarbia, rigidity, tachycardia subside). Doses up to 10 mg/kg or more may be required.

4. **Cooling Protocols**:
   - Initiate cooling if temperature is > 38.5°C or rising rapidly.
   - Administer cold intravenous normal saline (15 mL/kg over 20 mins).
   - Lavage open body cavities, nasogastric tube, or bladder with cold saline.
   - Apply ice packs to groin, axilla, and neck.
   - **Important**: Stop active cooling once core temperature drops to 38.0°C to prevent hypothermia.

5. **Treat Hyperkalemia**:
   - Give Regular Insulin (10 units IV) and Dextrose 50% (50 mL IV).
   - Administer Sodium Bicarbonate (1-2 mEq/kg IV) to treat acidosis and shift potassium intracellularly.
   - Give Calcium Chloride (10 mg/kg IV) or Calcium Gluconate (30 mg/kg IV) to stabilize cardiac membranes if hyperkalemia is severe.

6. **Treat Cardiac Arrhythmias**:
   - Use standard antiarrhythmics (amiodarone, beta-blockers, or lidocaine) if needed.
   - **Contraindicated**: *Do NOT administer Calcium Channel Blockers (e.g., verapamil, diltiazem) to patients receiving dantrolene*, as this can cause hyperkalemia and myocardial depression.'
),
(
  'ASRA Local Anesthetic Systemic Toxicity (LAST) Protocol',
  'ASRA',
  'Emergency Protocols',
  'The American Society of Regional Anesthesia and Pain Medicine guidelines for managing Local Anesthetic Systemic Toxicity. Highlights airway management, seizure control, and Lipid Emulsion Therapy (Intralipid).',
  '### Clinical Presentation:
- **Central Nervous System (CNS) Signs**: 
  - Prodromal: Metallic taste, tinnitus, circumoral numbness, lightheadedness, slurred speech.
  - Excitation: Agitation, muscular twitching, tonic-clonic seizures.
  - Depression: Coma, respiratory depression, apnea.
- **Cardiovascular (CV) Signs**:
  - Excitation: Hypertension, tachycardia (rare, transient).
  - Depression: Bradycardia, conduction blocks, hypotension, ventricular arrhythmias, asystole.

### Emergency Management Steps:

1. **Airway Management (Critical First Step)**:
   - Ventilate with 100% Oxygen. Ensure adequate oxygenation and ventilation.
   - Hyperventilate slightly: preventing hypoxia, hypercarbia, and acidosis is vital because respiratory acidosis increases the fraction of free local anesthetic and worsens toxicity.

2. **Seizure Control**:
   - Administer Benzodiazepines (e.g., Midazolam 1–2 mg IV) as first-line therapy.
   - Propofol can be used in low doses, but avoid higher doses as it causes cardiovascular depression.
   - If seizures are refractory, consider succinylcholine or another paralytic to stop muscular contractions.

3. **Lipid Emulsion Therapy (20% Intralipid)**:
   - *Initiate at the first sign of serious toxicity (seizures, arrhythmia, hemodynamic instability)*.
   - **Bolus**: Administer 1.5 mL/kg IV over 1 minute (approx. 100 mL for a 70 kg adult).
   - **Infusion**: Start a continuous infusion at 0.25 mL/kg/min (approx. 18 mL/min or 1000 mL/hr).
   - **If hemodynamics remain unstable**:
     - Repeat bolus once or twice (separated by 3-5 mins).
     - Double the infusion rate to 0.5 mL/kg/min.
   - Continue infusion for at least 10 minutes after hemodynamic stability is restored.
   - **Maximum Limit**: Approximately 12 mL/kg over the first 30 minutes.

4. **Cardiovascular Resuscitation Modifications**:
   - If cardiac arrest occurs, proceed with ACLS with modifications:
     - **Epinephrine**: Use small, titrated doses (< 1 mcg/kg or 10-100 mcg boluses). Avoid large 1 mg boluses as high epinephrine impairs resuscitation and reduces lipid efficacy.
     - **Meds to Avoid**: Avoid Vasopressin, Calcium Channel Blockers, Beta-Blockers, and local anesthetics (lidocaine, procainamide).
     - **Amiodarone** is the preferred antiarrhythmic.'
)
on conflict (title) do update set
  organization = excluded.organization,
  category = excluded.category,
  summary = excluded.summary,
  full_content = excluded.full_content,
  updated_at = now();
