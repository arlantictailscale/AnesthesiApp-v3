package id.my.anesthesiapp.app.ui.screens

import android.app.DatePickerDialog
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.ui.window.Dialog
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.AnesthesiaCase
import id.my.anesthesiapp.app.data.models.InvestigationData
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Calendar
import java.util.UUID

private val AI_MODELS = listOf(
    "google/gemini-2.5-flash" to "Gemini 2.5 Flash (Direct)",
    "cohere/north-mini-code:free" to "Cohere North Mini Code (free)",
    "nvidia/nemotron-3.5-content-safety:free" to "Nemotron 3.5 Content Safety (free)",
    "nvidia/nemotron-3-ultra-550b-a55b:free" to "Nemotron-3 Ultra 550B (free)"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseWizardScreen(
    caseId: String?,
    localRepository: LocalRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var activeStep by remember { mutableStateOf(0) }
    var submitting by remember { mutableStateOf(false) }
    var isAiPopulateDialogOpen by remember { mutableStateOf(false) }

    // Draft & Edit Case variables
    var procedureDate by remember { mutableStateOf("") }
    var patientName by remember { mutableStateOf("") }
    var sex by remember { mutableStateOf("Male") }
    var ageStr by remember { mutableStateOf("") }
    var mrn by remember { mutableStateOf("") }
    var room by remember { mutableStateOf("") }
    var weightStr by remember { mutableStateOf("") }
    var heightStr by remember { mutableStateOf("") }
    var bmiStr by remember { mutableStateOf("") }

    var diagnosis by remember { mutableStateOf("") }
    var procedureIntervention by remember { mutableStateOf("") }
    var allergy by remember { mutableStateOf("") }
    var medication by remember { mutableStateOf("") }
    var pastIllness by remember { mutableStateOf("") }
    var lastMeal by remember { mutableStateOf("") }
    var event by remember { mutableStateOf("") }

    var b1Breathing by remember { mutableStateOf("") }
    var b2Blood by remember { mutableStateOf("") }
    var b3Brain by remember { mutableStateOf("") }
    var b4Bladder by remember { mutableStateOf("") }
    var b5Bowel by remember { mutableStateOf("") }
    var b6BodyTemp by remember { mutableStateOf("") }
    var others by remember { mutableStateOf("") }

    var labEnabled by remember { mutableStateOf(false) }
    var labResult by remember { mutableStateOf("") }
    var xrayEnabled by remember { mutableStateOf(false) }
    var xrayResult by remember { mutableStateOf("") }
    var ecgEnabled by remember { mutableStateOf(false) }
    var ecgResult by remember { mutableStateOf("") }
    var ctEnabled by remember { mutableStateOf(false) }
    var ctResult by remember { mutableStateOf("") }
    var mriEnabled by remember { mutableStateOf(false) }
    var mriResult by remember { mutableStateOf("") }
    var invOtherLabel by remember { mutableStateOf("") }
    var invOtherResult by remember { mutableStateOf("") }
    var assessment by remember { mutableStateOf("") }
    var planning by remember { mutableStateOf("") }

    var anesthesiaManagement by remember { mutableStateOf("") }
    var regimenPreInduction by remember { mutableStateOf("") }
    var regimenInduction by remember { mutableStateOf("") }
    var regimenMaintenance by remember { mutableStateOf("") }
    var analgesiaPreOp by remember { mutableStateOf("") }
    var analgesiaIntraOp by remember { mutableStateOf("") }
    var analgesiaPostOp by remember { mutableStateOf("") }

    var postInductionSideEffects by remember { mutableStateOf("") }
    var ventilatorSettings by remember { mutableStateOf("") }
    var hemodynamicsIntra by remember { mutableStateOf("") }
    var durationSurgery by remember { mutableStateOf("") }
    var bleeding by remember { mutableStateOf("") }
    var transfusion by remember { mutableStateOf("") }
    var urineOutput by remember { mutableStateOf("") }
    var fluidBalance by remember { mutableStateOf("") }

    var postOpRoom by remember { mutableStateOf("Low Care") }
    var hemodynamicsPost by remember { mutableStateOf("") }
    var labResultsPost by remember { mutableStateOf("") }
    var isShared by remember { mutableStateOf(true) }

    val populateFromCase = { c: AnesthesiaCase ->
        procedureDate = c.procedure_date
        patientName = c.patient_name
        sex = c.sex ?: "Male"
        ageStr = c.age?.toString() ?: ""
        mrn = c.medical_record_number
        room = c.room
        weightStr = c.weight_kg?.toString() ?: ""
        heightStr = c.height_cm?.toString() ?: ""
        bmiStr = c.bmi?.toString() ?: ""

        diagnosis = c.diagnosis
        procedureIntervention = c.procedure_intervention
        allergy = c.allergy
        medication = c.medication
        pastIllness = c.past_illness
        lastMeal = c.last_meal
        event = c.event

        b1Breathing = c.b1_breathing
        b2Blood = c.b2_blood
        b3Brain = c.b3_brain
        b4Bladder = c.b4_bladder
        b5Bowel = c.b5_bowel
        b6BodyTemp = c.b6_body_temp
        others = c.others

        labEnabled = c.inv_laboratory.enabled
        labResult = c.inv_laboratory.result
        xrayEnabled = c.inv_xray.enabled
        xrayResult = c.inv_xray.result
        ecgEnabled = c.inv_ecg.enabled
        ecgResult = c.inv_ecg.result
        ctEnabled = c.inv_ct.enabled
        ctResult = c.inv_ct.result
        mriEnabled = c.inv_mri.enabled
        mriResult = c.inv_mri.result
        invOtherLabel = c.inv_other_label
        invOtherResult = c.inv_other_result
        assessment = c.assessment
        planning = c.planning

        anesthesiaManagement = c.anesthesia_management
        regimenPreInduction = c.regimen_pre_induction
        regimenInduction = c.regimen_induction
        regimenMaintenance = c.regimen_maintenance
        analgesiaPreOp = c.analgesia_pre_op
        analgesiaIntraOp = c.analgesia_intra_op
        analgesiaPostOp = c.analgesia_post_op

        postInductionSideEffects = c.post_induction_side_effects
        ventilatorSettings = c.ventilator_settings
        hemodynamicsIntra = c.hemodynamics_intra
        durationSurgery = c.duration_surgery
        bleeding = c.bleeding
        transfusion = c.transfusion
        urineOutput = c.urine_output
        fluidBalance = c.fluid_balance

        postOpRoom = c.post_op_room ?: "Low Care"
        hemodynamicsPost = c.hemodynamics_post
        labResultsPost = c.lab_results_post
        isShared = c.is_shared
    }

    // Auto-calculate BMI
    LaunchedEffect(weightStr, heightStr) {
        val w = weightStr.toDoubleOrNull()
        val h = heightStr.toDoubleOrNull()
        if (w != null && h != null && h > 0) {
            val m = h / 100
            val calculatedBmi = w / (m * m)
            bmiStr = String.format("%.1f", calculatedBmi)
        } else {
            bmiStr = ""
        }
    }

    // Load initial data
    LaunchedEffect(caseId) {
        if (caseId != null) {
            // Edit mode: fetch case details
            val localCases = localRepository.getLocalCases()
            val matched = localCases.firstOrNull { it.id == caseId }
            if (matched != null) {
                populateFromCase(matched)
            }
        } else {
            // New mode: load draft if exists
            val draft = loadDraft(context)
            if (draft != null) {
                populateFromCase(draft)
                Toast.makeText(context, "Draft restored", Toast.LENGTH_SHORT).show()
            } else {
                procedureDate = LocalDate.now().toString()
            }
        }
    }

    val assembleCase = { idToUse: String ->
        AnesthesiaCase(
            id = idToUse,
            user_id = SupabaseClient.getSession()?.user?.id,
            created_at = caseItemCreatedAt(caseId, localRepository),
            procedure_date = procedureDate,
            patient_name = patientName,
            sex = sex,
            age = ageStr.toIntOrNull(),
            medical_record_number = mrn,
            room = room,
            weight_kg = weightStr.toDoubleOrNull(),
            height_cm = heightStr.toDoubleOrNull(),
            bmi = bmiStr.toDoubleOrNull(),
            diagnosis = diagnosis,
            procedure_intervention = procedureIntervention,
            allergy = allergy,
            medication = medication,
            past_illness = pastIllness,
            last_meal = lastMeal,
            event = event,
            b1_breathing = b1Breathing,
            b2_blood = b2Blood,
            b3_brain = b3Brain,
            b4_bladder = b4Bladder,
            b5_bowel = b5Bowel,
            b6_body_temp = b6BodyTemp,
            others = others,
            inv_laboratory = InvestigationData(labEnabled, labResult),
            inv_xray = InvestigationData(xrayEnabled, xrayResult),
            inv_ecg = InvestigationData(ecgEnabled, ecgResult),
            inv_ct = InvestigationData(ctEnabled, ctResult),
            inv_mri = InvestigationData(mriEnabled, mriResult),
            inv_other_label = invOtherLabel,
            inv_other_result = invOtherResult,
            assessment = assessment,
            planning = planning,
            anesthesia_management = anesthesiaManagement,
            regimen_pre_induction = regimenPreInduction,
            regimen_induction = regimenInduction,
            regimen_maintenance = regimenMaintenance,
            analgesia_pre_op = analgesiaPreOp,
            analgesia_intra_op = analgesiaIntraOp,
            analgesia_post_op = analgesiaPostOp,
            post_induction_side_effects = postInductionSideEffects,
            ventilator_settings = ventilatorSettings,
            hemodynamics_intra = hemodynamicsIntra,
            duration_surgery = durationSurgery,
            bleeding = bleeding,
            transfusion = transfusion,
            urine_output = urineOutput,
            fluid_balance = fluidBalance,
            post_op_room = postOpRoom,
            hemodynamics_post = hemodynamicsPost,
            lab_results_post = labResultsPost,
            is_shared = isShared,
            status = "completed",
            offline = false
        )
    }

    val handleSaveDraft = {
        val draft = assembleCase(UUID.randomUUID().toString())
        saveDraft(context, draft)
        Toast.makeText(context, "Draft saved locally", Toast.LENGTH_SHORT).show()
    }

    val handleSubmit: () -> Unit = {
        if (procedureDate.isBlank() || patientName.isBlank() || mrn.isBlank() || room.isBlank() || ageStr.isBlank()) {
            Toast.makeText(context, "Please complete Step 1 general patient details", Toast.LENGTH_LONG).show()
        } else {
            submitting = true
            coroutineScope.launch {
                try {
                    val idToUse = caseId ?: UUID.randomUUID().toString()
                    val toSave = assembleCase(idToUse)
                    
                    val session = SupabaseClient.getSession()
                    if (session != null) {
                        val saved = SupabaseClient.saveCase(toSave)
                        localRepository.addLocalCase(saved)
                        Toast.makeText(context, "Case saved successfully online!", Toast.LENGTH_SHORT).show()
                    } else {
                        localRepository.addLocalCase(toSave.copy(offline = true))
                        Toast.makeText(context, "Saved locally (Offline)", Toast.LENGTH_SHORT).show()
                    }
                    
                    if (caseId == null) {
                        clearDraft(context)
                    }
                    onBack()
                } catch (e: Exception) {
                    Toast.makeText(context, "Error saving case: ${e.message}", Toast.LENGTH_LONG).show()
                } finally {
                    submitting = false
                }
            }
        }
    }

    val tabs = listOf("General", "Clinical", "B1-B6", "Planning", "Anesthesia", "Intraop", "Postop")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (caseId != null) "Edit Case" else "New Case", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (caseId == null) {
                        IconButton(onClick = { isAiPopulateDialogOpen = true }) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "AI Populate",
                                tint = Color(0xFFD97706)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = {
                            if (activeStep > 0) activeStep--
                        },
                        enabled = activeStep > 0
                    ) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Back")
                    }

                    if (caseId == null) {
                        OutlinedButton(onClick = handleSaveDraft) {
                            Text("Save Draft")
                        }
                    }

                    if (activeStep < tabs.size - 1) {
                        Button(onClick = { activeStep++ }) {
                            Text("Next")
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowForward, contentDescription = "Next")
                        }
                    } else {
                        Button(
                            onClick = handleSubmit,
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            enabled = !submitting
                        ) {
                            Icon(Icons.Default.Check, contentDescription = "Submit")
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (submitting) "Saving..." else "Submit")
                        }
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier.fillMaxSize().padding(paddingValues)
        ) {
            ScrollableTabRow(
                selectedTabIndex = activeStep,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary,
                edgePadding = 16.dp
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = activeStep == index,
                        onClick = { activeStep = index },
                        text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                when (activeStep) {
                    0 -> Step1View(
                        procedureDate = procedureDate,
                        onProcedureDateChange = { procedureDate = it },
                        patientName = patientName,
                        onPatientNameChange = { patientName = it },
                        sex = sex,
                        onSexChange = { sex = it },
                        age = ageStr,
                        onAgeChange = { ageStr = it },
                        mrn = mrn,
                        onMrnChange = { mrn = it },
                        room = room,
                        onRoomChange = { room = it },
                        weight = weightStr,
                        onWeightChange = { weightStr = it },
                        height = heightStr,
                        onHeightChange = { heightStr = it },
                        bmi = bmiStr
                    )
                    1 -> Step2View(
                        diagnosis = diagnosis,
                        onDiagnosisChange = { diagnosis = it },
                        procedureIntervention = procedureIntervention,
                        onProcedureInterventionChange = { procedureIntervention = it },
                        allergy = allergy,
                        onAllergyChange = { allergy = it },
                        medication = medication,
                        onMedicationChange = { medication = it },
                        pastIllness = pastIllness,
                        onPastIllnessChange = { pastIllness = it },
                        lastMeal = lastMeal,
                        onLastMealChange = { lastMeal = it },
                        event = event,
                        onEventChange = { event = it }
                    )
                    2 -> Step3View(
                        b1Breathing = b1Breathing,
                        onB1Change = { b1Breathing = it },
                        b2Blood = b2Blood,
                        onB2Change = { b2Blood = it },
                        b3Brain = b3Brain,
                        onB3Change = { b3Brain = it },
                        b4Bladder = b4Bladder,
                        onB4Change = { b4Bladder = it },
                        b5Bowel = b5Bowel,
                        onB5Change = { b5Bowel = it },
                        b6BodyTemp = b6BodyTemp,
                        onB6Change = { b6BodyTemp = it },
                        others = others,
                        onOthersChange = { others = it }
                    )
                    3 -> Step4View(
                        labEnabled = labEnabled,
                        onLabEnabledChange = { labEnabled = it },
                        labResult = labResult,
                        onLabResultChange = { labResult = it },
                        xrayEnabled = xrayEnabled,
                        onXrayEnabledChange = { xrayEnabled = it },
                        xrayResult = xrayResult,
                        onXrayResultChange = { xrayResult = it },
                        ecgEnabled = ecgEnabled,
                        onEcgEnabledChange = { ecgEnabled = it },
                        ecgResult = ecgResult,
                        onEcgResultChange = { ecgResult = it },
                        ctEnabled = ctEnabled,
                        onCtEnabledChange = { ctEnabled = it },
                        ctResult = ctResult,
                        onCtResultChange = { ctResult = it },
                        mriEnabled = mriEnabled,
                        onMriEnabledChange = { mriEnabled = it },
                        mriResult = mriResult,
                        onMriResultChange = { mriResult = it },
                        invOtherLabel = invOtherLabel,
                        onInvOtherLabelChange = { invOtherLabel = it },
                        invOtherResult = invOtherResult,
                        onInvOtherResultChange = { invOtherResult = it },
                        assessment = assessment,
                        onAssessmentChange = { assessment = it },
                        planning = planning,
                        onPlanningChange = { planning = it }
                    )
                    4 -> Step5View(
                        anesthesiaManagement = anesthesiaManagement,
                        onAnesthesiaChange = { anesthesiaManagement = it },
                        regimenPreInduction = regimenPreInduction,
                        onPreInductionChange = { regimenPreInduction = it },
                        regimenInduction = regimenInduction,
                        onInductionChange = { regimenInduction = it },
                        regimenMaintenance = regimenMaintenance,
                        onMaintenanceChange = { regimenMaintenance = it },
                        analgesiaPreOp = analgesiaPreOp,
                        onAnalgesiaPreOpChange = { analgesiaPreOp = it },
                        analgesiaIntraOp = analgesiaIntraOp,
                        onAnalgesiaIntraOpChange = { analgesiaIntraOp = it },
                        analgesiaPostOp = analgesiaPostOp,
                        onAnalgesiaPostOpChange = { analgesiaPostOp = it }
                    )
                    5 -> Step6View(
                        postInductionSideEffects = postInductionSideEffects,
                        onSideEffectsChange = { postInductionSideEffects = it },
                        ventilatorSettings = ventilatorSettings,
                        onVentilatorChange = { ventilatorSettings = it },
                        hemodynamicsIntra = hemodynamicsIntra,
                        onHemodynamicsChange = { hemodynamicsIntra = it },
                        durationSurgery = durationSurgery,
                        onDurationChange = { durationSurgery = it },
                        bleeding = bleeding,
                        onBleedingChange = { bleeding = it },
                        transfusion = transfusion,
                        onTransfusionChange = { transfusion = it },
                        urineOutput = urineOutput,
                        onUrineChange = { urineOutput = it },
                        fluidBalance = fluidBalance,
                        onFluidChange = { fluidBalance = it }
                    )
                    6 -> Step7View(
                        postOpRoom = postOpRoom,
                        onPostOpRoomChange = { postOpRoom = it },
                        hemodynamicsPost = hemodynamicsPost,
                        onHemodynamicsChange = { hemodynamicsPost = it },
                        labResultsPost = labResultsPost,
                        onLabResultsChange = { labResultsPost = it },
                        isShared = isShared,
                        onIsSharedChange = { isShared = it }
                    )
                }
            }

            if (isAiPopulateDialogOpen) {
                var description by remember { mutableStateOf("") }
                var selectedModel by remember { mutableStateOf("google/gemini-2.5-flash") }
                var expandedModelDropdown by remember { mutableStateOf(false) }
                var isSubmitting by remember { mutableStateOf(false) }

                Dialog(onDismissRequest = { if (!isSubmitting) isAiPopulateDialogOpen = false }) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(20.dp)
                                .fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = "AI Populate Case",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )

                            Text(
                                text = "Describe your anesthesia case in free text. The AI will extract and fill all 50+ clinical parameters.",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )

                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Clinical Description") },
                                placeholder = { Text("e.g. Male 45yo, 70kg, 170cm, ASA 1, went cholecystectomy under general anesthesia...") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp),
                                maxLines = 10,
                                enabled = !isSubmitting
                            )

                            // Model Selector
                            ExposedDropdownMenuBox(
                                expanded = expandedModelDropdown,
                                onExpandedChange = { if (!isSubmitting) expandedModelDropdown = !expandedModelDropdown }
                            ) {
                                OutlinedTextField(
                                    readOnly = true,
                                    value = AI_MODELS.find { it.first == selectedModel }?.second ?: selectedModel,
                                    onValueChange = {},
                                    label = { Text("AI Model") },
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedModelDropdown) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .menuAnchor(),
                                    enabled = !isSubmitting
                                )
                                ExposedDropdownMenu(
                                    expanded = expandedModelDropdown,
                                    onDismissRequest = { expandedModelDropdown = false }
                                ) {
                                    AI_MODELS.forEach { (id, label) ->
                                        DropdownMenuItem(
                                            text = { Text(label) },
                                            onClick = {
                                                selectedModel = id
                                                expandedModelDropdown = false
                                            }
                                        )
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                TextButton(
                                    onClick = { isAiPopulateDialogOpen = false },
                                    enabled = !isSubmitting,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Cancel")
                                }
                                Button(
                                    onClick = {
                                        if (description.isBlank()) {
                                            Toast.makeText(context, "Please enter a description", Toast.LENGTH_SHORT).show()
                                            return@Button
                                        }
                                        isSubmitting = true
                                        coroutineScope.launch {
                                            try {
                                                val newCaseId = SupabaseClient.aiPopulate(description, selectedModel)
                                                // Create a temporary processing case local placeholder
                                                val tempCase = AnesthesiaCase(
                                                    id = newCaseId,
                                                    procedure_date = DateTimeFormatter.ISO_INSTANT.format(Instant.now()),
                                                    procedure_intervention = "AI Extracting...",
                                                    assessment = "AI processing",
                                                    anesthesia_management = "AI processing",
                                                    status = "processing",
                                                    offline = false
                                                )
                                                localRepository.addLocalCase(tempCase)
                                                Toast.makeText(context, "AI extraction started!", Toast.LENGTH_SHORT).show()
                                                isAiPopulateDialogOpen = false
                                                onBack() // Go back to CasesScreen list to watch the polling
                                            } catch (e: Exception) {
                                                Toast.makeText(context, "Failed to start AI populate: ${e.message}", Toast.LENGTH_LONG).show()
                                            } finally {
                                                isSubmitting = false
                                            }
                                        }
                                    },
                                    enabled = !isSubmitting && description.isNotBlank(),
                                    modifier = Modifier.weight(1.5f)
                                ) {
                                    if (isSubmitting) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(18.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text("Generate", color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------- Step Views ----------------

@Composable
fun Step1View(
    procedureDate: String,
    onProcedureDateChange: (String) -> Unit,
    patientName: String,
    onPatientNameChange: (String) -> Unit,
    sex: String,
    onSexChange: (String) -> Unit,
    age: String,
    onAgeChange: (String) -> Unit,
    mrn: String,
    onMrnChange: (String) -> Unit,
    room: String,
    onRoomChange: (String) -> Unit,
    weight: String,
    onWeightChange: (String) -> Unit,
    height: String,
    onHeightChange: (String) -> Unit,
    bmi: String
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formatted = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            onProcedureDateChange(formatted)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 1: General & Patient", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            OutlinedTextField(
                value = procedureDate,
                onValueChange = {},
                readOnly = true,
                label = { Text("Procedure Date") },
                trailingIcon = {
                    Icon(
                        Icons.Default.DateRange,
                        contentDescription = "Select Date",
                        modifier = Modifier.clickable { datePickerDialog.show() }
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(value = patientName, onValueChange = onPatientNameChange, label = { Text("Patient Name") }, modifier = Modifier.fillMaxWidth())

            Column {
                Text("Sex", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = sex == "Male", onClick = { onSexChange("Male") })
                        Text("Male", modifier = Modifier.clickable { onSexChange("Male") })
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = sex == "Female", onClick = { onSexChange("Female") })
                        Text("Female", modifier = Modifier.clickable { onSexChange("Female") })
                    }
                }
            }

            OutlinedTextField(
                value = age,
                onValueChange = onAgeChange,
                label = { Text("Age (years)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(value = mrn, onValueChange = onMrnChange, label = { Text("Medical Record Number (MRN)") }, modifier = Modifier.fillMaxWidth())

            OutlinedTextField(value = room, onValueChange = onRoomChange, label = { Text("Room / OR") }, modifier = Modifier.fillMaxWidth())

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = weight,
                    onValueChange = onWeightChange,
                    label = { Text("Weight (kg)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = height,
                    onValueChange = onHeightChange,
                    label = { Text("Height (cm)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = bmi,
                onValueChange = {},
                readOnly = true,
                label = { Text("BMI (Auto-calculated)") },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun Step2View(
    diagnosis: String,
    onDiagnosisChange: (String) -> Unit,
    procedureIntervention: String,
    onProcedureInterventionChange: (String) -> Unit,
    allergy: String,
    onAllergyChange: (String) -> Unit,
    medication: String,
    onMedicationChange: (String) -> Unit,
    pastIllness: String,
    onPastIllnessChange: (String) -> Unit,
    lastMeal: String,
    onLastMealChange: (String) -> Unit,
    event: String,
    onEventChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 2: Clinical Assessment", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            OutlinedTextField(value = diagnosis, onValueChange = onDiagnosisChange, label = { Text("Diagnosis") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = procedureIntervention, onValueChange = onProcedureInterventionChange, label = { Text("Procedure / Intervention") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = allergy, onValueChange = onAllergyChange, label = { Text("Allergies (Optional)") }, placeholder = { Text("e.g. Penicillin") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = medication, onValueChange = onMedicationChange, label = { Text("Current Medications") }, placeholder = { Text("e.g. Amlodipine 10mg") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = pastIllness, onValueChange = onPastIllnessChange, label = { Text("Past Illnesses") }, placeholder = { Text("e.g. HT, DM") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = lastMeal, onValueChange = onLastMealChange, label = { Text("Last Meal / NPO State") }, placeholder = { Text("NPO since 00:00") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = event, onValueChange = onEventChange, label = { Text("History of Present Illness / Event") }, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun Step3View(
    b1Breathing: String,
    onB1Change: (String) -> Unit,
    b2Blood: String,
    onB2Change: (String) -> Unit,
    b3Brain: String,
    onB3Change: (String) -> Unit,
    b4Bladder: String,
    onB4Change: (String) -> Unit,
    b5Bowel: String,
    onB5Change: (String) -> Unit,
    b6BodyTemp: String,
    onB6Change: (String) -> Unit,
    others: String,
    onOthersChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 3: Objective (B1–B6 Systems)", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            OutlinedTextField(value = b1Breathing, onValueChange = onB1Change, label = { Text("B1 Airway / Breathing") }, placeholder = { Text("Airway clear, Mallampati II") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = b2Blood, onValueChange = onB2Change, label = { Text("B2 Cardiovascular / Blood") }, placeholder = { Text("TD 120/80, HR 80") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = b3Brain, onValueChange = onB3Change, label = { Text("B3 Neurological / Brain") }, placeholder = { Text("GCS 15 (E4V5M6)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = b4Bladder, onValueChange = onB4Change, label = { Text("B4 Renal / Bladder") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = b5Bowel, onValueChange = onB5Change, label = { Text("B5 Gastrointestinal / Bowel") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = b6BodyTemp, onValueChange = onB6Change, label = { Text("B6 Body Temp / Skin / Bones") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = others, onValueChange = onOthersChange, label = { Text("Other Objective Findings") }, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun Step4View(
    labEnabled: Boolean,
    onLabEnabledChange: (Boolean) -> Unit,
    labResult: String,
    onLabResultChange: (String) -> Unit,
    xrayEnabled: Boolean,
    onXrayEnabledChange: (Boolean) -> Unit,
    xrayResult: String,
    onXrayResultChange: (String) -> Unit,
    ecgEnabled: Boolean,
    onEcgEnabledChange: (Boolean) -> Unit,
    ecgResult: String,
    onEcgResultChange: (String) -> Unit,
    ctEnabled: Boolean,
    onCtEnabledChange: (Boolean) -> Unit,
    ctResult: String,
    onCtResultChange: (String) -> Unit,
    mriEnabled: Boolean,
    onMriEnabledChange: (Boolean) -> Unit,
    mriResult: String,
    onMriResultChange: (String) -> Unit,
    invOtherLabel: String,
    onInvOtherLabelChange: (String) -> Unit,
    invOtherResult: String,
    onInvOtherResultChange: (String) -> Unit,
    assessment: String,
    onAssessmentChange: (String) -> Unit,
    planning: String,
    onPlanningChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 4: Investigations & Planning", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            // Lab
            InvestigationRow("Laboratory Tests", labEnabled, onLabEnabledChange, labResult, onLabResultChange)
            // X-Ray
            InvestigationRow("Chest X-Ray", xrayEnabled, onXrayEnabledChange, xrayResult, onXrayResultChange)
            // ECG
            InvestigationRow("Electrocardiography (ECG)", ecgEnabled, onEcgEnabledChange, ecgResult, onEcgResultChange)
            // CT
            InvestigationRow("CT Scan", ctEnabled, onCtEnabledChange, ctResult, onCtResultChange)
            // MRI
            InvestigationRow("MRI", mriEnabled, onMriEnabledChange, mriResult, onMriResultChange)

            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            OutlinedTextField(value = invOtherLabel, onValueChange = onInvOtherLabelChange, label = { Text("Other Investigation Label") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = invOtherResult, onValueChange = onInvOtherResultChange, label = { Text("Other Investigation Results") }, modifier = Modifier.fillMaxWidth())

            OutlinedTextField(
                value = assessment,
                onValueChange = onAssessmentChange,
                label = { Text("Clinical Assessment (separated by ;)") },
                placeholder = { Text("e.g. ASA 2; HT stg 1") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = planning,
                onValueChange = onPlanningChange,
                label = { Text("Planning (separated by ;)") },
                placeholder = { Text("e.g. IV line 18G; Informed consent") },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun InvestigationRow(
    title: String,
    enabled: Boolean,
    onEnabledChange: (Boolean) -> Unit,
    result: String,
    onResultChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = enabled, onCheckedChange = onEnabledChange)
            Text(title, fontWeight = FontWeight.SemiBold, modifier = Modifier.clickable { onEnabledChange(!enabled) })
        }
        if (enabled) {
            OutlinedTextField(
                value = result,
                onValueChange = onResultChange,
                placeholder = { Text("Enter findings / results...") },
                modifier = Modifier.fillMaxWidth().padding(start = 12.dp)
            )
        }
    }
}

@Composable
fun Step5View(
    anesthesiaManagement: String,
    onAnesthesiaChange: (String) -> Unit,
    regimenPreInduction: String,
    onPreInductionChange: (String) -> Unit,
    regimenInduction: String,
    onInductionChange: (String) -> Unit,
    regimenMaintenance: String,
    onMaintenanceChange: (String) -> Unit,
    analgesiaPreOp: String,
    onAnalgesiaPreOpChange: (String) -> Unit,
    analgesiaIntraOp: String,
    onAnalgesiaIntraOpChange: (String) -> Unit,
    analgesiaPostOp: String,
    onAnalgesiaPostOpChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 5: Anesthesia Management", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            OutlinedTextField(value = anesthesiaManagement, onValueChange = onAnesthesiaChange, label = { Text("Anesthesia Management Method") }, placeholder = { Text("GA Intubasi, SAB, etc.") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = regimenPreInduction, onValueChange = onPreInductionChange, label = { Text("Pre-induction Regimens") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = regimenInduction, onValueChange = onInductionChange, label = { Text("Induction Regimens (separated by ;)") }, placeholder = { Text("Propofol 80mg; Fentanyl 100mcg") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = regimenMaintenance, onValueChange = onMaintenanceChange, label = { Text("Maintenance Regimens") }, placeholder = { Text("Sevoflurane 2%, N2O") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = analgesiaPreOp, onValueChange = onAnalgesiaPreOpChange, label = { Text("Analgesia Pre-Op") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = analgesiaIntraOp, onValueChange = onAnalgesiaIntraOpChange, label = { Text("Analgesia Durante/Intra-Op") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = analgesiaPostOp, onValueChange = onAnalgesiaPostOpChange, label = { Text("Analgesia Post-Op") }, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun Step6View(
    postInductionSideEffects: String,
    onSideEffectsChange: (String) -> Unit,
    ventilatorSettings: String,
    onVentilatorChange: (String) -> Unit,
    hemodynamicsIntra: String,
    onHemodynamicsChange: (String) -> Unit,
    durationSurgery: String,
    onDurationChange: (String) -> Unit,
    bleeding: String,
    onBleedingChange: (String) -> Unit,
    transfusion: String,
    onTransfusionChange: (String) -> Unit,
    urineOutput: String,
    onUrineChange: (String) -> Unit,
    fluidBalance: String,
    onFluidChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 6: Intra-Operative Details", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            OutlinedTextField(value = postInductionSideEffects, onValueChange = onSideEffectsChange, label = { Text("Post-Induction Side Effects") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = ventilatorSettings, onValueChange = onVentilatorChange, label = { Text("Ventilator Settings") }, placeholder = { Text("TV 400ml, RR 12, PEEP 5") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = hemodynamicsIntra, onValueChange = onHemodynamicsChange, label = { Text("Hemodynamics Durante Op") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = durationSurgery, onValueChange = onDurationChange, label = { Text("Duration of Surgery") }, placeholder = { Text("1h 30m") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = bleeding, onValueChange = onBleedingChange, label = { Text("Bleeding (mL)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = transfusion, onValueChange = onTransfusionChange, label = { Text("Transfusion (Units/mL)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = urineOutput, onValueChange = onUrineChange, label = { Text("Urine Output (mL)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = fluidBalance, onValueChange = onFluidChange, label = { Text("Fluid Balance / Input-Output") }, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun Step7View(
    postOpRoom: String,
    onPostOpRoomChange: (String) -> Unit,
    hemodynamicsPost: String,
    onHemodynamicsChange: (String) -> Unit,
    labResultsPost: String,
    onLabResultsChange: (String) -> Unit,
    isShared: Boolean,
    onIsSharedChange: (Boolean) -> Unit
) {
    val rooms = listOf("Low Care", "High Care", "ICU")
    var dropdownExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Step 7: Post-Operative Plan", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)

            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = postOpRoom,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Post-Op Room Destination") },
                    trailingIcon = {
                        Icon(
                            Icons.Default.KeyboardArrowDown,
                            contentDescription = "Expand",
                            modifier = Modifier.clickable { dropdownExpanded = true }
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                )
                DropdownMenu(
                    expanded = dropdownExpanded,
                    onDismissRequest = { dropdownExpanded = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    rooms.forEach { r ->
                        DropdownMenuItem(
                            text = { Text(r) },
                            onClick = {
                                onPostOpRoomChange(r)
                                dropdownExpanded = false
                            }
                        )
                    }
                }
            }

            OutlinedTextField(value = hemodynamicsPost, onValueChange = onHemodynamicsChange, label = { Text("Post-Op Hemodynamics") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = labResultsPost, onValueChange = onLabResultsChange, label = { Text("Post-Op Laboratory Results") }, modifier = Modifier.fillMaxWidth())

            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Share anonymously with peers", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Enable community case sharing for medical research", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
                Switch(checked = isShared, onCheckedChange = onIsSharedChange)
            }
        }
    }
}

// ---------------- Draft Helpers ----------------

private fun caseItemCreatedAt(caseId: String?, localRepository: LocalRepository): String {
    if (caseId != null) {
        // Retrieve existing created_at
        try {
            val local = kotlinx.coroutines.runBlocking { localRepository.getLocalCases() }
            val matched = local.firstOrNull { it.id == caseId }
            if (matched != null && matched.created_at != null) {
                return matched.created_at
            }
        } catch (e: Exception) {
            // Ignore
        }
    }
    return DateTimeFormatter.ISO_INSTANT.format(Instant.now())
}

private fun saveDraft(context: Context, case: AnesthesiaCase) {
    val sharedPreferences = context.getSharedPreferences("AnesthesiAppPrefs", Context.MODE_PRIVATE)
    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
    val caseJson = json.encodeToString(AnesthesiaCase.serializer(), case)
    sharedPreferences.edit().putString("case_draft", caseJson).apply()
}

private fun loadDraft(context: Context): AnesthesiaCase? {
    val sharedPreferences = context.getSharedPreferences("AnesthesiAppPrefs", Context.MODE_PRIVATE)
    val caseJson = sharedPreferences.getString("case_draft", null) ?: return null
    return try {
        val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
        json.decodeFromString(AnesthesiaCase.serializer(), caseJson)
    } catch (e: Exception) {
        null
    }
}

private fun clearDraft(context: Context) {
    val sharedPreferences = context.getSharedPreferences("AnesthesiAppPrefs", Context.MODE_PRIVATE)
    sharedPreferences.edit().remove("case_draft").apply()
}
