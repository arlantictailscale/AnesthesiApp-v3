package id.my.anesthesiapp.app.data

import id.my.anesthesiapp.app.data.models.Drug
import id.my.anesthesiapp.app.data.models.Guideline
import id.my.anesthesiapp.app.data.models.OsceStation
import id.my.anesthesiapp.app.data.models.CbtPackage
import id.my.anesthesiapp.app.data.models.CbtQuestion

object StaticData {

    val builtInDrugs = listOf(
        Drug(
            id = "builtin-propofol",
            name = "Propofol",
            category = "Induction Agents",
            onset = "30 - 40 seconds",
            duration = "3 - 8 minutes",
            dosage = "1.5 - 2.5 mg/kg IV",
            mechanism = "Facilitates inhibitory neurotransmission mediated by GABAA receptors. Binding to GABAA receptors activates chloride channels, causing hyperpolarization of the postsynaptic membrane and CNS depression.",
            pk = "Highly lipid-soluble. Rapid distribution (t1/2 alpha = 2-8 mins). Rapidly metabolized by the liver (glucuronidation) and extrahepatically (lungs). High clearance rate exceeding hepatic blood flow. Elimination half-life is 3-12 hours.",
            pd = "Dose-dependent decrease in systemic vascular resistance (SVR) and venous return, leading to hypotension. Mild respiratory depression (apnea). Decreases cerebral metabolic rate of oxygen (CMRO2), cerebral blood flow (CBF), and intracranial pressure (ICP).",
            considerations = "Avoid in patients with severe egg/soy allergies (lipid emulsion formulation). Cardio-depressant: use with caution in hypovolemic or cardiac-compromised patients. Strict aseptic technique required (lipid emulsion supports bacterial growth). Antiemetic properties at low doses.",
            contraindications = "Hypersensitivity to propofol, egg, or soy. Acute decompensated heart failure.",
            high_alert = true
        ),
        Drug(
            id = "builtin-ketamine",
            name = "Ketamine",
            category = "Induction Agents / Analgesics",
            onset = "30 - 60 seconds IV; 3 - 4 minutes IM",
            duration = "10 - 20 minutes IV; 60 - 120 minutes IM",
            dosage = "1.0 - 2.0 mg/kg IV; 4.0 - 10.0 mg/kg IM",
            mechanism = "Non-competitive antagonist at the NMDA receptor. Blocks glutamate binding, disrupting association pathways between the limbic system and thalamo-neocortical system (dissociative anesthesia).",
            pk = "Highly lipid-soluble. Rapid onset. Hepatic metabolism via CYP450 (N-demethylation) to norketamine (active metabolite, 1/3-1/5 potency). Excreted in urine. Elimination half-life is 2-3 hours.",
            pd = "Sympathomimetic: increases heart rate, blood pressure, and cardiac output. Preserves airway reflexes and respiratory drive. Bronchodilator. Increases CMRO2, CBF, and ICP (mitigated by controlled ventilation and co-administration of GABA agonists).",
            considerations = "Co-administer benzodiazepine (e.g. Midazolam) to decrease incidence of emergence delirium. Excellent choice for asthmatics (bronchodilation) and hemodynamically unstable patients (septic shock, hypovolemia). Avoid as sole agent in severe ischemic heart disease.",
            contraindications = "Conditions where increased blood pressure would be hazardous (e.g. severe uncontrolled hypertension, aneurysm). Severe pre-eclampsia.",
            high_alert = true
        ),
        Drug(
            id = "builtin-fentanyl",
            name = "Fentanyl",
            category = "Opioids / Analgesics",
            onset = "1 - 2 minutes IV",
            duration = "30 - 60 minutes IV",
            dosage = "1.0 - 5.0 mcg/kg IV",
            mechanism = "Selective agonist at the mu-opioid receptor. Inhibits adenyl cyclase, decreases intracellular cAMP, blocks calcium channels (inhibiting neurotransmitter release), and opens potassium channels (hyperpolarization).",
            pk = "Highly lipophilic. Rapid redistribution from brain to inactive tissues (termination of action after bolus). Metabolized by liver (CYP3A4) to inactive metabolite (norfentanyl). Excreted renally. Elimination half-life is 3-4 hours.",
            pd = "Minimal cardiovascular depression (hemodynamically stable). Dose-dependent respiratory depression. Decreases heart rate (vagal stimulation). Pupillary constriction (miosis). Decreases MAC of inhalation agents.",
            considerations = "Much more potent than morphine (100 times). Rigidity can make ventilation impossible; reverse with neuromuscular blockers. Synergistic respiratory depression when combined with benzodiazepines or propofol.",
            contraindications = "Hypersensitivity to fentanyl. Acute respiratory depression without mechanical ventilation.",
            high_alert = true
        ),
        Drug(
            id = "builtin-rocuronium",
            name = "Rocuronium",
            category = "Neuromuscular Blockers",
            onset = "60 - 90 seconds (rapid onset at 1.2 mg/kg)",
            duration = "30 - 60 minutes",
            dosage = "0.6 mg/kg IV for standard; 1.2 mg/kg IV for RSI",
            mechanism = "Non-depolarizing neuromuscular blocker. Competitively antagonist at nicotinic acetylcholine receptors at the motor endplate, preventing acetylcholine from binding and causing muscle contraction.",
            pk = "Hydrophilic. Not metabolized. Cleared primarily by the liver (biliary excretion 70%) and secondarily by kidneys (30%). Elimination half-life is 1.5 - 2 hours.",
            pd = "Produces flaccid skeletal muscle paralysis. Airway muscles and diaphragm are paralyzed. No cardiovascular effects at standard doses.",
            considerations = "Ensure adequate depth of anesthesia/sedation before administration (paralysis without sedation is traumatic). Monitor neuromuscular blockade using a Train-of-Four (TOF) monitor. Reversible with Sugammadex or Neostigmine/Glycopyrrolate.",
            contraindications = "Hypersensitivity to rocuronium or bromide. Previous severe anaphylactic reaction.",
            high_alert = true
        ),
        Drug(
            id = "builtin-succinylcholine",
            name = "Succinylcholine",
            category = "Neuromuscular Blockers",
            onset = "30 - 60 seconds",
            duration = "5 - 10 minutes",
            dosage = "1.0 - 1.5 mg/kg IV; 3.0 - 4.0 mg/kg IM",
            mechanism = "Depolarizing neuromuscular blocker. Binds to nicotinic acetylcholine receptors, causing prolonged depolarization of the motor endplate, resulting in fasciculations followed by flaccid muscle paralysis.",
            pk = "Rapidly hydrolyzed by plasma cholinesterase (pseudocholinesterase) in the blood. Very short half-life (< 1 min).",
            pd = "Rapid skeletal muscle paralysis. Causes transient muscle fasciculations. May cause bradycardia (especially in children or with second dose) due to muscarinic stimulation.",
            considerations = "Drug of choice for emergency airway management (RSI) due to rapid onset and short duration. Contraindicated in burns, massive trauma, upper motor neuron lesions, and muscular dystrophy due to risk of life-threatening hyperkalemia.",
            contraindications = "History of malignant hyperthermia, skeletal muscle myopathies, major burns (>48h old), denervation injury, severe hyperkalemia.",
            high_alert = true
        ),
        Drug(
            id = "builtin-etomidate",
            name = "Etomidate",
            category = "Induction Agents",
            onset = "30 - 60 seconds",
            duration = "3 - 12 minutes",
            dosage = "0.2 - 0.3 mg/kg IV",
            mechanism = "GABAA receptor agonist. Enhances the effects of GABA by binding to specific sites on GABAA receptors, increasing chloride conductance and causing neural hyperpolarization.",
            pk = "Rapid onset and short duration due to rapid redistribution from brain. Hydrolyzed in liver by esterases to inactive carboxylic acid metabolite. Excreted renally. Half-life: 2-5h.",
            pd = "Excellent cardiovascular stability (minimal change in HR, BP, CO). Mild respiratory depression. Decreases CMRO2, CBF, and ICP. Adrenal suppression.",
            considerations = "Ideal induction agent for hemodynamically unstable patients, cardiovascular disease, or severe hypovolemia. Myoclonus can be mitigated by premedication with midazolam or fentanyl.",
            contraindications = "Hypersensitivity to etomidate. Sepsis or adrenal insufficiency.",
            high_alert = false
        ),
        Drug(
            id = "builtin-neostigmine",
            name = "Neostigmine",
            category = "Reversals / Anticholinesterases",
            onset = "7 - 11 minutes",
            duration = "60 - 120 minutes",
            dosage = "0.03 - 0.07 mg/kg IV (max 5 mg)",
            mechanism = "Reversible acetylcholinesterase inhibitor. Binds to acetylcholinesterase, preventing the hydrolysis of acetylcholine. This increases acetylcholine concentration at the neuromuscular junction.",
            pk = "Quaternary ammonium compound (poor lipid solubility, does not cross blood-brain barrier). Excreted renally.",
            pd = "Reverses neuromuscular blockade. Cholinergic side effects: bradycardia, bronchoconstriction, increased salivation, increased bowel motility.",
            considerations = "Must be co-administered with an anticholinergic (usually Glycopyrrolate or Atropine) to block muscarinic side effects.",
            contraindications = "Mechanical intestinal or urinary tract obstruction. Peritonitis.",
            high_alert = false
        ),
        Drug(
            id = "builtin-sugammadex",
            name = "Sugammadex",
            category = "Reversals",
            onset = "1.5 - 3 minutes",
            duration = "Not applicable",
            dosage = "2.0 - 4.0 mg/kg IV depending on block depth",
            mechanism = "Selective relaxant binding agent. Encapsulates non-depolarizing neuromuscular blocking agents rocuronium or vecuronium in a 1:1 ratio, rapidly reversing blockade.",
            pk = "Not metabolized. Cleared exclusively by the kidneys as an intact complex.",
            pd = "Rapidly and completely reverses neuromuscular blockade without cholinergic side effects.",
            considerations = "No need to co-administer anticholinergics like atropine. Sugammadex can encapsulate oral contraceptives, reducing their efficacy (advise backup contraception for 7 days).",
            contraindications = "Severe renal impairment. Hypersensitivity.",
            high_alert = false
        ),
        Drug(
            id = "builtin-norepinephrine",
            name = "Norepinephrine",
            category = "Vasopressors",
            onset = "1 - 2 minutes IV",
            duration = "2 - 10 minutes",
            dosage = "0.01 - 1.0 mcg/kg/min IV infusion",
            mechanism = "Potent alpha-1 receptor agonist causing peripheral vasoconstriction. Weak beta-1 agonist causing mild increase in heart rate and contractility.",
            pk = "Rapidly metabolized by MAO and COMT. Excreted in urine. Half-life is 1-2 minutes.",
            pd = "Increases blood pressure and systemic vascular resistance (SVR). Reflex bradycardia may occur.",
            considerations = "First-line vasopressor for septic shock. Administer through central venous catheter to prevent extravasation and tissue necrosis.",
            contraindications = "Hypotension from uncorrected blood volume deficits.",
            high_alert = true
        )
    )

    val builtInGuidelines = listOf(
        Guideline(
            id = "builtin-difficult-airway",
            title = "ASA Difficult Airway Algorithm (2022)",
            category = "Airway Management",
            content = """
            ### Key Clinical Recommendations:
            
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
                 - Perform emergency invasive airway access immediately (cricothyroidotomy, scalpel-bougie technique, or jet ventilation).
            """.trimIndent()
        ),
        Guideline(
            id = "builtin-acls",
            title = "AHA ACLS Cardiac Arrest Algorithm (2020)",
            category = "Emergency Protocols",
            content = """
            ### Core Guidelines:
            
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
              - If non-shockable: Continue CPR for 2 minutes and treat reversible causes (**H's and T's**).
            
            #### 4. Reversible Causes (H's & T's):
            - **H's**: Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo-/Hyperkalemia, Hypothermia.
            - **T's**: Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (pulmonary), Thrombosis (coronary).
            """.trimIndent()
        ),
        Guideline(
            id = "builtin-malignant-hyperthermia",
            title = "Malignant Hyperthermia Emergency Protocol",
            category = "Emergency Protocols",
            content = """
            ### Diagnostic Indicators:
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
               - **Contraindicated**: *Do NOT administer Calcium Channel Blockers (e.g., verapamil, diltiazem) to patients receiving dantrolene*, as this can cause hyperkalemia and myocardial depression.
            """.trimIndent()
        ),
        Guideline(
            id = "builtin-last-protocol",
            title = "ASRA Local Anesthetic Systemic Toxicity (LAST) Protocol",
            category = "Emergency Protocols",
            content = """
            ### Clinical Presentation:
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
                 - **Amiodarone** is the preferred antiarrhythmic.
            """.trimIndent()
        )
    )

    val builtInOsceStations = listOf(
        OsceStation(
            id = "builtin-obstetric-sc-appendicitis",
            title = "Anestesia Obstetrik – SC & Appendiktomi Akut",
            category = "Anestesia Obstetrik",
            duration_minutes = 17,
            scenario = "Seorang perempuan berusia 28 tahun berat badan 75 kg dengan G1P0A0 kehamilan aterm inpartu, letak sungsang, disertai appendicitis akut dengan Tekanan Darah 138/88 mmHg laju nadi 112 x/menit, laju napas 18x/mnt, suhu: 39,2 oC. Pasien akan dilakukan operasi SC cito dan appendiktomi, dengan anestesi spinal.",
            patient_profile = "Umur: 28 tahun, G1P0A0, Aterm, Letak Sungsang, Appendicitis Akut, BB 75 kg. Vital sign: TD 138/88, Nadi 112, Napas 18, Suhu 39.2 C.",
            difficulty = "Medium"
        )
    )

    val builtInCbtPackages = listOf(
        CbtPackage(
            id = "pkg1",
            name = "Ujian Dasar Anestesi (Basic)",
            description = "Evaluasi pemahaman tentang eliminasi obat anestesi umum, blockade motorik, dan perlindungan servikal jalan napas.",
            questions = listOf(
                CbtQuestion(
                    id = "q1",
                    text = "Seorang laki-laki berusia 45 tahun dengan riwayat sirosis hepatis Child-Pugh B direncanakan menjalani laparatomi eksplorasi. Terkait pelumpuh otot non-depolarisasi golongan aminosteroid seperti vecuronium, manakah organ eliminasi utama yang bertanggung jawab untuk ekskresi obat ini?",
                    options = mapOf(
                        "A" to "Ginjal (ekskresi urin primer)",
                        "B" to "Hati (eliminasi bilier)",
                        "C" to "Plasma (hidrolisis esterase)",
                        "D" to "Paru-paru (eliminasi Hofmann)",
                        "E" to "Kelenjar keringat eksokrin"
                    ),
                    correctOption = "B",
                    category = "Farmakologi & Fisiologi",
                    explanation = "Vecuronium terutama mengalami eliminasi di hati melalui ekskresi bilier (sekitar 40-70%), sedangkan ginjal bertanggung jawab untuk sekitar 20-30% ekskresinya. Pada pasien dengan gangguan fungsi hati, durasi kerja vecuronium dapat memanjang secara signifikan karena penurunan klirens bilier."
                ),
                CbtQuestion(
                    id = "q3",
                    text = "Seorang laki-laki berusia 30 tahun dibawa ke IGD setelah kecelakaan lalu lintas dengan kecurigaan fraktur kolumna servikal tidak stabil. Pasien mengalami gagal napas akut dan memerlukan intubasi darurat. Manakah tindakan perlindungan jalan napas yang paling direkomendasikan saat laringoskopi?",
                    options = mapOf(
                        "A" to "Head tilt - Chin lift maksimal",
                        "B" to "Manuver jaw thrust tanpa alat bantu tambahan",
                        "C" to "Manual In-Line Stabilization (MILS)",
                        "D" to "Ekstensi leher dengan menaruh bantal tebal di bawah kepala",
                        "E" to "Manuver Sellick dengan tekanan krikoid tinggi"
                    ),
                    correctOption = "C",
                    category = "Resusitasi & Critical Care",
                    explanation = "Manual In-Line Stabilization (MILS) adalah standar emas saat intubasi pasien dengan suspek cedera servikal tidak stabil. MILS dilakukan oleh asisten untuk menstabilkan leher secara aksial guna meminimalkan gerakan fleksi-ekstensi kolumna servikal saat laringoskopi dilakukan."
                ),
                CbtQuestion(
                    id = "q4",
                    text = "Seorang laki-laki berusia 68 tahun dengan riwayat penyakit jantung koroner menjalani operasi TURP dengan anestesi spinal (SAB). Tiga puluh menit setelah injeksi Bupivacaine hiperbarik 12.5 mg, tekanan darah turun menjadi 82/46 mmHg dan laju nadi turun dari 78x/menit menjadi 42x/menit. Manakah dermatom sensorik terblokir yang menjadi penyebab bradikardia ekstrem pada pasien ini?",
                    options = mapOf(
                        "A" to "Blokade simpatis setinggi dermatom L1-L2",
                        "B" to "Blokade parasimpatis sakral S2-S4",
                        "C" to "Blokade serabut simpatis akselerator jantung setinggi T1-T4",
                        "D" to "Blokade motorik dermatom T10-T12",
                        "E" to "Efek depresi miokard langsung akibat absorpsi sistemik bupivacaine"
                    ),
                    correctOption = "C",
                    category = "Anestesi Umum & Regional",
                    explanation = "Bradikardia hebat pada blokade spinal tinggi disebabkan oleh terblokirnya serabut simpatis preganglionik T1-T4 (akselerator jantung). Hal ini menyebabkan dominansi tonus vagal dan penurunan venous return (preload) yang memicu penurunan denyut nadi via refleks Bainbridge."
                )
            )
        ),
        CbtPackage(
            id = "pkg2",
            name = "Subspesialis Obstetrik & Pediatrik",
            description = "Kumpulan soal-soal khusus penatalaksanaan anestesi kebidanan (obstetri) dan penanganan pasien anak/pediatrik.",
            questions = listOf(
                CbtQuestion(
                    id = "q2",
                    text = "Seorang primigravida berusia 28 tahun usia kehamilan 38 minggu dengan Preeklamsia Berat (PEB) direncanakan menjalani Sectio Caesarea darurat. Pasien telah mendapatkan terapi loading dose Magnesium Sulfat (MgSO4). Manakah mekanisme fisiologis MgSO4 berikut yang dapat memperpanjang efek obat pelumpuh otot non-depolarisasi?",
                    options = mapOf(
                        "A" to "Meningkatkan sensitivitas reseptor nikotinik pascasinaps",
                        "B" to "Meningkatkan sintesis dan pelepasan asetilkolin di presinaps",
                        "C" to "Menghambat masuknya kalsium pada terminal presinaps sehingga menurunkan pelepasan asetilkolin",
                        "D" to "Mempercepat metabolisme asetilkolinesterase plasma",
                        "E" to "Meningkatkan laju filtrasi glomerulus sehingga mempercepat klirens obat"
                    ),
                    correctOption = "C",
                    category = "Anestesi Obstetrik",
                    explanation = "Magnesium sulfat (MgSO4) bertindak sebagai antagonis kalsium fisiologis di terminal saraf presinaps neuromuscular junction, yang secara signifikan mengurangi influks kalsium dan pelepasan asetilkolin. Kondisi ini meningkatkan kepekaan motor end-plate dan memperpanjang efek blockade pelumpuh otot depolarisasi maupun nondepolarisasi."
                ),
                CbtQuestion(
                    id = "q5",
                    text = "Seorang anak laki-laki berusia 6 tahun direncanakan menjalani tonsilektomi. Selama induksi inhalasi menggunakan sevoflurane 8% dalam oksigen 100%, pasien tiba-tiba mengalami rigiditas otot maseter yang berat sehingga mulut tidak dapat dibuka sama sekali untuk intubasi. Manakah kecurigaan komplikasi anestesi utama dan tata laksana darurat pertama yang harus disiapkan?",
                    options = mapOf(
                        "A" to "Laringospasme berat; berikan propofol 2 mg/kg intravena",
                        "B" to "Hipertermia Maligna; hentikan sevoflurane dan segera berikan Dantrolene",
                        "C" to "Kejang mioklonik; berikan Midazolam 0.1 mg/kg intravena",
                        "D" to "Anafilaksis sevoflurane; berikan Epinefrin 10 mcg/kg intravena",
                        "E" to "Spasme maseter transient; ganti anestesi dengan isoflurane"
                    ),
                    correctOption = "B",
                    category = "Farmakologi & Fisiologi",
                    explanation = "Rigiditas otot maseter (masseter muscle rigidity - MMR) setelah pemberian zat pemicu (halogenated inhalations atau suksinilkolin) adalah tanda peringatan dini yang sangat kuat dari Hipertermia Maligna. Penanganan utamanya melibatkan penghentian total agen pemicu, hiperventilasi O2 100%, and pemberian Dantrolene."
                ),
                CbtQuestion(
                    id = "q8",
                    text = "Seorang neonatus berusia 3 hari dengan diagnosis atresia duodenum dijadwalkan untuk tindakan duodenoduodenostomi darurat. Manakah dari pernyataan berikut yang menggambarkan perbedaan fisiologis sistem pernapasan neonatus dibanding dewasa?",
                    options = mapOf(
                        "A" to "Neonatus memiliki compliance paru yang sangat tinggi dan compliance dinding dada rendah",
                        "B" to "Neonatus memiliki fungsional residual capacity (FRC) yang relatif lebih besar dibanding dewasa",
                        "C" to "Neonatus memiliki konsumsi oksigen per unit berat badan 2-3 kali lebih tinggi dibanding dewasa",
                        "D" to "Neonatus bernapas dengan otot interkostal sebagai penggerak utama napas",
                        "E" to "Neonatus memiliki sensitivitas yang sangat rendah terhadap hipoksia dan hiperkapnia"
                    ),
                    correctOption = "C",
                    category = "Anestesi Pediatrik",
                    explanation = "Konsumsi oksigen neonatus sangat tinggi (sekitar 6-8 mL/kg/menit, dua kali lipat dibanding dewasa) untuk mendukung metabolisme yang cepat. Dikombinasikan dengan kapasitas residu fungsional (FRC) yang rendah, neonatus sangat cepat mengalami desaturasi oksigen (hipoksia) jika terjadi apneu."
                )
            )
        )
    )
}
