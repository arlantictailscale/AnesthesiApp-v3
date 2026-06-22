package id.my.anesthesiapp.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Session(
    val access_token: String,
    val token_type: String,
    val expires_in: Long,
    val refresh_token: String,
    val user: User
)

@Serializable
data class User(
    val id: String,
    val email: String
)

@Serializable
data class InvestigationData(
    val enabled: Boolean = false,
    val result: String = ""
)

@Serializable
data class AnesthesiaCase(
    val id: String,
    val user_id: String? = null,
    val created_at: String? = null,
    val procedure_date: String = "",
    val patient_name: String = "",
    val sex: String? = "",
    val age: Int? = null,
    val medical_record_number: String = "",
    val room: String = "",
    val weight_kg: Double? = null,
    val height_cm: Double? = null,
    val bmi: Double? = null,
    val diagnosis: String = "",
    val procedure_intervention: String = "",
    val allergy: String = "",
    val medication: String = "",
    val past_illness: String = "",
    val last_meal: String = "",
    val event: String = "",
    val b1_breathing: String = "",
    val b2_blood: String = "",
    val b3_brain: String = "",
    val b4_bladder: String = "",
    val b5_bowel: String = "",
    val b6_body_temp: String = "",
    val others: String = "",
    val inv_laboratory: InvestigationData = InvestigationData(),
    val inv_xray: InvestigationData = InvestigationData(),
    val inv_ecg: InvestigationData = InvestigationData(),
    val inv_ct: InvestigationData = InvestigationData(),
    val inv_mri: InvestigationData = InvestigationData(),
    val inv_other_label: String = "",
    val inv_other_result: String = "",
    val assessment: String = "",
    val planning: String = "",
    val anesthesia_management: String = "",
    val regimen_pre_induction: String = "",
    val regimen_induction: String = "",
    val regimen_maintenance: String = "",
    val analgesia_pre_op: String = "",
    val analgesia_intra_op: String = "",
    val analgesia_post_op: String = "",
    val post_induction_side_effects: String = "",
    val ventilator_settings: String = "",
    val hemodynamics_intra: String = "",
    val duration_surgery: String = "",
    val bleeding: String = "",
    val transfusion: String = "",
    val urine_output: String = "",
    val fluid_balance: String = "",
    val post_op_room: String? = "",
    val hemodynamics_post: String = "",
    val lab_results_post: String = "",
    val is_shared: Boolean = true,
    val status: String? = "completed",
    val error_message: String? = null,
    val ai_model: String? = null,
    val ai_duration_seconds: Double? = null,
    val offline: Boolean = false
) {
    val surgery_type: String get() = procedure_intervention
    val patient_age: Int get() = age ?: 0
    val patient_gender: String get() = sex ?: "Male"
    val asa_status: String get() = assessment.split(";").firstOrNull()?.trim() ?: "ASA I"
    val anesthesia_type: String get() = anesthesia_management
    val complications: String get() = event
    val logged_at: String get() = procedure_date
}

@Serializable
data class Drug(
    val id: String? = null,
    val name: String,
    val category: String, // "induction" or "vasoactive"
    val onset: String,
    val duration: String,
    val dosage: String,
    val mechanism: String? = null,
    val pk: String? = null,
    val pd: String? = null,
    val considerations: String? = null,
    val contraindications: String? = null,
    val high_alert: Boolean = false
)

@Serializable
data class Guideline(
    val id: String,
    val title: String,
    val category: String,
    val content: String
)

@Serializable
data class OsceStation(
    val id: String,
    val title: String,
    val category: String,
    val duration_minutes: Int,
    val scenario: String,
    val patient_profile: String,
    val difficulty: String
)

@Serializable
data class ChatMessage(
    val role: String, // "candidate" or "examiner"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class OsceAttempt(
    val id: String,
    val user_id: String? = null,
    val station_id: String,
    val station_title: String,
    val score: Int,
    val feedback: String,
    val evaluation_details: String? = null, // JSON string
    val created_at: String
)

@Serializable
data class AspectEvaluation(
    val score: Int,
    val feedback: String
)

@Serializable
data class ScoreEvaluation(
    val score: Int,
    val globalFeedback: String,
    val aspects: Map<String, AspectEvaluation> = emptyMap()
)

// Request payloads
@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class SignUpRequest(
    val email: String,
    val password: String
)

@Serializable
data class OsceChatRequest(
    val messages: List<ChatMessage>,
    val scenario: String,
    val patientProfile: String
)

@Serializable
data class OsceChatResponse(
    val reply: String
)

@Serializable
data class OsceScoreRequest(
    val messages: List<ChatMessage>,
    val scenario: String,
    val patientProfile: String
)

@Serializable
data class CbtQuestion(
    val id: String,
    val text: String,
    val options: Map<String, String>, // A, B, C, D, E
    val correctOption: String, // "A" | "B" | "C" | "D" | "E"
    val category: String,
    val explanation: String
)

@Serializable
data class CbtPackage(
    val id: String,
    val name: String,
    val description: String,
    val questions: List<CbtQuestion>,
    val creator_email: String? = null
)

@Serializable
data class CbtAttempt(
    val id: String,
    val user_id: String? = null,
    val package_id: String,
    val score: Int,
    val total_questions: Int,
    val correct_count: Int,
    val time_spent: Int,
    val answers: Map<String, String>, // Map of question index -> answer option
    val created_at: String
)

@Serializable
data class CbtComment(
    val id: String,
    val user_id: String,
    val user_email: String,
    val package_id: String,
    val comment: String,
    val created_at: String
)
