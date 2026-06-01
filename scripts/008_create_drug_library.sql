-- SQL migration to create the Anesthesia Drug Library table
-- Run this in your Supabase SQL Editor.

create table if not exists public.anesthesia_drugs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null for standard system drugs
  name text not null unique,
  category text not null,
  mechanism_of_action text not null,
  pharmacokinetics text not null,
  pharmacodynamics text not null,
  onset_of_action text not null,
  duration_of_action text not null,
  induction_dose text not null,
  maintenance_dose text not null,
  side_effects text not null,
  clinical_considerations text not null,
  contraindications text,
  infusion_guidelines text,
  is_high_alert boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security
alter table public.anesthesia_drugs enable row level security;

-- RLS Policies
-- 1. Everyone can read standard drugs (user_id IS NULL) and their own custom drugs
create policy "drugs_select_policy" on public.anesthesia_drugs
  for select using (user_id is null or auth.uid() = user_id);

-- 2. Authenticated users can insert their own custom drugs
create policy "drugs_insert_policy" on public.anesthesia_drugs
  for insert with check (auth.uid() = user_id);

-- 3. Authenticated users can update their own custom drugs
create policy "drugs_update_policy" on public.anesthesia_drugs
  for update using (auth.uid() = user_id);

-- 4. Authenticated users can delete their own custom drugs
create policy "drugs_delete_policy" on public.anesthesia_drugs
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists anesthesia_drugs_user_id_idx on public.anesthesia_drugs(user_id);
create index if not exists anesthesia_drugs_name_idx on public.anesthesia_drugs(name);

-- Seed initial standard drugs (only if they don't exist yet)
insert into public.anesthesia_drugs (
  name, category, mechanism_of_action, pharmacokinetics, pharmacodynamics, 
  onset_of_action, duration_of_action, induction_dose, maintenance_dose, 
  side_effects, clinical_considerations, contraindications, infusion_guidelines, is_high_alert
) values 
(
  'Propofol',
  'Induction Agents',
  'Facilitates inhibitory neurotransmission mediated by GABAA receptors. Binding to GABAA receptors activates chloride channels, causing hyperpolarization of the postsynaptic membrane and CNS depression.',
  'Highly lipid-soluble. Rapid distribution (t1/2 alpha = 2-8 mins). Rapidly metabolized by the liver (glucuronidation) and extrahepatically (lungs). High clearance rate exceeding hepatic blood flow. Elimination half-life is 3-12 hours.',
  'Dose-dependent decrease in systemic vascular resistance (SVR) and venous return, leading to hypotension. Mild respiratory depression (apnea). Decreases cerebral metabolic rate of oxygen (CMRO2), cerebral blood flow (CBF), and intracranial pressure (ICP).',
  '30 - 40 seconds',
  '3 - 8 minutes',
  '1.5 - 2.5 mg/kg IV',
  '100 - 200 mcg/kg/min IV infusion (sedation: 25 - 75 mcg/kg/min)',
  'Hypotension, bradycardia, pain on injection, apnea, myoclonus, Propofol Infusion Syndrome (PRIS) with prolonged high-dose infusions (>48h, >4 mg/kg/hr or 67 mcg/kg/min).',
  'Avoid in patients with severe egg/soy allergies (lipid emulsion formulation). Cardio-depressant: use with caution in hypovolemic or cardiac-compromised patients. Strict aseptic technique required (lipid emulsion supports bacterial growth). Antiemetic properties at low doses.',
  'Hypersensitivity to propofol, egg, or soy. Acute decompensated heart failure.',
  'Dilute in D5W if necessary; use dedicated IV lines. Change tubing every 12 hours.',
  true
),
(
  'Ketamine',
  'Induction Agents / Analgesics',
  'Non-competitive antagonist at the NMDA receptor. Blocks glutamate binding, disrupting association pathways between the limbic system and thalamo-neocortical system (dissociative anesthesia).',
  'Highly lipid-soluble. Rapid onset. Hepatic metabolism via CYP450 (N-demethylation) to norketamine (active metabolite, 1/3-1/5 potency). Excreted in urine. Elimination half-life is 2-3 hours.',
  'Sympathomimetic: increases heart rate, blood pressure, and cardiac output. Preserves airway reflexes and respiratory drive. Bronchodilator. Increases CMRO2, CBF, and ICP (mitigated by controlled ventilation and co-administration of GABA agonists).',
  '30 - 60 seconds IV; 3 - 4 minutes IM',
  '10 - 20 minutes IV; 60 - 120 minutes IM',
  '1.0 - 2.0 mg/kg IV; 4.0 - 10.0 mg/kg IM',
  '0.5 - 2.0 mg/kg/hr IV infusion (sub-anesthetic analgesia: 0.1 - 0.5 mg/kg/hr)',
  'Emergence delirium, hallucinations, vivid dreams, tachycardia, hypertension, hypersalivation, increased intraocular pressure.',
  'Co-administer benzodiazepine (e.g. Midazolam) to decrease incidence of emergence delirium. Excellent choice for asthmatics (bronchodilation) and hemodynamically unstable patients (septic shock, hypovolemia). Avoid as sole agent in severe ischemic heart disease.',
  'Conditions where increased blood pressure would be hazardous (e.g. severe uncontrolled hypertension, aneurysm). Severe pre-eclampsia.',
  'Compatible with NS and D5W. Titrate slowly for sub-anesthetic analgesia.',
  true
),
(
  'Fentanyl',
  'Opioids / Analgesics',
  'Selective agonist at the mu-opioid receptor. Inhibits adenyl cyclase, decreases intracellular cAMP, blocks calcium channels (inhibiting neurotransmitter release), and opens potassium channels (hyperpolarization).',
  'Highly lipophilic. Rapid redistribution from brain to inactive tissues (termination of action after bolus). Metabolized by liver (CYP3A4) to inactive metabolite (norfentanyl). Excreted renally. Elimination half-life is 3-4 hours.',
  'Minimal cardiovascular depression (hemodynamically stable). Dose-dependent respiratory depression. Decreases heart rate (vagal stimulation). Pupillary constriction (miosis). Decreases MAC of inhalation agents.',
  '1 - 2 minutes IV',
  '30 - 60 minutes IV',
  '1.0 - 5.0 mcg/kg IV (higher doses up to 20-50 mcg/kg for cardiac surgery)',
  '1.0 - 3.0 mcg/kg/hr IV infusion or boluses of 25-100 mcg IV as needed',
  'Respiratory depression, bradycardia, chest wall rigidity (''woody chest'' with rapid high-dose IV bolus), nausea/vomiting, pruritus, urinary retention.',
  'Much more potent than morphine (100 times). Rigidity can make ventilation impossible; reverse with neuromuscular blockers. Synergistic respiratory depression when combined with benzodiazepines or propofol.',
  'Hypersensitivity to fentanyl. Acute respiratory depression without mechanical ventilation.',
  'Dilute in NS or D5W. Infusions require continuous monitoring of pulse oximetry and capnography.',
  true
),
(
  'Rocuronium',
  'Neuromuscular Blockers',
  'Non-depolarizing neuromuscular blocker. Competitively antagonist at nicotinic acetylcholine receptors at the motor endplate, preventing acetylcholine from binding and causing muscle contraction.',
  'Hydrophilic. Not metabolized. Cleared primarily by the liver (biliary excretion 70%) and secondarily by kidneys (30%). Elimination half-life is 1.5 - 2 hours. Action prolonged in liver failure.',
  'Produces flaccid skeletal muscle paralysis. Airway muscles and diaphragm are paralyzed. No cardiovascular effects at standard doses.',
  '60 - 90 seconds (rapid onset at 1.2 mg/kg, suitable for RSI)',
  '30 - 60 minutes',
  '0.6 mg/kg IV for standard intubation; 1.2 mg/kg IV for Rapid Sequence Induction (RSI)',
  '0.1 - 0.2 mg/kg IV bolus or 5 - 12 mcg/kg/min IV infusion',
  'Prolonged neuromuscular blockade, anaphylaxis (rare but most common among non-depolarizing blockers), transient tachycardia.',
  'Ensure adequate depth of anesthesia/sedation before administration (paralysis without sedation is traumatic). Monitor neuromuscular blockade using a Train-of-Four (TOF) monitor. Reversible with Sugammadex or Neostigmine/Glycopyrrolate.',
  'Hypersensitivity to rocuronium or bromide. Previous severe anaphylactic reaction.',
  'Compatible with NS and D5W. Monitor TOF frequently.',
  true
),
(
  'Succinylcholine',
  'Neuromuscular Blockers',
  'Depolarizing neuromuscular blocker. Binds to nicotinic acetylcholine receptors, causing prolonged depolarization of the motor endplate, resulting in fasciculations followed by flaccid muscle paralysis.',
  'Rapidly hydrolyzed by plasma cholinesterase (pseudocholinesterase) in the blood. Very short half-life (< 1 min). Only a small fraction reaches the neuromuscular junction.',
  'Rapid skeletal muscle paralysis. Causes transient muscle fasciculations. May cause bradycardia (especially in children or with second dose) due to muscarinic stimulation.',
  '30 - 60 seconds',
  '5 - 10 minutes',
  '1.0 - 1.5 mg/kg IV; 3.0 - 4.0 mg/kg IM (max 150 mg)',
  'Rarely used as continuous infusion due to risk of Phase II block (0.5 - 10 mg/min)',
  'Hyperkalemia (increases serum K+ by 0.5 mEq/L), muscle fasciculations, myalgia, increased intragastric/intraocular pressure, bradycardia, Malignant Hyperthermia trigger.',
  'Drug of choice for emergency airway management (RSI) due to rapid onset and short duration. Contraindicated in burns, massive trauma, upper motor neuron lesions, and muscular dystrophy due to risk of life-threatening hyperkalemia. Avoid in pseudocholinesterase deficiency.',
  'History of malignant hyperthermia, skeletal muscle myopathies, major burns (>48h old), denervation injury, severe hyperkalemia.',
  'Usually given only as single boluses. Keep refrigerated.',
  true
),
(
  'Etomidate',
  'Induction Agents',
  'GABAA receptor agonist. Enhances the effects of GABA by binding to specific sites on GABAA receptors, increasing chloride conductance and causing neural hyperpolarization.',
  'Rapid onset and short duration due to rapid redistribution from brain. Hydrolyzed in liver by esterases to inactive carboxylic acid metabolite. Excreted renally. Elimination half-life is 2-5 hours.',
  'Excellent cardiovascular stability (minimal change in HR, BP, CO). Mild respiratory depression. Decreases CMRO2, CBF, and ICP. Transiently suppresses adrenal steroidogenesis.',
  '30 - 60 seconds',
  '3 - 12 minutes',
  '0.2 - 0.3 mg/kg IV',
  '0.01 - 0.02 mg/kg/min IV infusion (rarely used for maintenance due to adrenal suppression)',
  'Myoclonus (involuntary muscle movements), pain on injection, transient adrenocortical suppression (inhibits 11-beta-hydroxylase for 5-24h), nausea and vomiting.',
  'Ideal induction agent for hemodynamically unstable patients, cardiovascular disease, or severe hypovolemia. Myoclonus can be mitigated by premedication with midazolam or fentanyl. Avoid in sepsis due to adrenal suppression.',
  'Hypersensitivity to etomidate. Sepsis or adrenal insufficiency.',
  'Usually administered as a single IV bolus. Avoid prolonged infusions.',
  false
),
(
  'Neostigmine',
  'Reversals / Anticholinesterases',
  'Reversible acetylcholinesterase inhibitor. Binds to acetylcholinesterase, preventing the hydrolysis of acetylcholine. This increases acetylcholine concentration at the neuromuscular junction, outcompeting non-depolarizing muscle relaxants.',
  'Quaternary ammonium compound (poor lipid solubility, does not cross blood-brain barrier). Metabolized by liver microsomal enzymes and hydrolyzed by cholinesterase. Excreted renally (elimination prolonged in renal failure). Elimination half-life is 50-90 minutes.',
  'Reverses neuromuscular blockade. Cholinergic side effects: bradycardia, bronchoconstriction, increased salivation, pupillary constriction (miosis), increased bowel motility.',
  '7 - 11 minutes (slow onset, requires time to accumulate acetylcholine)',
  '60 - 120 minutes',
  '0.03 - 0.07 mg/kg IV (max 5 mg)',
  'Not applicable (not used for maintenance)',
  'Bradycardia, asystole, bronchospasm, hypersalivation, diarrhea, abdominal cramping, nausea/vomiting.',
  'Must be co-administered with an anticholinergic (usually Glycopyrrolate or Atropine) to block muscarinic side effects (bradycardia, salivation). Verify return of twitch response (at least 1-2 twitches on TOF) before administration; ineffective against deep blockade.',
  'Mechanical intestinal or urinary tract obstruction. Peritonitis.',
  'Administer slowly. Always give alongside glycopyrrolate or atropine.',
  false
),
(
  'Sugammadex',
  'Reversals',
  'Selective relaxant binding agent (SRBA). Encapsulates non-depolarizing neuromuscular blocking agents rocuronium or vecuronium in a 1:1 ratio, preventing them from binding to nicotinic receptors and rapidly reversing blockade.',
  'Water-soluble modified gamma-cyclodextrin. Not metabolized. Cleared exclusively by the kidneys as an intact complex. Elimination half-life is 1.5 - 2.5 hours.',
  'Rapidly and completely reverses neuromuscular blockade. No cholinergic side effects (does not affect acetylcholinesterase). Minimal cardiovascular effects.',
  '1.5 - 3 minutes (extremely rapid compared to neostigmine)',
  'Not applicable',
  '2.0 mg/kg IV for moderate block (reappearance of T2); 4.0 mg/kg IV for deep block (1-2 post-tetanic counts); 16.0 mg/kg IV for immediate reversal (3 mins after rocuronium 1.2 mg/kg)',
  'Not applicable',
  'Anaphylaxis (rare, ~0.3%), transient bradycardia, hypersensitivity reactions, coagulation parameter changes (transient increase in aPTT/PT).',
  'No need to co-administer anticholinergics like atropine. Rocuronium/sugammadex complex is excreted renally; use with caution in severe renal impairment (e.g. GFR <30). Can encapsulate oral contraceptives, reducing their efficacy (advise patients to use backup contraception for 7 days).',
  'Severe renal impairment (not recommended). Hypersensitivity to sugammadex.',
  'Administer as a rapid IV bolus. Incompatible with standard drug lines; flush line before and after administration.',
  false
),
(
  'Atropine',
  'Anticholinergics / Emergency',
  'Competitive antagonist at muscarinic acetylcholine receptors. Blocks parasympathetic acetylcholine action, leading to increased heart rate and decreased secretions.',
  'Rapidly absorbed and distributed. Crossing the blood-brain barrier (tertiary amine). Partially metabolized by liver. Excreted renally. Elimination half-life is 2 - 4 hours.',
  'Increases heart rate (positive chronotropic effect), speeds AV conduction. Decreases salivary and bronchial secretions. Bronchodilator. Causes pupillary dilation (mydriasis) and cycloplegia.',
  '30 - 60 seconds IV; 15 - 30 minutes IM',
  '1 - 2 hours (cardiac); up to 4 hours (secretions)',
  '0.5 - 1.0 mg IV for bradycardia (repeat every 3-5 mins, max 3 mg or 0.04 mg/kg)',
  'Not applicable (not typically used as continuous infusion)',
  'Tachycardia, palpitations, dry mouth, blurred vision, urinary retention, flushing, confusion, central anticholinergic syndrome (hallucinations, delirium).',
  'First-line drug for symptomatic bradycardia. Low doses (<0.5 mg) can cause paradoxical bradycardia due to central/peripheral presynaptic muscarinic blocking. Use with caution in coronary artery disease (tachycardia increases oxygen demand).',
  'Angle-closure glaucoma. Pyloric stenosis. Thyrotoxicosis.',
  'Administer rapid IV push. Incompatible with alkaline solutions.',
  false
),
(
  'Norepinephrine',
  'Vasopressors / Cardiovascular',
  'Direct-acting sympathomimetic. Potent alpha-1 receptor agonist, causing peripheral vasoconstriction. Weak beta-1 agonist, causing mild increase in heart rate and myocardial contractility.',
  'Rapid onset, extremely short duration of action. Rapidly metabolized in liver and other tissues by MAO and COMT. Excreted in urine. Half-life is 1 - 2 minutes.',
  'Increases systolic and diastolic blood pressure, increases systemic vascular resistance (SVR). Reflex bradycardia may occur in response to increased blood pressure.',
  '1 - 2 minutes IV',
  '2 - 10 minutes (requires continuous infusion)',
  '0.05 - 0.15 mcg/kg/min IV titration for shock states',
  '0.01 - 1.0 mcg/kg/min IV infusion (titrated to mean arterial pressure target, e.g. MAP > 65 mmHg)',
  'Arrhythmias, myocardial ischemia, severe peripheral vasoconstriction (limb ischemia), extravasation necrosis, headache, anxiety.',
  'First-line vasopressor for septic shock and vasodilatory shock. Administer through a central venous catheter to prevent extravasation and tissue necrosis. If extravasation occurs, treat with phentolamine.',
  'Hypotension from uncorrected blood volume deficits (except as temporary emergency measure). Mesenteric or peripheral vascular thrombosis.',
  'Dilute in D5W or D5NS to prevent oxidation. Run via dedicated infusion pump, monitor arterial blood pressure closely.',
  true
)
on conflict (name) do update set
  category = excluded.category,
  mechanism_of_action = excluded.mechanism_of_action,
  pharmacokinetics = excluded.pharmacokinetics,
  pharmacodynamics = excluded.pharmacodynamics,
  onset_of_action = excluded.onset_of_action,
  duration_of_action = excluded.duration_of_action,
  induction_dose = excluded.induction_dose,
  maintenance_dose = excluded.maintenance_dose,
  side_effects = excluded.side_effects,
  clinical_considerations = excluded.clinical_considerations,
  contraindications = excluded.contraindications,
  infusion_guidelines = excluded.infusion_guidelines,
  is_high_alert = excluded.is_high_alert,
  updated_at = now();
