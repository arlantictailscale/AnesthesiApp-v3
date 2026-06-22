package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.AnesthesiaCase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.format.DateTimeFormatter

private val AI_MODELS = listOf(
    "google/gemini-2.5-flash" to "Gemini 2.5 Flash (Direct)",
    "cohere/north-mini-code:free" to "Cohere North Mini Code (free)",
    "nvidia/nemotron-3.5-content-safety:free" to "Nemotron 3.5 Content Safety (free)",
    "nvidia/nemotron-3-ultra-550b-a55b:free" to "Nemotron-3 Ultra 550B (free)"
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun CasesScreen(
    localRepository: LocalRepository,
    onNavigateToCaseDetail: (String) -> Unit,
    onNavigateToCaseWizard: (String?) -> Unit
) {
    var casesList by remember { mutableStateOf<List<AnesthesiaCase>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isSyncing by remember { mutableStateOf(false) }
    var isAiPopulateDialogOpen by remember { mutableStateOf(false) }

    // Bulk selection state
    var isBulkMode by remember { mutableStateOf(false) }
    var selectedCaseIds by remember { mutableStateOf(emptySet<String>()) }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Load cases
    val loadCases = {
        isLoading = true
        coroutineScope.launch {
            try {
                // First read local cache
                casesList = localRepository.getLocalCases()
                
                // Then try to fetch from Supabase if logged in
                val session = SupabaseClient.getSession()
                if (session != null) {
                    val remoteCases = SupabaseClient.fetchCases(session.user.id)
                    // Blend local offline cases with remote ones
                    val localOffline = casesList.filter { it.offline }
                    casesList = (localOffline + remoteCases).sortedByDescending { it.logged_at }
                    // Update cache with remote + local offline
                    localRepository.saveLocalCases(casesList)
                }
            } catch (e: Exception) {
                // Keep local cache on error
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadCases()
    }

    // Polling LaunchedEffect for cases that are in "processing" status
    LaunchedEffect(casesList) {
        val hasProcessing = casesList.any { it.status == "processing" }
        if (hasProcessing) {
            delay(5000)
            val session = SupabaseClient.getSession()
            if (session != null) {
                try {
                    val remoteCases = SupabaseClient.fetchCases(session.user.id)
                    val localOffline = casesList.filter { it.offline }
                    casesList = (localOffline + remoteCases).sortedByDescending { it.logged_at }
                    localRepository.saveLocalCases(casesList)
                } catch (e: Exception) {
                    // Ignore background polling errors
                }
            }
        }
    }

    // Sync function
    val syncOfflineCases = {
        val session = SupabaseClient.getSession()
        if (session == null) {
            Toast.makeText(context, "Log in to sync cases", Toast.LENGTH_SHORT).show()
        } else {
            isSyncing = true
            coroutineScope.launch {
                try {
                    val local = localRepository.getLocalCases()
                    val offlineCases = local.filter { it.offline }
                    var successCount = 0
                    
                    for (case in offlineCases) {
                        try {
                            // Strip offline flag, update user_id
                            val syncPayload = case.copy(user_id = session.user.id, offline = false)
                            SupabaseClient.saveCase(syncPayload)
                            localRepository.removeLocalCase(case.id)
                            successCount++
                        } catch (e: Exception) {
                            // Skip on individual fail
                        }
                    }
                    if (successCount > 0) {
                        Toast.makeText(context, "Successfully synced $successCount cases!", Toast.LENGTH_SHORT).show()
                    } else if (offlineCases.isNotEmpty()) {
                        Toast.makeText(context, "Failed to sync. Check network connection.", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "All cases are up to date", Toast.LENGTH_SHORT).show()
                    }
                    loadCases()
                } catch (e: Exception) {
                    Toast.makeText(context, "Sync error: ${e.message}", Toast.LENGTH_SHORT).show()
                } finally {
                    isSyncing = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (isBulkMode) {
                        Text("Selected (${selectedCaseIds.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    } else {
                        Text("Case Logger", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    }
                },
                navigationIcon = {
                    if (isBulkMode) {
                        IconButton(onClick = {
                            isBulkMode = false
                            selectedCaseIds = emptySet()
                        }) {
                            Icon(Icons.Default.Close, contentDescription = "Exit selection")
                        }
                    }
                },
                actions = {
                    if (isBulkMode) {
                        IconButton(
                            onClick = {
                                val toDelete = selectedCaseIds.toList()
                                if (toDelete.isNotEmpty()) {
                                    isLoading = true
                                    coroutineScope.launch {
                                        try {
                                            val offlineToDelete = casesList.filter { it.id in toDelete && it.offline }
                                            val onlineToDelete = casesList.filter { it.id in toDelete && !it.offline }.map { it.id }
                                            
                                            if (onlineToDelete.isNotEmpty()) {
                                                SupabaseClient.deleteCases(onlineToDelete)
                                            }
                                            
                                            toDelete.forEach { localRepository.removeLocalCase(it) }
                                            
                                            Toast.makeText(context, "Deleted ${toDelete.size} cases", Toast.LENGTH_SHORT).show()
                                            isBulkMode = false
                                            selectedCaseIds = emptySet()
                                            loadCases()
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Failed to delete: ${e.message}", Toast.LENGTH_SHORT).show()
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                }
                            }
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete selected", tint = Color.Red)
                        }
                    } else {
                        IconButton(
                            onClick = { isAiPopulateDialogOpen = true }
                        ) {
                            Icon(Icons.Default.Star, contentDescription = "AI Populate", tint = Color(0xFFD97706))
                        }
                        IconButton(
                            onClick = { syncOfflineCases() },
                            enabled = !isSyncing
                        ) {
                            if (isSyncing) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.primary)
                            } else {
                                Icon(Icons.Default.Refresh, contentDescription = "Sync cases")
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            if (!isBulkMode) {
                FloatingActionButton(
                    onClick = { onNavigateToCaseWizard(null) },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Log new case", tint = Color.White)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading && casesList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            } else if (casesList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "No cases logged yet.\nTap + to log manually, or tap the star icon for AI Populate.",
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(casesList, key = { it.id }) { c ->
                        val isSelected = selectedCaseIds.contains(c.id)
                        CaseItemRow(
                            case = c,
                            isBulkMode = isBulkMode,
                            isSelected = isSelected,
                            onSelectToggle = {
                                if (selectedCaseIds.contains(c.id)) {
                                    selectedCaseIds = selectedCaseIds - c.id
                                    if (selectedCaseIds.isEmpty()) {
                                        isBulkMode = false
                                    }
                                } else {
                                    selectedCaseIds = selectedCaseIds + c.id
                                }
                            },
                            onNavigateToDetail = {
                                onNavigateToCaseDetail(c.id)
                            },
                            onLongClick = {
                                if (!isBulkMode) {
                                    isBulkMode = true
                                    selectedCaseIds = setOf(c.id)
                                }
                            },
                            onDelete = {
                                coroutineScope.launch {
                                    try {
                                        if (c.offline) {
                                            localRepository.removeLocalCase(c.id)
                                        } else {
                                            SupabaseClient.deleteCase(c.id)
                                            localRepository.removeLocalCase(c.id)
                                        }
                                        Toast.makeText(context, "Case deleted", Toast.LENGTH_SHORT).show()
                                        loadCases()
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Failed to delete: ${e.message}", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }
                        )
                    }
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
                                                loadCases()
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CaseItemRow(
    case: AnesthesiaCase,
    isBulkMode: Boolean,
    isSelected: Boolean,
    onSelectToggle: () -> Unit,
    onNavigateToDetail: () -> Unit,
    onLongClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = {
                    if (isBulkMode) {
                        onSelectToggle()
                    } else {
                        onNavigateToDetail()
                    }
                },
                onLongClick = onLongClick
            ),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(
            width = 1.dp,
            color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isBulkMode) {
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = { onSelectToggle() },
                    modifier = Modifier.padding(start = 12.dp)
                )
            }
            
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = case.surgery_type.ifBlank { "Unspecified Procedure" },
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Logged: " + (case.logged_at.substringBefore("T")),
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (case.offline) {
                            Surface(
                                color = Color(0xFF7F1D1D),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "OFFLINE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        if (case.status == "processing") {
                            Surface(
                                color = Color(0xFFD97706),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "PROCESSING",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        } else if (case.status == "failed") {
                            Surface(
                                color = Color(0xFFB91C1C),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "FAILED",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        
                        if (!isBulkMode) {
                            IconButton(onClick = onDelete) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete case", tint = Color.Gray)
                            }
                        }
                    }
                }

                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Patient", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(
                            "${case.patient_age} yo, ${case.patient_gender}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("ASA Physical Status", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(
                            case.asa_status,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Column(modifier = Modifier.weight(1.2f)) {
                        Text("Anesthesia Type", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(
                            case.anesthesia_type.ifBlank { "Unspecified" },
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                if (case.complications.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Column {
                        Text("Complications", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(case.complications, fontSize = 13.sp, color = Color(0xFFFDA4AF))
                    }
                }
            }
        }
    }
}
