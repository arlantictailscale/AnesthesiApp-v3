package id.my.anesthesiapp.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.ui.screens.AuthScreen
import id.my.anesthesiapp.app.ui.screens.DashboardScreen
import id.my.anesthesiapp.app.ui.screens.CbtQuizScreen
import id.my.anesthesiapp.app.ui.screens.OsceChatScreen
import id.my.anesthesiapp.app.ui.screens.CalculatorScreen
import id.my.anesthesiapp.app.ui.screens.GuidelinesScreen
import id.my.anesthesiapp.app.ui.screens.CaseDetailScreen
import id.my.anesthesiapp.app.ui.screens.CaseWizardScreen
import id.my.anesthesiapp.app.ui.screens.CbtCreateScreen

@Composable
fun MainNavigation() {
    val context = LocalContext.current
    val localRepository = remember { LocalRepository(context.applicationContext) }
    
    // Check if session is already stored
    val session = remember { localRepository.getSession() }
    val startDestination = if (session != null) {
        SupabaseClient.setSession(session)
        DashboardDestination
    } else {
        AuthDestination
    }

    val backStack = rememberNavBackStack(startDestination)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        modifier = Modifier.fillMaxSize(),
        entryProvider = entryProvider {
            entry<AuthDestination> {
                AuthScreen(
                    localRepository = localRepository,
                    onAuthSuccess = {
                        backStack.add(DashboardDestination)
                    }
                )
            }
            entry<DashboardDestination> {
                DashboardScreen(
                    localRepository = localRepository,
                    onNavigateToCbt = { packageId ->
                        backStack.add(CbtQuizDestination(packageId))
                    },
                    onNavigateToCbtCreate = {
                        backStack.add(CbtCreateDestination)
                    },
                    onNavigateToOsce = { stationId ->
                        backStack.add(OsceChatDestination(stationId))
                    },
                    onNavigateToCalculator = {
                        backStack.add(CalculatorDestination)
                    },
                    onNavigateToGuidelines = {
                        backStack.add(GuidelinesDestination)
                    },
                    onNavigateToCaseDetail = { caseId ->
                        backStack.add(CaseDetailDestination(caseId))
                    },
                    onNavigateToCaseWizard = { caseId ->
                        backStack.add(CaseWizardDestination(caseId))
                    },
                    onLogout = {
                        backStack.add(AuthDestination)
                    }
                )
            }
            entry<CbtQuizDestination> { destination ->
                CbtQuizScreen(
                    packageId = destination.packageId,
                    localRepository = localRepository,
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<CbtCreateDestination> {
                CbtCreateScreen(
                    localRepository = localRepository,
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<OsceChatDestination> { destination ->
                OsceChatScreen(
                    stationId = destination.stationId,
                    localRepository = localRepository,
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<CalculatorDestination> {
                CalculatorScreen(
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<GuidelinesDestination> {
                GuidelinesScreen(
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<CaseDetailDestination> { destination ->
                CaseDetailScreen(
                    caseId = destination.caseId,
                    localRepository = localRepository,
                    onNavigateToEdit = { caseId ->
                        backStack.add(CaseWizardDestination(caseId))
                    },
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
            entry<CaseWizardDestination> { destination ->
                CaseWizardScreen(
                    caseId = destination.caseId,
                    localRepository = localRepository,
                    onBack = {
                        backStack.removeLastOrNull()
                    }
                )
            }
        }
    )
}
