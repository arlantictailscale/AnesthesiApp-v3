package id.my.anesthesiapp.app.data.api

import id.my.anesthesiapp.app.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

object SupabaseClient {
    private const val SUPABASE_URL = "https://shqthvtlwqkshccetgcz.supabase.co"
    private const val ANON_KEY = "sb_publishable_SW4s77g-lJeEg4Kgk_JUyQ_o-tH1zVC"
    
    private val client = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private var currentSession: Session? = null

    fun setSession(session: Session?) {
        currentSession = session
    }

    fun getSession(): Session? = currentSession
    
    fun getAuthHeader(): String {
        return currentSession?.access_token?.let { "Bearer $it" } ?: "Bearer $ANON_KEY"
    }

    suspend fun login(email: String, password: String): Session = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/auth/v1/token?grant_type=password"
        val requestBodyJson = json.encodeToString(LoginRequest.serializer(), LoginRequest(email, password))
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Login failed (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty login response")
            val session = json.decodeFromString(Session.serializer(), bodyString)
            currentSession = session
            session
        }
    }

    suspend fun signUp(email: String, password: String): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/auth/v1/signup"
        val requestBodyJson = json.encodeToString(SignUpRequest.serializer(), SignUpRequest(email, password))
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Registration failed (HTTP ${response.code}): $errBody")
            }
        }
    }

    suspend fun fetchCases(userId: String): List<AnesthesiaCase> = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/anesthesia_cases?select=*&user_id=eq.$userId&order=created_at.desc"
        
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch cases (HTTP ${response.code})")
            }
            val bodyString = response.body?.string() ?: "[]"
            json.decodeFromString<List<AnesthesiaCase>>(bodyString)
        }
    }

    suspend fun saveCase(anesthesiaCase: AnesthesiaCase): AnesthesiaCase = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/anesthesia_cases"
        val requestBodyJson = json.encodeToString(AnesthesiaCase.serializer(), anesthesiaCase)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation,resolution=merge-duplicates")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to save case (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response saving case")
            val list = json.decodeFromString<List<AnesthesiaCase>>(bodyString)
            list.firstOrNull() ?: anesthesiaCase
        }
    }

    suspend fun deleteCase(caseId: String): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/anesthesia_cases?id=eq.$caseId"
        
        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to delete case (HTTP ${response.code})")
            }
        }
    }

    suspend fun deleteCases(caseIds: List<String>): Unit = withContext(Dispatchers.IO) {
        if (caseIds.isEmpty()) return@withContext
        val url = "$SUPABASE_URL/rest/v1/anesthesia_cases?id=in.(${caseIds.joinToString(",")})"
        
        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to delete cases (HTTP ${response.code})")
            }
        }
    }

    suspend fun aiPopulate(description: String, model: String): String = withContext(Dispatchers.IO) {
        val url = "https://anesthesiapp.my.id/api/ai/populate"
        
        @Serializable
        data class PopulateRequest(val description: String, val model: String)
        
        val payload = PopulateRequest(description, model)
        val requestBodyJson = json.encodeToString(PopulateRequest.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("AI Populate failed (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response from AI Populate")
            @Serializable
            data class PopulateResponse(val success: Boolean, val caseId: String)
            val res = json.decodeFromString<PopulateResponse>(bodyString)
            res.caseId
        }
    }

    suspend fun insertOsceAttempt(attempt: OsceAttempt): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/osce_attempts"
        val requestBodyJson = json.encodeToString(OsceAttempt.serializer(), attempt)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to record OSCE attempt (HTTP ${response.code}): $errBody")
            }
        }
    }

    suspend fun fetchCbtPackages(): List<CbtPackage> = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_packages?select=*"
        
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch CBT packages (HTTP ${response.code})")
            }
            val bodyString = response.body?.string() ?: "[]"
            json.decodeFromString<List<CbtPackage>>(bodyString)
        }
    }

    suspend fun saveCbtPackage(cbtPackage: CbtPackage): CbtPackage = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_packages"
        
        @Serializable
        data class SaveCbtPackagePayload(
            val id: String,
            val name: String,
            val description: String,
            val questions: List<CbtQuestion>,
            val user_id: String?,
            val creator_email: String?
        )
        
        val session = getSession()
        val payload = SaveCbtPackagePayload(
            id = cbtPackage.id,
            name = cbtPackage.name,
            description = cbtPackage.description,
            questions = cbtPackage.questions,
            user_id = session?.user?.id,
            creator_email = session?.user?.email ?: cbtPackage.creator_email
        )
        
        val requestBodyJson = json.encodeToString(SaveCbtPackagePayload.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation,resolution=merge-duplicates")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to save CBT package (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response saving CBT package")
            val list = json.decodeFromString<List<CbtPackage>>(bodyString)
            list.firstOrNull() ?: cbtPackage
        }
    }

    suspend fun deleteCbtPackage(packageId: String): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_packages?id=eq.$packageId"
        
        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to delete CBT package (HTTP ${response.code})")
            }
        }
    }

    suspend fun fetchCbtAttempts(): List<CbtAttempt> = withContext(Dispatchers.IO) {
        val session = getSession() ?: return@withContext emptyList()
        val url = "$SUPABASE_URL/rest/v1/cbt_attempts?select=*&user_id=eq.${session.user.id}&order=created_at.desc"
        
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch CBT attempts (HTTP ${response.code})")
            }
            val bodyString = response.body?.string() ?: "[]"
            json.decodeFromString<List<CbtAttempt>>(bodyString)
        }
    }

    suspend fun saveCbtAttempt(attempt: CbtAttempt): CbtAttempt = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_attempts"
        
        @Serializable
        data class SaveCbtAttemptPayload(
            val id: String,
            val user_id: String?,
            val package_id: String,
            val score: Int,
            val total_questions: Int,
            val correct_count: Int,
            val time_spent: Int,
            val answers: Map<String, String>
        )
        
        val session = getSession()
        val payload = SaveCbtAttemptPayload(
            id = attempt.id,
            user_id = session?.user?.id ?: attempt.user_id,
            package_id = attempt.package_id,
            score = attempt.score,
            total_questions = attempt.total_questions,
            correct_count = attempt.correct_count,
            time_spent = attempt.time_spent,
            answers = attempt.answers
        )
        
        val requestBodyJson = json.encodeToString(SaveCbtAttemptPayload.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation,resolution=merge-duplicates")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to save CBT attempt (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response saving CBT attempt")
            val list = json.decodeFromString<List<CbtAttempt>>(bodyString)
            list.firstOrNull() ?: attempt
        }
    }

    suspend fun fetchCbtComments(packageId: String): List<CbtComment> = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_comments?select=*&package_id=eq.$packageId&order=created_at.desc"
        
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch CBT comments (HTTP ${response.code})")
            }
            val bodyString = response.body?.string() ?: "[]"
            json.decodeFromString<List<CbtComment>>(bodyString)
        }
    }

    suspend fun saveCbtComment(packageId: String, comment: String): CbtComment = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_comments"
        
        @Serializable
        data class SaveCbtCommentPayload(
            val user_id: String,
            val user_email: String,
            val package_id: String,
            val comment: String
        )
        
        val session = getSession() ?: throw IOException("Not logged in")
        val payload = SaveCbtCommentPayload(
            user_id = session.user.id,
            user_email = session.user.email,
            package_id = packageId,
            comment = comment
        )
        
        val requestBodyJson = json.encodeToString(SaveCbtCommentPayload.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to save CBT comment (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response saving CBT comment")
            val list = json.decodeFromString<List<CbtComment>>(bodyString)
            list.firstOrNull() ?: throw IOException("Failed to parse CBT comment")
        }
    }

    suspend fun rateCbtPackage(packageId: String, rating: Int): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_ratings"
        
        @Serializable
        data class SaveCbtRatingPayload(
            val user_id: String,
            val package_id: String,
            val rating: Int
        )
        
        val session = getSession() ?: throw IOException("Not logged in")
        val payload = SaveCbtRatingPayload(
            user_id = session.user.id,
            package_id = packageId,
            rating = rating
        )
        
        val requestBodyJson = json.encodeToString(SaveCbtRatingPayload.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "resolution=merge-duplicates")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("Failed to rate CBT package (HTTP ${response.code}): $errBody")
            }
        }
    }

    @Serializable
    data class CbtRating(
        val package_id: String,
        val rating: Int
    )

    suspend fun fetchCbtRatings(): List<CbtRating> = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_ratings?select=package_id,rating"
        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch CBT ratings (HTTP ${response.code})")
            }
            val bodyString = response.body?.string() ?: "[]"
            json.decodeFromString<List<CbtRating>>(bodyString)
        }
    }

    suspend fun deleteCbtAttempt(attemptId: String): Unit = withContext(Dispatchers.IO) {
        val url = "$SUPABASE_URL/rest/v1/cbt_attempts?id=eq.$attemptId"
        val request = Request.Builder()
            .url(url)
            .delete()
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", getAuthHeader())
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to delete CBT attempt (HTTP ${response.code})")
            }
        }
    }
}
