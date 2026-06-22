package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.StaticData
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.CbtAttempt
import id.my.anesthesiapp.app.data.models.CbtComment
import id.my.anesthesiapp.app.data.models.CbtPackage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CbtQuizScreen(
    packageId: String,
    localRepository: LocalRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var cbtPackage by remember { mutableStateOf<CbtPackage?>(null) }
    var loadingPackage by remember { mutableStateOf(true) }

    // Load package
    LaunchedEffect(packageId) {
        loadingPackage = true
        val found = (StaticData.builtInCbtPackages + localRepository.getLocalCbtPackages())
            .find { it.id == packageId }
        cbtPackage = found
        loadingPackage = false
    }

    if (loadingPackage) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    val pkg = cbtPackage
    if (pkg == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Package not found")
        }
        return
    }

    val questions = pkg.questions
    var currentQuestionIndex by remember { mutableStateOf(0) }
    var selectedOption by remember { mutableStateOf<String?>(null) }
    var isSubmitted by remember { mutableStateOf(false) }
    var correctCount by remember { mutableStateOf(0) }
    var showResultsSummary by remember { mutableStateOf(false) }

    // Active Timer
    var timeSpentSeconds by remember { mutableStateOf(0) }
    var timerActive by remember { mutableStateOf(true) }

    // Map of question ID/index -> user's chosen answer
    val userAnswers = remember { mutableStateMapOf<String, String>() }

    LaunchedEffect(timerActive) {
        while (timerActive) {
            delay(1000)
            timeSpentSeconds++
        }
    }

    // Attempt Saving trigger
    var savingAttempt by remember { mutableStateOf(false) }
    val currentQuestion = questions.getOrNull(currentQuestionIndex)

    fun handleQuizFinish() {
        timerActive = false
        savingAttempt = true
        coroutineScope.launch {
            try {
                val scoreVal = (correctCount.toDouble() / questions.size * 100).toInt()
                val dateStr = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())
                
                val attempt = CbtAttempt(
                    id = UUID.randomUUID().toString(),
                    user_id = SupabaseClient.getSession()?.user?.id,
                    package_id = packageId,
                    score = scoreVal,
                    total_questions = questions.size,
                    correct_count = correctCount,
                    time_spent = timeSpentSeconds,
                    answers = userAnswers.toMap(),
                    created_at = dateStr
                )

                // Save to remote DB and local database cache
                try {
                    SupabaseClient.saveCbtAttempt(attempt)
                } catch (e: Exception) {
                    // Fail silently for network error, as we save locally too
                }
                localRepository.addLocalCbtAttempt(attempt)
            } catch (e: Exception) {
                Toast.makeText(context, "Error saving progress: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                savingAttempt = false
                showResultsSummary = true
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(pkg.name, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        if (showResultsSummary) {
            QuizSummaryView(
                packageId = packageId,
                questions = questions,
                userAnswers = userAnswers.toMap(),
                correctCount = correctCount,
                timeSpentSeconds = timeSpentSeconds,
                onBack = onBack,
                paddingValues = paddingValues
            )
        } else if (currentQuestion != null) {
            val scrollState = rememberScrollState()
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(scrollState)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Progress Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Question ${currentQuestionIndex + 1} of ${questions.size}",
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    // Timer formatting
                    val minutes = timeSpentSeconds / 60
                    val seconds = timeSpentSeconds % 60
                    Text(
                        text = String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }

                LinearProgressIndicator(
                    progress = (currentQuestionIndex + 1).toFloat() / questions.size,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(4.dp)),
                    color = MaterialTheme.colorScheme.primary
                )

                // Question Text
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Text(
                        text = currentQuestion.text,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }

                // Options List
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    currentQuestion.options.forEach { (optionKey, optionValue) ->
                        val isSelected = selectedOption == optionKey
                        val isCorrect = currentQuestion.correctOption == optionKey
                        
                        val containerColor = when {
                            isSubmitted && isCorrect -> Color(0xFF065F46) // Green bg for correct
                            isSubmitted && isSelected && !isCorrect -> Color(0xFF7F1D1D) // Red bg for selected wrong
                            isSelected -> MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                            else -> MaterialTheme.colorScheme.surface
                        }

                        val borderColor = when {
                            isSubmitted && isCorrect -> Color(0xFF10B981)
                            isSubmitted && isSelected && !isCorrect -> Color(0xFFEF4444)
                            isSelected -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        }

                        val contentColor = when {
                            isSubmitted && (isCorrect || (isSelected && !isCorrect)) -> Color.White
                            else -> MaterialTheme.colorScheme.onSurface
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(containerColor)
                                .border(1.dp, borderColor, RoundedCornerShape(8.dp))
                                .clickable(enabled = !isSubmitted) {
                                    selectedOption = optionKey
                                }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Circle label (A, B, C, D, E)
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                modifier = Modifier.size(24.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = optionKey,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                            
                            Text(
                                text = optionValue,
                                fontSize = 14.sp,
                                color = contentColor,
                                modifier = Modifier.weight(1f)
                            )

                            // Icon Indicator (only after submit)
                            if (isSubmitted) {
                                if (isCorrect) {
                                    Icon(Icons.Default.Check, contentDescription = "Correct", tint = Color(0xFF10B981))
                                } else if (isSelected) {
                                    Icon(Icons.Default.Clear, contentDescription = "Incorrect", tint = Color(0xFFEF4444))
                                }
                            }
                        }
                    }
                }

                // Submit / Next / Finish button
                if (!isSubmitted) {
                    Button(
                        onClick = {
                            val option = selectedOption
                            if (option != null) {
                                userAnswers[currentQuestionIndex.toString()] = option
                                isSubmitted = true
                                if (option == currentQuestion.correctOption) {
                                    correctCount++
                                }
                            }
                        },
                        enabled = selectedOption != null,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Submit Answer", color = Color.White)
                    }
                } else {
                    // Explanation Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                        border = BorderStroke(1.dp, Color(0xFF0F172A))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Explanation Rationale", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text(currentQuestion.explanation, fontSize = 13.sp, lineHeight = 18.sp, color = Color.White)
                        }
                    }

                    Button(
                        onClick = {
                            if (currentQuestionIndex + 1 < questions.size) {
                                currentQuestionIndex++
                                selectedOption = null
                                isSubmitted = false
                            } else {
                                handleQuizFinish()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text(
                            text = if (currentQuestionIndex + 1 < questions.size) "Next Question" else "View Practice Summary",
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun QuizSummaryView(
    packageId: String,
    questions: List<id.my.anesthesiapp.app.data.models.CbtQuestion>,
    userAnswers: Map<String, String>,
    correctCount: Int,
    timeSpentSeconds: Int,
    onBack: () -> Unit,
    paddingValues: PaddingValues
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var userRating by remember { mutableStateOf(0) }
    var commentsList by remember { mutableStateOf<List<CbtComment>>(emptyList()) }
    var newCommentText by remember { mutableStateOf("") }
    var loadingComments by remember { mutableStateOf(true) }
    var submittingComment by remember { mutableStateOf(false) }

    // Fetch comments
    LaunchedEffect(packageId) {
        loadingComments = true
        try {
            commentsList = SupabaseClient.fetchCbtComments(packageId)
        } catch (e: Exception) {
            // ignore
        } finally {
            loadingComments = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Main Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Practice Completed",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = "You scored",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                
                Text(
                    text = "$correctCount / ${questions.size}",
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary
                )
                
                val percentage = if (questions.isNotEmpty()) (correctCount.toDouble() / questions.size * 100).toInt() else 0
                Surface(
                    color = if (percentage >= 70) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = "$percentage% Correct · ${if (percentage >= 70) "LULUS" else "GAGAL"}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (percentage >= 70) Color(0xFF10B981) else Color(0xFFEF4444),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }

                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

                // Stats rows
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    val minutes = timeSpentSeconds / 60
                    val seconds = timeSpentSeconds % 60
                    val durationStr = "${minutes}m ${seconds}s"
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Time Spent", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(durationStr, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Accuracy", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("$percentage%", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Star Rating Component
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Beri Rating Paket Soal Ini:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (i in 1..5) {
                        val isStarred = i <= userRating
                        Icon(
                            imageVector = if (isStarred) Icons.Default.Star else Icons.Outlined.StarBorder,
                            contentDescription = "$i Stars",
                            tint = if (isStarred) Color(0xFFF59E0B) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                            modifier = Modifier
                                .size(32.dp)
                                .clickable {
                                    userRating = i
                                    coroutineScope.launch {
                                        try {
                                            SupabaseClient.rateCbtPackage(packageId, i)
                                            Toast.makeText(context, "Rating berhasil dikirim!", Toast.LENGTH_SHORT).show()
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Gagal memberi rating: ${e.message}", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
                        )
                    }
                }
            }
        }

        // Discussion Board
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Message, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text("Diskusi & Ulasan", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }

                // Add comment row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = newCommentText,
                        onValueChange = { newCommentText = it },
                        placeholder = { Text("Tulis komentar...", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        maxLines = 2,
                        textStyle = LocalTextStyle.current.copy(fontSize = 13.sp)
                    )
                    IconButton(
                        onClick = {
                            if (newCommentText.trim().isEmpty()) return@IconButton
                            submittingComment = true
                            coroutineScope.launch {
                                try {
                                    val postedComment = SupabaseClient.saveCbtComment(packageId, newCommentText.trim())
                                    commentsList = listOf(postedComment) + commentsList
                                    newCommentText = ""
                                    Toast.makeText(context, "Komentar diposting!", Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Gagal memposting komentar: ${e.message}", Toast.LENGTH_LONG).show()
                                } finally {
                                    submittingComment = false
                                }
                            }
                        },
                        enabled = !submittingComment && newCommentText.trim().isNotEmpty()
                    ) {
                        if (submittingComment) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Send, contentDescription = "Kirim", tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }

                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

                if (loadingComments) {
                    Box(modifier = Modifier.fillMaxWidth().height(80.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    }
                } else if (commentsList.isEmpty()) {
                    Text(
                        "Belum ada diskusi. Mulai diskusikan soal ini!",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        commentsList.take(6).forEach { comment ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = comment.user_email.split("@").firstOrNull() ?: "Anonim",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    // Parse time
                                    val dateDisplay = try {
                                        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                        val outputFormat = SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault())
                                        val parsed = inputFormat.parse(comment.created_at)
                                        if (parsed != null) outputFormat.format(parsed) else comment.created_at
                                    } catch (e: Exception) {
                                        comment.created_at.split("T").firstOrNull() ?: comment.created_at
                                    }
                                    Text(
                                        text = dateDisplay,
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(comment.comment, fontSize = 12.sp, lineHeight = 16.sp)
                            }
                        }
                    }
                }
            }
        }

        // Quiz Question Review Section
        Text("Tinjau Jawaban Anda", fontWeight = FontWeight.Bold, fontSize = 16.sp)

        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            questions.forEachIndexed { qIndex, question ->
                val userAnswer = userAnswers[qIndex.toString()]
                val isCorrect = question.correctOption == userAnswer

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Pertanyaan #${qIndex + 1}",
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 13.sp
                            )

                            Surface(
                                color = if (isCorrect) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = if (isCorrect) "Benar" else "Salah",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCorrect) Color(0xFF10B981) else Color(0xFFEF4444),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Text(
                            text = question.text,
                            fontSize = 14.sp,
                            lineHeight = 20.sp,
                            fontWeight = FontWeight.Medium
                        )

                        // Option review summary
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            question.options.forEach { (optionKey, optionValue) ->
                                val isSelected = optionKey == userAnswer
                                val isAnswerCorrect = optionKey == question.correctOption

                                val bg = when {
                                    isAnswerCorrect -> Color(0xFF10B981).copy(alpha = 0.1f)
                                    isSelected && !isAnswerCorrect -> Color(0xFFEF4444).copy(alpha = 0.1f)
                                    else -> Color.Transparent
                                }

                                val border = when {
                                    isAnswerCorrect -> BorderStroke(1.dp, Color(0xFF10B981))
                                    isSelected && !isAnswerCorrect -> BorderStroke(1.dp, Color(0xFFEF4444))
                                    else -> null
                                }

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(bg)
                                        .then(if (border != null) Modifier.border(border, RoundedCornerShape(6.dp)) else Modifier)
                                        .padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "$optionKey.",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (isAnswerCorrect) Color(0xFF047857) else if (isSelected) Color(0xFFB91C1C) else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = optionValue,
                                        fontSize = 12.sp,
                                        color = if (isAnswerCorrect) Color(0xFF047857) else if (isSelected) Color(0xFFB91C1C) else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }

                        // Explanation rationale
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                            border = BorderStroke(1.dp, Color(0xFF0F172A))
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Penjelasan Rationale:", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                                Text(question.explanation, fontSize = 12.sp, lineHeight = 16.sp, color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // Back button
        Button(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Text("Kembali ke Study Hub", color = Color.White)
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
