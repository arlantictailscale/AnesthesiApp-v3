package id.my.anesthesiapp.app.data.api

import id.my.anesthesiapp.app.data.models.ChatMessage
import id.my.anesthesiapp.app.data.models.OsceChatRequest
import id.my.anesthesiapp.app.data.models.OsceChatResponse
import id.my.anesthesiapp.app.data.models.OsceScoreRequest
import id.my.anesthesiapp.app.data.models.ScoreEvaluation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

object AiClient {
    private const val BASE_URL = "https://anesthesiapp.my.id"
    
    // AI scoring and evaluation might take a bit longer, so we configure longer timeouts
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
        
    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun sendChatMessage(
        messages: List<ChatMessage>,
        scenario: String,
        patientProfile: String
    ): String = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/api/ai/osce-chat"
        val payload = OsceChatRequest(messages, scenario, patientProfile)
        val requestBodyJson = json.encodeToString(OsceChatRequest.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("AI Chat failed (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response from AI Chat")
            val chatResponse = json.decodeFromString(OsceChatResponse.serializer(), bodyString)
            chatResponse.reply
        }
    }

    suspend fun getEvaluation(
        messages: List<ChatMessage>,
        scenario: String,
        patientProfile: String
    ): ScoreEvaluation = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/api/ai/osce-score"
        val payload = OsceScoreRequest(messages, scenario, patientProfile)
        val requestBodyJson = json.encodeToString(OsceScoreRequest.serializer(), payload)
        
        val request = Request.Builder()
            .url(url)
            .post(requestBodyJson.toRequestBody(jsonMediaType))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val errBody = response.body?.string() ?: ""
                throw IOException("AI evaluation failed (HTTP ${response.code}): $errBody")
            }
            val bodyString = response.body?.string() ?: throw IOException("Empty response from AI Evaluation")
            json.decodeFromString(ScoreEvaluation.serializer(), bodyString)
        }
    }
}
