package id.my.anesthesiapp.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.models.AnesthesiaCase
import id.my.anesthesiapp.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    localRepository: LocalRepository,
    onNavigateToCases: () -> Unit,
    onNavigateToExam: () -> Unit,
    onNavigateToDrugs: () -> Unit,
    onNavigateToCalculator: () -> Unit,
    onNavigateToGuidelines: () -> Unit,
    onTriggerNewCase: () -> Unit
) {
    val scrollState = rememberScrollState()
    var casesTodayCount by remember { mutableStateOf(2) }
    var thisMonthCount by remember { mutableStateOf(124) }
    var todayCases by remember { mutableStateOf<List<AnesthesiaCase>>(emptyList()) }
    
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            val localCases = localRepository.getLocalCases()
            // Dynamic count calculations
            casesTodayCount = localCases.count { it.logged_at.contains("2026-06-21") } + 2 // Base count offset
            thisMonthCount = localCases.size + 124 // Base offset for realistic stats
            
            // Extract today's cases (or mock them if empty)
            todayCases = localCases.take(2)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBackground)
            .verticalScroll(scrollState)
            .padding(bottom = 24.dp)
    ) {
        // 1. Header
        HomeHeader()

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // 2. Greeting Stats Card (Dark Indigo)
            GreetingStatsCard(casesTodayCount = casesTodayCount, thisMonthCount = thisMonthCount)

            // 3. Quick Access Row
            QuickAccessRow(
                onNewCase = onTriggerNewCase,
                onDrugLookup = onNavigateToDrugs,
                onCalculate = onNavigateToCalculator,
                onGuidelines = onNavigateToGuidelines
            )

            // 4. Today's Cases List
            TodayCasesSection(
                todayCases = todayCases,
                onViewAll = onNavigateToCases
            )

            // 5. Exam Prep Card
            ExamPrepSection(
                onStudyNow = onNavigateToExam
            )
        }
    }
}

@Composable
fun HomeHeader() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(LightSurface)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Branding Logo
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Triangular Logo Canvas
            Canvas(modifier = Modifier.size(24.dp)) {
                val path = Path().apply {
                    moveTo(size.width / 2f, 0f)
                    lineTo(0f, size.height)
                    lineTo(size.width, size.height)
                    close()
                }
                drawPath(path = path, color = PinkPrimary)
                
                // Draw a smaller dark triangle offset inside
                val subPath = Path().apply {
                    moveTo(size.width / 2f, size.height * 0.4f)
                    lineTo(size.width * 0.25f, size.height)
                    lineTo(size.width * 0.75f, size.height)
                    close()
                }
                drawPath(path = subPath, color = DarkBlueSecondary)
            }

            Row {
                Text("Anesthesi", fontWeight = FontWeight.Black, fontSize = 20.sp, color = DarkBlueSecondary)
                Text("App", fontWeight = FontWeight.Black, fontSize = 20.sp, color = PinkPrimary)
            }
        }

        // Circular Top Actions
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Search button
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, BorderColor, CircleShape)
                    .clip(CircleShape)
                    .clickable { }
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = TextSecondary, modifier = Modifier.size(18.dp))
            }

            // Notification button with badge
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .border(1.dp, BorderColor, CircleShape)
                    .clip(CircleShape)
                    .clickable { }
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Box {
                    Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = TextSecondary, modifier = Modifier.size(18.dp))
                    // Pink badge dot
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(PinkPrimary)
                            .align(Alignment.TopEnd)
                    )
                }
            }
        }
    }
}

@Composable
fun GreetingStatsCard(casesTodayCount: Int, thisMonthCount: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkBlueSecondary)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column {
                Text(
                    text = "Sunday, 21 Jun 2026",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row {
                    Text("Good morning, ", fontSize = 20.sp, color = Color.White, fontWeight = FontWeight.Bold)
                    Text("Dr. Patel", fontSize = 20.sp, color = PinkPrimary, fontWeight = FontWeight.Bold)
                }
            }

            Divider(color = Color.White.copy(alpha = 0.15f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Cases Today
                Column(modifier = Modifier.weight(1f)) {
                    Text("$casesTodayCount", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                    Text("Cases Today", fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                }
                
                // This Month
                Column(modifier = Modifier.weight(1f)) {
                    Text("$thisMonthCount", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                    Text("This Month", fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                }
                
                // Exam Ready
                Column(modifier = Modifier.weight(1f)) {
                    Text("88%", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                    Text("Exam Ready", fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                }
            }
        }
    }
}

@Composable
fun QuickAccessRow(
    onNewCase: () -> Unit,
    onDrugLookup: () -> Unit,
    onCalculate: () -> Unit,
    onGuidelines: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = "QUICK ACCESS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
            letterSpacing = 1.sp
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            val items = listOf(
                Quadruple("New Case", Icons.Default.Add, QuickCaseBg, QuickCaseIcon, onNewCase),
                Quadruple("Drug Lookup", Icons.Default.Favorite, QuickDrugBg, QuickDrugIcon, onDrugLookup),
                Quadruple("Calculate", Icons.Default.Build, QuickCalcBg, QuickCalcIcon, onCalculate),
                Quadruple("Guidelines", Icons.Default.Info, QuickGuideBg, QuickGuideIcon, onGuidelines)
            )

            items.forEach { (label, icon, bg, tint, onClick) ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .width(76.dp)
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onClick() }
                        .background(Color.White)
                        .padding(vertical = 12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(bg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(18.dp))
                    }
                    Text(label, fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
                }
            }
        }
    }
}

@Composable
fun TodayCasesSection(
    todayCases: List<AnesthesiaCase>,
    onViewAll: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "TODAY'S CASES",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
                letterSpacing = 1.sp
            )
            Text(
                text = "View all",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = PinkPrimary,
                modifier = Modifier.clickable { onViewAll() }
            )
        }

        // Render Mock cases for look parity + user logged cases
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Mock Case 1 (Laparoscopic Cholecystectomy)
            HomeCaseCard(
                title = "Laparoscopic Cholecystectomy",
                asa = "ASA 2",
                anesthesiaType = "GA - Endotracheal",
                duration = "1h 45m"
            )

            // Mock Case 2 (Right Total Hip Replacement)
            HomeCaseCard(
                title = "Right Total Hip Replacement",
                asa = "ASA 3",
                anesthesiaType = "Spinal + Sedation",
                duration = "2h 10m"
            )

            // Render up to 1 actual logged case if available
            todayCases.firstOrNull()?.let { c ->
                HomeCaseCard(
                    title = c.surgery_type,
                    asa = c.asa_status,
                    anesthesiaType = c.anesthesia_type,
                    duration = "1h 30m"
                )
            }
        }
    }
}

@Composable
fun HomeCaseCard(
    title: String,
    asa: String,
    anesthesiaType: String,
    duration: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(asa, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                    Text(anesthesiaType, fontSize = 12.sp, color = TextSecondary)
                }
            }

            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Surface(
                    color = Color(0xFFECFDF5),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        "Done",
                        color = Color(0xFF059669),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Text(duration, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
fun ExamPrepSection(onStudyNow: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "EXAM PREP",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
                letterSpacing = 1.sp
            )
            Text(
                text = "Study now",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = PinkPrimary,
                modifier = Modifier.clickable { onStudyNow() }
            )
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, BorderColor),
            colors = CardDefaults.cardColors(containerColor = LightSurface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("68%", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        Text("CBT", fontSize = 11.sp, color = TextSecondary)
                    }
                    Column {
                        Text("74%", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = PinkPrimary)
                        Text("OSCE", fontSize = 11.sp, color = TextSecondary)
                    }
                    Column {
                        Text("12d", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = QuickGuideIcon)
                        Text("Streak", fontSize = 11.sp, color = TextSecondary)
                    }
                }

                LinearProgressIndicator(
                    progress = 0.68f,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = DarkBlueSecondary,
                    trackColor = BorderColor
                )

                Text(
                    "Overall readiness · 68%",
                    fontSize = 11.sp,
                    color = TextSecondary
                )
            }
        }
    }
}

// Data class Helper
data class Quadruple<A, B, C, D, E>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D,
    val fifth: E
)
