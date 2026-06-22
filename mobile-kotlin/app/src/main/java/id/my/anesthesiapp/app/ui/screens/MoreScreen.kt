package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoreScreen(
    localRepository: LocalRepository,
    onNavigateToGuidelines: () -> Unit,
    onNavigateToCalculator: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var totalCasesCount by remember { mutableStateOf(1247) }
    var totalHoursCount by remember { mutableStateOf(3820) }
    var activeDialogContent by remember { mutableStateOf<String?>(null) }
    var activeDialogTitle by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        val cases = localRepository.getLocalCases()
        totalCasesCount = cases.size + 1247
        totalHoursCount = (cases.size * 1.5).toInt() + 3820
    }

    val menuItems = listOf(
        MenuItem("Guidelines Library", "DAS, ESA, ANZAAG, NICE, ERAS", Icons.Default.Info, QuickGuideBg, QuickGuideIcon, onNavigateToGuidelines),
        MenuItem("Calculators", "18 clinical tools", Icons.Default.Build, QuickCalcBg, QuickCalcIcon, onNavigateToCalculator),
        MenuItem(
            "Research", 
            "PubMed · Cochrane · UpToDate", 
            Icons.Default.Search, 
            Color(0xFFE0F2FE), 
            Color(0xFF0284C7), 
            {
                activeDialogTitle = "Research Portals"
                activeDialogContent = "AnesthesiApp links to major databases:\n\n1. **PubMed**: Access peer-reviewed clinical studies.\n2. **Cochrane Library**: Systematic reviews of primary research in human health care.\n3. **UpToDate**: Evidence-based clinical decision support.\n\n(Use web links in the full web client to search directly)."
            }
        ),
        MenuItem(
            "Textbook Library", 
            "Miller, Morgan & Mikhail, Stoelting", 
            Icons.Default.Menu, 
            Color(0xFFE2E8F0), 
            Color(0xFF475569), 
            {
                activeDialogTitle = "Textbooks Reference"
                activeDialogContent = "Recommended Syllabus:\n\n- *Miller's Anesthesia* (9th Ed)\n- *Morgan & Mikhail's Clinical Anesthesiology* (7th Ed)\n- *Stoelting's Anesthesia and Co-Existing Disease* (8th Ed)\n\nSummaries and chapter highlights are synchronized in the core study modules."
            }
        ),
        MenuItem(
            "Anatomy Atlas", 
            "Regional blocks & neuroanatomy", 
            Icons.Default.Face, 
            Color(0xFFFCE7F3), 
            Color(0xFFDB2777), 
            {
                activeDialogTitle = "Anatomy Atlas"
                activeDialogContent = "Regional Block Landmarks:\n\n- Interscalene Brachial Plexus Block\n- Femoral Nerve Block\n- Transversus Abdominis Plane (TAP) Block\n- Spinal/Epidural Space Landmarks (Tuffier Line L3-L4)"
            }
        ),
        MenuItem(
            "Log Procedures", 
            "Central lines, blocks, epidurals", 
            Icons.Default.Edit, 
            Color(0xFFFEF08A), 
            Color(0xFFA16207), 
            {
                activeDialogTitle = "Procedural Logs"
                activeDialogContent = "Procedures Logged under your account:\n\n- Central Venous Catheterizations: 42\n- Epidural Catheter Placements: 88\n- Arterial Line Cannulations: 51\n- Peripheral Nerve Blocks: 64"
            }
        ),
        MenuItem(
            "ANZCA Fellowship", 
            "Exam regulations & curriculum", 
            Icons.Default.ThumbUp, 
            Color(0xFFF3E8FF), 
            Color(0xFF7C3AED), 
            {
                activeDialogTitle = "ANZCA Fellowship Guide"
                activeDialogContent = "Australian and New Zealand College of Anaesthetists Curriculum:\n\n- Primary Examination (Pharmacology & Physiology)\n- Final Examination (Anesthesia Clinical reasoning & OSCE)\n- Practice updates, guidelines, and review packets."
            }
        )
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("More", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { }) { Icon(Icons.Default.Search, contentDescription = "Search") }
                    IconButton(onClick = { }) { Icon(Icons.Default.Notifications, contentDescription = "Notifications") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = LightBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // Profile Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = LightSurface),
                    border = BorderStroke(1.dp, BorderColor)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE0F2FE)),
                                contentAlignment = Alignment.Center
                            ) {
                                // Use Info or Create custom stethoscope symbol using standard icons
                                Icon(
                                    Icons.Default.Star,
                                    contentDescription = "Profile icon",
                                    tint = Color(0xFF0284C7),
                                    modifier = Modifier.size(28.dp)
                                )
                            }

                            Column {
                                Text("Dr. Rahul Patel", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("MBBS, FANZCA Candidate", fontSize = 13.sp, color = TextSecondary)
                                Text("Royal Melbourne Hospital", fontSize = 12.sp, color = PinkPrimary, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Statistics Grid Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text(
                                    text = String.format("%,d", totalCasesCount),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text("Cases", fontSize = 11.sp, color = TextSecondary)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text(
                                    text = String.format("%,d", totalHoursCount),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text("Hours", fontSize = 11.sp, color = TextSecondary)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "2 left",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text("Exams", fontSize = 11.sp, color = TextSecondary)
                            }
                        }
                    }
                }
            }

            // Menu Options
            items(menuItems) { item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { item.onClick() },
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, BorderColor),
                    colors = CardDefaults.cardColors(containerColor = LightSurface)
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(item.iconBg),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(item.icon, contentDescription = item.title, tint = item.iconTint, modifier = Modifier.size(18.dp))
                            }
                            Column {
                                Text(item.title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text(item.subtitle, fontSize = 12.sp, color = TextSecondary)
                            }
                        }

                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = "Go",
                            tint = BorderColor,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            // Logout Action
            item {
                Button(
                    onClick = {
                        localRepository.saveSession(null)
                        SupabaseClient.setSession(null)
                        onLogout()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PinkPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Log Out Account", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }

        // Details dialog if an item is clicked
        if (activeDialogContent != null && activeDialogTitle != null) {
            Dialog(onDismissRequest = {
                activeDialogContent = null
                activeDialogTitle = null
            }) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = LightSurface),
                    border = BorderStroke(1.dp, BorderColor)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(activeDialogTitle!!, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = DarkBlueSecondary)
                        Text(activeDialogContent!!, fontSize = 14.sp, lineHeight = 20.sp, color = TextPrimary)
                        Button(
                            onClick = {
                                activeDialogContent = null
                                activeDialogTitle = null
                            },
                            modifier = Modifier.align(Alignment.End),
                            colors = ButtonDefaults.buttonColors(containerColor = PinkPrimary)
                        ) {
                            Text("OK", color = Color.White)
                        }
                    }
                }
            }
        }
    }
}

// Data Class Helper
data class MenuItem(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val iconBg: Color,
    val iconTint: Color,
    val onClick: () -> Unit
)
