package id.my.anesthesiapp.app.data

import android.content.Context
import id.my.anesthesiapp.app.data.models.AnesthesiaCase
import id.my.anesthesiapp.app.data.models.Session
import id.my.anesthesiapp.app.data.models.CbtPackage
import id.my.anesthesiapp.app.data.models.CbtAttempt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

class LocalRepository(private val context: Context) {
    private val sharedPreferences = context.getSharedPreferences("AnesthesiAppPrefs", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }
    private val casesFile = File(context.filesDir, "cases.json")
    private val cbtPackagesFile = File(context.filesDir, "cbt_packages.json")
    private val cbtAttemptsFile = File(context.filesDir, "cbt_attempts.json")

    fun saveSession(session: Session?) {
        val editor = sharedPreferences.edit()
        if (session != null) {
            val sessionJson = json.encodeToString(Session.serializer(), session)
            editor.putString("user_session", sessionJson)
        } else {
            editor.remove("user_session")
        }
        editor.apply()
    }

    fun getSession(): Session? {
        val sessionJson = sharedPreferences.getString("user_session", null) ?: return null
        return try {
            json.decodeFromString(Session.serializer(), sessionJson)
        } catch (e: Exception) {
            null
        }
    }

    // Case Caching
    suspend fun getLocalCases(): List<AnesthesiaCase> = withContext(Dispatchers.IO) {
        if (!casesFile.exists()) return@withContext emptyList()
        return@withContext try {
            val text = casesFile.readText()
            json.decodeFromString<List<AnesthesiaCase>>(text)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun saveLocalCases(cases: List<AnesthesiaCase>): Unit = withContext(Dispatchers.IO) {
        try {
            val text = json.encodeToString(cases)
            casesFile.writeText(text)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun addLocalCase(caseItem: AnesthesiaCase): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCases().toMutableList()
        val index = currentList.indexOfFirst { it.id == caseItem.id }
        if (index != -1) {
            currentList[index] = caseItem
        } else {
            currentList.add(caseItem)
        }
        saveLocalCases(currentList)
    }

    suspend fun removeLocalCase(caseId: String): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCases().toMutableList()
        currentList.removeAll { it.id == caseId }
        saveLocalCases(currentList)
    }

    // CBT Package Caching
    suspend fun getLocalCbtPackages(): List<CbtPackage> = withContext(Dispatchers.IO) {
        if (!cbtPackagesFile.exists()) return@withContext emptyList()
        return@withContext try {
            val text = cbtPackagesFile.readText()
            json.decodeFromString<List<CbtPackage>>(text)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun saveLocalCbtPackages(packages: List<CbtPackage>): Unit = withContext(Dispatchers.IO) {
        try {
            val text = json.encodeToString(packages)
            cbtPackagesFile.writeText(text)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun addLocalCbtPackage(cbtPackage: CbtPackage): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCbtPackages().toMutableList()
        val index = currentList.indexOfFirst { it.id == cbtPackage.id }
        if (index != -1) {
            currentList[index] = cbtPackage
        } else {
            currentList.add(cbtPackage)
        }
        saveLocalCbtPackages(currentList)
    }

    suspend fun removeLocalCbtPackage(packageId: String): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCbtPackages().toMutableList()
        currentList.removeAll { it.id == packageId }
        saveLocalCbtPackages(currentList)
    }

    // CBT Attempt Caching
    suspend fun getLocalCbtAttempts(): List<CbtAttempt> = withContext(Dispatchers.IO) {
        if (!cbtAttemptsFile.exists()) return@withContext emptyList()
        return@withContext try {
            val text = cbtAttemptsFile.readText()
            json.decodeFromString<List<CbtAttempt>>(text)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun saveLocalCbtAttempts(attempts: List<CbtAttempt>): Unit = withContext(Dispatchers.IO) {
        try {
            val text = json.encodeToString(attempts)
            cbtAttemptsFile.writeText(text)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun addLocalCbtAttempt(attempt: CbtAttempt): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCbtAttempts().toMutableList()
        val index = currentList.indexOfFirst { it.id == attempt.id }
        if (index != -1) {
            currentList[index] = attempt
        } else {
            currentList.add(attempt)
        }
        saveLocalCbtAttempts(currentList)
    }

    suspend fun removeLocalCbtAttempt(attemptId: String): Unit = withContext(Dispatchers.IO) {
        val currentList = getLocalCbtAttempts().toMutableList()
        currentList.removeAll { it.id == attemptId }
        saveLocalCbtAttempts(currentList)
    }
}
