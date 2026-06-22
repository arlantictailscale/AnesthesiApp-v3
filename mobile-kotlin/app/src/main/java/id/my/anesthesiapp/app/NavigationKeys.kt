package id.my.anesthesiapp.app

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object AuthDestination : NavKey

@Serializable
data object DashboardDestination : NavKey

@Serializable
data class CbtQuizDestination(val packageId: String) : NavKey

@Serializable
data class OsceChatDestination(val stationId: String) : NavKey

@Serializable
data object CalculatorDestination : NavKey

@Serializable
data object GuidelinesDestination : NavKey

@Serializable
data class CaseDetailDestination(val caseId: String) : NavKey

@Serializable
data class CaseWizardDestination(val caseId: String? = null) : NavKey

@Serializable
data object CbtCreateDestination : NavKey

