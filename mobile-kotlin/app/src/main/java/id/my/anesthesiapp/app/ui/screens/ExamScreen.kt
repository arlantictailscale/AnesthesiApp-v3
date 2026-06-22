package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import id.my.anesthesiapp.app.data.models.OsceStation
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.StaticData
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.CbtAttempt
import id.my.anesthesiapp.app.data.models.CbtPackage
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamScreen(
    onNavigateToCbt: (String) -> Unit,
    onNavigateToCbtCreate: () -> Unit,
    onNavigateToOsce: (String) -> Unit,
    localRepository: LocalRepository
) {
    var selectedTabIndex by remember { mutableStateOf(0) }
    val tabs = listOf("CBT Board Prep", "OSCE AI Arena")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Exam Prep", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TabRow(
                selectedTabIndex = selectedTabIndex,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTabIndex == index,
                        onClick = { selectedTabIndex = index },
                        text = { Text(title, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
            ) {
                when (selectedTabIndex) {
                    0 -> CbtDashboard(
                        onNavigateToCbt = onNavigateToCbt,
                        onNavigateToCbtCreate = onNavigateToCbtCreate,
                        localRepository = localRepository
                    )
                    1 -> OsceSelector(onNavigateToOsce = onNavigateToOsce)
                }
            }
        }
    }
}

@Composable
fun CbtDashboard(
    onNavigateToCbt: (String) -> Unit,
    onNavigateToCbtCreate: () -> Unit,
    localRepository: LocalRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var packages by remember { mutableStateOf<List<CbtPackage>>(emptyList()) }
    var attempts by remember { mutableStateOf<List<CbtAttempt>>(emptyList()) }
    var ratings by remember { mutableStateOf<List<SupabaseClient.CbtRating>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var currentUserEmail by remember { mutableStateOf<String?>(null) }

    var selectedCbtTab by remember { mutableStateOf(0) } // 0: My Exams, 1: Community Hub

    fun loadData() {
        coroutineScope.launch {
            loading = true
            try {
                // Get current user email
                currentUserEmail = SupabaseClient.getSession()?.user?.email

                // Fetch remote data
                val remotePkgs = try {
                    SupabaseClient.fetchCbtPackages()
                } catch (e: Exception) {
                    emptyList()
                }

                val remoteAttempts = try {
                    SupabaseClient.fetchCbtAttempts()
                } catch (e: Exception) {
                    emptyList()
                }

                val remoteRatings = try {
                    SupabaseClient.fetchCbtRatings()
                } catch (e: Exception) {
                    emptyList()
                }

                // Fetch local cached data
                val localPkgs = localRepository.getLocalCbtPackages()
                val localAttempts = localRepository.getLocalCbtAttempts()

                // Merge and cache packages
                val allPkgs = (remotePkgs + StaticData.builtInCbtPackages + localPkgs).associateBy { it.id }.values.toList()
                packages = allPkgs
                localRepository.saveLocalCbtPackages(allPkgs.filter { it.creator_email != null })

                // Merge and cache attempts
                val allAttempts = (remoteAttempts + localAttempts).associateBy { it.id }.values.toList()
                    .sortedByDescending { it.created_at }
                attempts = allAttempts
                localRepository.saveLocalCbtAttempts(allAttempts)

                ratings = remoteRatings
            } catch (e: Exception) {
                Toast.makeText(context, "Error loading data: ${e.message}", Toast.LENGTH_LONG).show()
                // Offline fallback
                packages = (StaticData.builtInCbtPackages + localRepository.getLocalCbtPackages())
                    .associateBy { it.id }.values.toList()
                attempts = localRepository.getLocalCbtAttempts().sortedByDescending { it.created_at }
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Banner card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary,
                                MaterialTheme.colorScheme.primaryContainer
                            )
                        )
                    )
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                        color = Color.White.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = "PORTAL CBT PREP NASIONAL",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Text(
                        text = "Computer-Based Test Simulator",
                        color = Color.White,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = "Siapkan diri Anda untuk Ujian Kompetensi Nasional Anestesiologi dengan bank soal berkualitas tinggi.",
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Stats Dashboard
        val totalAttempts = attempts.size
        val averageScore = if (totalAttempts > 0) attempts.map { it.score }.average().toInt() else 0
        val passRate = if (totalAttempts > 0) (attempts.filter { it.score >= 70 }.size * 100) / totalAttempts else 0
        val highestScore = if (totalAttempts > 0) attempts.maxOf { it.score } else 0

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Statistik Belajar Anda", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Total Ujian",
                    value = totalAttempts.toString(),
                    subtitle = "Percobaan",
                    icon = Icons.Default.Description,
                    iconTint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Rata-rata",
                    value = "$averageScore%",
                    subtitle = if (averageScore >= 70) "Lulus" else "Belum Lulus",
                    icon = Icons.Default.TrendingUp,
                    iconTint = if (averageScore >= 70) Color(0xFF10B981) else Color(0xFFEF4444),
                    modifier = Modifier.weight(1f)
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Kelulusan",
                    value = "$passRate%",
                    subtitle = "Dari total",
                    icon = Icons.Default.CheckCircle,
                    iconTint = Color(0xFF10B981),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Tertinggi",
                    value = "$highestScore%",
                    subtitle = "Skor rekor",
                    icon = Icons.Default.EmojiEvents,
                    iconTint = Color(0xFFF59E0B),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Packages Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Paket Soal Ujian", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("Pilih latihan atau buat baru", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
            Button(
                onClick = onNavigateToCbtCreate,
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Buat Ujian", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Packages Tabs
        TabRow(
            selectedTabIndex = selectedCbtTab,
            containerColor = Color.Transparent,
            modifier = Modifier.clip(RoundedCornerShape(8.dp))
        ) {
            Tab(
                selected = selectedCbtTab == 0,
                onClick = { selectedCbtTab = 0 },
                text = { Text("Latihan Saya", fontSize = 13.sp, fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = selectedCbtTab == 1,
                onClick = { selectedCbtTab = 1 },
                text = { Text("Community Hub", fontSize = 13.sp, fontWeight = FontWeight.Bold) }
            )
        }

        if (loading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            val myOrOfficialPackages = packages.filter { pkg ->
                val isDefault = pkg.id == "default-national-exam"
                val isMine = pkg.creator_email != null && currentUserEmail != null && pkg.creator_email == currentUserEmail
                val isLocalOnly = pkg.creator_email == null
                isDefault || isMine || isLocalOnly
            }

            val communityPackages = packages.filter { pkg ->
                val isDefault = pkg.id == "default-national-exam"
                val isMine = pkg.creator_email != null && currentUserEmail != null && pkg.creator_email == currentUserEmail
                val isLocalOnly = pkg.creator_email == null
                !isDefault && !isMine && !isLocalOnly
            }

            val displayedPackages = if (selectedCbtTab == 0) myOrOfficialPackages else communityPackages

            if (displayedPackages.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Belum ada paket ujian.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    displayedPackages.forEach { pkg ->
                        val pkgAttempts = attempts.filter { it.package_id == pkg.id }
                        val high = if (pkgAttempts.isNotEmpty()) pkgAttempts.maxOf { it.score } else null
                        val isDefault = pkg.id == "default-national-exam"
                        val isCreator = pkg.creator_email != null && currentUserEmail != null && pkg.creator_email == currentUserEmail

                        // Calculate ratings
                        val pkgRatings = ratings.filter { it.package_id == pkg.id }
                        val avgRating = if (pkgRatings.isNotEmpty()) pkgRatings.map { it.rating }.average() else 0.0
                        val ratingCount = pkgRatings.size

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateToCbt(pkg.id) },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        color = if (isDefault) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = if (isDefault) "AnesthesiApp" else pkg.creator_email?.split("@")?.firstOrNull() ?: "Kustom",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isDefault) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Star,
                                            contentDescription = "Rating",
                                            tint = if (ratingCount > 0) Color(0xFFF59E0B) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Text(
                                            text = String.format(Locale.US, "%.1f", avgRating),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "($ratingCount)",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )

                                        if (isCreator) {
                                            Spacer(modifier = Modifier.width(4.dp))
                                            IconButton(
                                                onClick = {
                                                    coroutineScope.launch {
                                                        try {
                                                            SupabaseClient.deleteCbtPackage(pkg.id)
                                                            localRepository.removeLocalCbtPackage(pkg.id)
                                                            Toast.makeText(context, "Paket dihapus", Toast.LENGTH_SHORT).show()
                                                            loadData()
                                                        } catch (e: Exception) {
                                                            Toast.makeText(context, "Gagal menghapus: ${e.message}", Toast.LENGTH_LONG).show()
                                                        }
                                                    }
                                                },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Delete,
                                                    contentDescription = "Delete",
                                                    tint = MaterialTheme.colorScheme.error,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                }

                                Text(
                                    text = pkg.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Text(
                                    text = pkg.description,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.HelpOutline,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "${pkg.questions.size} Pertanyaan",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }

                                    if (high != null) {
                                        Surface(
                                            color = Color(0xFF10B981).copy(alpha = 0.1f),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "Terbaik: $high%",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF10B981),
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    } else {
                                        Text(
                                            text = "Mulai Latihan →",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Attempts History
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Riwayat Percobaan CBT", fontWeight = FontWeight.Bold, fontSize = 16.sp)

            if (attempts.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Belum ada riwayat pengerjaan.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column {
                        attempts.forEachIndexed { index, attempt ->
                            val packageObj = packages.find { it.id == attempt.package_id }
                            val packageName = packageObj?.name ?: "Paket Kustom"

                            val minutes = attempt.time_spent / 60
                            val seconds = attempt.time_spent % 60
                            val timeStr = "${minutes}m ${seconds}s"

                            // Format Date
                            val dateStr = try {
                                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                val outputFormat = SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault())
                                val parsed = inputFormat.parse(attempt.created_at)
                                if (parsed != null) outputFormat.format(parsed) else attempt.created_at
                            } catch (e: Exception) {
                                attempt.created_at.split("T").firstOrNull() ?: attempt.created_at
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = packageName,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.CalendarToday, contentDescription = null, modifier = Modifier.size(10.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Text(dateStr, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(10.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Text(timeStr, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                    }
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Surface(
                                        color = if (attempt.score >= 70) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = "${attempt.score}% · ${if (attempt.score >= 70) "LULUS" else "GAGAL"}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (attempt.score >= 70) Color(0xFF10B981) else Color(0xFFEF4444),
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }

                                    IconButton(
                                        onClick = {
                                            coroutineScope.launch {
                                                try {
                                                    SupabaseClient.deleteCbtAttempt(attempt.id)
                                                    localRepository.removeLocalCbtAttempt(attempt.id)
                                                    Toast.makeText(context, "Riwayat dihapus", Toast.LENGTH_SHORT).show()
                                                    loadData()
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Gagal menghapus riwayat: ${e.message}", Toast.LENGTH_LONG).show()
                                                }
                                            }
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Hapus Riwayat",
                                            tint = MaterialTheme.colorScheme.error,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                            if (index < attempts.size - 1) {
                                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(18.dp))
            }
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
            Text(subtitle, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        }
    }
}

@Composable
fun OsceSelector(onNavigateToOsce: (String) -> Unit) {
    val stations = remember { StaticData.builtInOsceStations }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "OSCE Interactive AI Arena",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Test your clinical reasoning against an AI examiner mimicking real board examiners under simulated time constraints.",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
            )
        }

        items(stations) { station ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToOsce(station.id) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(station.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Surface(
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = station.category,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        station.scenario,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        maxLines = 2
                    )
                    Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Time limit: ${station.duration_minutes} minutes",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Enter Arena →",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

