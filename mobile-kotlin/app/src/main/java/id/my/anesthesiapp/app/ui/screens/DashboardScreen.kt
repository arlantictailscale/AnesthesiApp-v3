package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.outlined.Assignment
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Medication
import androidx.compose.material.icons.outlined.Psychology
import androidx.compose.material.icons.outlined.MoreHoriz
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
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.ui.theme.DarkBlueSecondary
import id.my.anesthesiapp.app.ui.theme.TextSecondary
import id.my.anesthesiapp.app.ui.theme.BorderColor

private data class NavigationTabItem(
    val label: String,
    val activeIcon: ImageVector,
    val inactiveIcon: ImageVector,
    val index: Int
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    localRepository: LocalRepository,
    onNavigateToCbt: (String) -> Unit,
    onNavigateToCbtCreate: () -> Unit,
    onNavigateToOsce: (String) -> Unit,
    onNavigateToCalculator: () -> Unit,
    onNavigateToGuidelines: () -> Unit,
    onNavigateToCaseDetail: (String) -> Unit,
    onNavigateToCaseWizard: (String?) -> Unit,
    onLogout: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(76.dp)
            ) {
                Column {
                    // Thin top divider line matching the second mockup
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(BorderColor.copy(alpha = 0.5f))
                    )
                    
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .navigationBarsPadding(),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val tabs = listOf(
                            NavigationTabItem(
                                label = "Home",
                                activeIcon = Icons.Default.Home,
                                inactiveIcon = Icons.Outlined.Home,
                                index = 0
                            ),
                            NavigationTabItem(
                                label = "Cases",
                                activeIcon = Icons.AutoMirrored.Filled.Assignment,
                                inactiveIcon = Icons.AutoMirrored.Outlined.Assignment,
                                index = 1
                            ),
                            NavigationTabItem(
                                label = "Drugs",
                                activeIcon = Icons.Default.Medication,
                                inactiveIcon = Icons.Outlined.Medication,
                                index = 2
                            ),
                            NavigationTabItem(
                                label = "Exam",
                                activeIcon = Icons.Default.Psychology,
                                inactiveIcon = Icons.Outlined.Psychology,
                                index = 3
                            ),
                            NavigationTabItem(
                                label = "More",
                                activeIcon = Icons.Default.MoreHoriz,
                                inactiveIcon = Icons.Outlined.MoreHoriz,
                                index = 4
                            )
                        )

                        tabs.forEach { item ->
                            val isSelected = selectedTab == item.index
                            val interactionSource = remember { MutableInteractionSource() }

                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clickable(
                                        interactionSource = interactionSource,
                                        indication = null
                                    ) {
                                        selectedTab = item.index
                                    },
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                if (isSelected) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(DarkBlueSecondary),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = item.activeIcon,
                                            contentDescription = item.label,
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier.size(36.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = item.inactiveIcon,
                                            contentDescription = item.label,
                                            tint = TextSecondary,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(2.dp))
                                
                                Text(
                                    text = item.label,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) DarkBlueSecondary else TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> HomeScreen(
                    localRepository = localRepository,
                    onNavigateToCases = { selectedTab = 1 },
                    onNavigateToExam = { selectedTab = 3 },
                    onNavigateToDrugs = { selectedTab = 2 },
                    onNavigateToCalculator = onNavigateToCalculator,
                    onNavigateToGuidelines = onNavigateToGuidelines,
                    onTriggerNewCase = { onNavigateToCaseWizard(null) }
                )
                1 -> CasesScreen(
                    localRepository = localRepository,
                    onNavigateToCaseDetail = onNavigateToCaseDetail,
                    onNavigateToCaseWizard = onNavigateToCaseWizard
                )
                2 -> DrugsScreen()
                3 -> ExamScreen(
                    onNavigateToCbt = onNavigateToCbt,
                    onNavigateToCbtCreate = onNavigateToCbtCreate,
                    onNavigateToOsce = onNavigateToOsce,
                    localRepository = localRepository
                )
                4 -> MoreScreen(
                    localRepository = localRepository,
                    onNavigateToGuidelines = onNavigateToGuidelines,
                    onNavigateToCalculator = onNavigateToCalculator,
                    onLogout = onLogout
                )
            }
        }
    }
}
