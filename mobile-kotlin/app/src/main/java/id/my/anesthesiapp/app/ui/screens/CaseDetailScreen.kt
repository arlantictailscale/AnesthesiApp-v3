package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.AnesthesiaCase
import id.my.anesthesiapp.app.data.models.InvestigationData
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(
    caseId: String,
    localRepository: LocalRepository,
    onNavigateToEdit: (String) -> Unit,
    onBack: () -> Unit
) {
    var caseItem by remember { mutableStateOf<AnesthesiaCase?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isError by remember { mutableStateOf(false) }
    var isSharingLoading by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Fetch case details
    val loadCaseDetails = {
        coroutineScope.launch {
            try {
                // Read local cache first
                val localCases = localRepository.getLocalCases()
                val matched = localCases.firstOrNull { it.id == caseId }
                if (matched != null) {
                    caseItem = matched
                }

                // Query remote
                val session = SupabaseClient.getSession()
                if (session != null) {
                    val remoteCases = SupabaseClient.fetchCases(session.user.id)
                    val remoteMatched = remoteCases.firstOrNull { it.id == caseId }
                    if (remoteMatched != null) {
                        caseItem = remoteMatched
                        localRepository.addLocalCase(remoteMatched)
                    }
                }
                
                if (caseItem == null) {
                    isError = true
                }
            } catch (e: Exception) {
                if (caseItem == null) {
                    isError = true
                }
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(caseId) {
        loadCaseDetails()
    }

    // Status polling if processing (AI populating)
    LaunchedEffect(caseItem?.status) {
        if (caseItem?.status == "processing") {
            while (true) {
                delay(3000)
                try {
                    val session = SupabaseClient.getSession()
                    if (session != null) {
                        val remoteCases = SupabaseClient.fetchCases(session.user.id)
                        val remoteMatched = remoteCases.firstOrNull { it.id == caseId }
                        if (remoteMatched != null) {
                            caseItem = remoteMatched
                            localRepository.addLocalCase(remoteMatched)
                            if (remoteMatched.status != "processing") {
                                break
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignore errors during polling
                }
            }
        }
    }

    val toggleSharing = {
        val current = caseItem
        if (current != null && !isSharingLoading) {
            isSharingLoading = true
            coroutineScope.launch {
                try {
                    val updatedShared = !current.is_shared
                    val updatedPayload = current.copy(is_shared = updatedShared)
                    val saved = SupabaseClient.saveCase(updatedPayload)
                    localRepository.addLocalCase(saved)
                    caseItem = saved
                    Toast.makeText(
                        context,
                        if (updatedShared) "Case is now shared for research" else "Case is now private",
                        Toast.LENGTH_SHORT
                    ).show()
                } catch (e: Exception) {
                    Toast.makeText(context, "Failed to update sharing settings: ${e.message}", Toast.LENGTH_SHORT).show()
                } finally {
                    isSharingLoading = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Case Details", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    val current = caseItem
                    if (current != null && current.status != "processing") {
                        IconButton(onClick = { onNavigateToEdit(current.id) }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit case")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            } else if (isError || caseItem == null) {
                Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Info, contentDescription = "Error", tint = Color.Gray, modifier = Modifier.size(48.dp))
                        Text("Case not found or deleted.", fontWeight = FontWeight.Bold)
                        Button(onClick = onBack) {
                            Text("Back to cases")
                        }
                    }
                }
            } else {
                val case = caseItem!!
                if (case.status == "processing") {
                    Box(modifier = Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            CircularProgressIndicator(color = Color(0xFFD97706), modifier = Modifier.size(56.dp))
                            Text(
                                "AI is populating this case...",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD97706)
                            )
                            Text(
                                "We are extracting clinical details from your description in the background. This page will update automatically.",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                modifier = Modifier.padding(horizontal = 16.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706))) {
                                Text("Back to cases", color = Color.White)
                            }
                        }
                    }
                } else if (case.status == "failed") {
                    Box(modifier = Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Icon(Icons.Default.Info, contentDescription = "Failed", tint = Color.Red, modifier = Modifier.size(56.dp))
                            Text("AI Population Failed", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.Red)
                            Text(
                                case.error_message ?: "The AI model was unable to parse the clinical description.",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Button(onClick = { onNavigateToEdit(case.id) }) {
                                    Text("Edit Manually", color = Color.White)
                                }
                                OutlinedButton(onClick = onBack) {
                                    Text("Back")
                                }
                            }
                        }
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // 1. Patient metadata header card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = case.patient_name.ifBlank { "Patient [Anonymized]" },
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "MRN ${case.medical_record_number.ifBlank { "[Anonymized]" }} · ${case.sex ?: "—"} · ${case.age ?: 0}y · Logged ${case.procedure_date}",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                                
                                Divider(modifier = Modifier.padding(vertical = 4.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Surface(
                                            color = if (case.is_shared) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surfaceVariant,
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = if (case.is_shared) "Shared for Research" else "Private Case",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (case.is_shared) Color(0xFF059669) else MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                        if (case.ai_model != null) {
                                            Text(
                                                text = "Autofilled with ${case.ai_model}",
                                                fontSize = 10.sp,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }

                                    OutlinedButton(
                                        onClick = { toggleSharing() },
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                        modifier = Modifier.height(32.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                    ) {
                                        if (isSharingLoading) {
                                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                        } else {
                                            Icon(
                                                imageVector = if (case.is_shared) Icons.Default.Lock else Icons.Default.Share,
                                                contentDescription = "Share",
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = if (case.is_shared) "Make Private" else "Share Research",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // 2. Structured Sections
                        ClinicalSectionCard(
                            title = "General & Patient",
                            items = listOf(
                                "Procedure Date" to case.procedure_date,
                                "Patient Name" to case.patient_name,
                                "Sex" to (case.sex ?: ""),
                                "Age" to (case.age?.toString() ?: ""),
                                "MRN" to case.medical_record_number,
                                "Room" to case.room,
                                "Weight (kg)" to (case.weight_kg?.toString() ?: ""),
                                "Height (cm)" to (case.height_cm?.toString() ?: ""),
                                "BMI" to (case.bmi?.toString() ?: "")
                            )
                        )

                        ClinicalSectionCard(
                            title = "Clinical Assessment",
                            items = listOf(
                                "Diagnosis" to case.diagnosis,
                                "Procedure / Intervention" to case.procedure_intervention,
                                "Allergy" to case.allergy,
                                "Medication" to case.medication,
                                "Past Illness" to case.past_illness,
                                "Last Meal" to case.last_meal,
                                "Event" to case.event
                            )
                        )

                        ClinicalSectionCard(
                            title = "Objective (B1–B6)",
                            items = listOf(
                                "B1 Breathing/Airway" to case.b1_breathing,
                                "B2 Blood/Cardiovascular" to case.b2_blood,
                                "B3 Brain/Neurological" to case.b3_brain,
                                "B4 Bladder/Urine" to case.b4_bladder,
                                "B5 Bowel/Abdomen" to case.b5_bowel,
                                "B6 Body Temp/Skin" to case.b6_body_temp,
                                "Others" to case.others
                            )
                        )

                        ClinicalSectionCard(
                            title = "Investigations & Planning",
                            items = listOf(
                                "Laboratory" to fmtInv(case.inv_laboratory),
                                "X-Ray" to fmtInv(case.inv_xray),
                                "ECG" to fmtInv(case.inv_ecg),
                                "CT Scan" to fmtInv(case.inv_ct),
                                "MRI" to fmtInv(case.inv_mri),
                                "Other" to if (case.inv_other_label.isNotBlank()) {
                                    "${case.inv_other_label}${if (case.inv_other_result.isNotBlank()) " — " + case.inv_other_result else ""}"
                                } else "",
                                "Assessment" to case.assessment,
                                "Planning" to case.planning
                            )
                        )

                        ClinicalSectionCard(
                            title = "Anesthesia Management",
                            items = listOf(
                                "Management" to case.anesthesia_management,
                                "Pre-induction" to case.regimen_pre_induction,
                                "Induction" to case.regimen_induction,
                                "Maintenance" to case.regimen_maintenance,
                                "Analgesia Pre-Op" to case.analgesia_pre_op,
                                "Analgesia Intra-Op" to case.analgesia_intra_op,
                                "Analgesia Post-Op" to case.analgesia_post_op
                            )
                        )

                        ClinicalSectionCard(
                            title = "Intra-Operative",
                            items = listOf(
                                "Post-Induction Side Effects" to case.post_induction_side_effects,
                                "Ventilator Settings" to case.ventilator_settings,
                                "Hemodynamics" to case.hemodynamics_intra,
                                "Duration of Surgery" to case.duration_surgery,
                                "Bleeding" to case.bleeding,
                                "Transfusion" to case.transfusion,
                                "Urine Output" to case.urine_output,
                                "Fluid Balance" to case.fluid_balance
                            )
                        )

                        ClinicalSectionCard(
                            title = "Post-Operative",
                            items = listOf(
                                "Post-Op Room" to (case.post_op_room ?: ""),
                                "Hemodynamics" to case.hemodynamics_post,
                                "Laboratory Results" to case.lab_results_post
                            )
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ClinicalSectionCard(title: String, items: List<Pair<String, String>>) {
    val activeItems = items.filter { it.second.trim().isNotBlank() && it.second.trim() != "—" }
    
    if (activeItems.isNotEmpty()) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MaterialTheme.colorScheme.primary)
                
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    activeItems.forEach { (label, value) ->
                        val isLong = value.contains(";") || value.length > 50 || value.contains("\n")
                        
                        if (isLong) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    label.uppercase(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                                FormattedList(value)
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Text(
                                    label,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    value,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.weight(1.5f),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.End
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FormattedList(value: String) {
    val items = value.split(";").map { it.trim() }.filter { it.isNotBlank() }
    
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        items.forEach { item ->
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("•", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                Text(item, fontSize = 13.sp, lineHeight = 17.sp)
            }
        }
    }
}

private fun fmtInv(inv: InvestigationData?): String {
    if (inv == null || !inv.enabled) return ""
    return if (inv.result.trim().isNotBlank()) inv.result else "Performed"
}
