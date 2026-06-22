package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
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
import androidx.compose.ui.window.Dialog
import id.my.anesthesiapp.app.data.LocalRepository
import id.my.anesthesiapp.app.data.StaticData
import id.my.anesthesiapp.app.data.api.AiClient
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.ChatMessage
import id.my.anesthesiapp.app.data.models.OsceAttempt
import id.my.anesthesiapp.app.data.models.ScoreEvaluation
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OsceChatScreen(
    stationId: String,
    localRepository: LocalRepository,
    onBack: () -> Unit
) {
    val station = remember {
        StaticData.builtInOsceStations.find { it.id == stationId }
    }

    if (station == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Station not found")
        }
        return
    }

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    // OSCE session states
    var timeRemaining by remember { mutableStateOf(station.duration_minutes * 60) }
    var chatMessages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }
    var isEvaluating by remember { mutableStateOf(false) }
    var scorecard by remember { mutableStateOf<ScoreEvaluation?>(null) }
    var showScorecardDialog by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()

    // 17 minutes countdown timer
    LaunchedEffect(timeRemaining) {
        if (timeRemaining > 0 && !showScorecardDialog && !isEvaluating) {
            delay(1000L)
            timeRemaining--
        } else if (timeRemaining == 0 && !showScorecardDialog && !isEvaluating) {
            Toast.makeText(context, "Time is up! Evaluating exam automatically...", Toast.LENGTH_LONG).show()
            // Auto score
            isEvaluating = true
        }
    }

    // Scroll to bottom on new messages
    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(chatMessages.size - 1)
        }
    }

    // Initialize conversation with examiner greeting
    LaunchedEffect(Unit) {
        if (chatMessages.isEmpty()) {
            chatMessages = listOf(
                ChatMessage(
                    role = "examiner",
                    content = "Selamat datang Dokter. Anda diuji pada Stase ${station.title}.\n\nSkenario Klinis:\n${station.scenario}\n\nSilakan mulai menjawab instruksi peserta ujian."
                )
            )
        }
    }

    val performEvaluation: () -> Unit = {
        isEvaluating = true
        coroutineScope.launch {
            try {
                val result = AiClient.getEvaluation(
                    messages = chatMessages,
                    scenario = station.scenario,
                    patientProfile = station.patient_profile
                )
                scorecard = result
                showScorecardDialog = true
                
                // Write attempt into Supabase
                val session = SupabaseClient.getSession()
                val attempt = OsceAttempt(
                    id = UUID.randomUUID().toString(),
                    user_id = session?.user?.id,
                    station_id = station.id,
                    station_title = station.title,
                    score = result.score,
                    feedback = result.globalFeedback,
                    evaluation_details = null, // simple JSON mapping if needed
                    created_at = DateTimeFormatter.ISO_INSTANT.format(Instant.now())
                )
                
                if (session != null) {
                    SupabaseClient.insertOsceAttempt(attempt)
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Evaluation error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                isEvaluating = false
            }
        }
    }

    // Auto-trigger evaluation
    if (timeRemaining == 0 && isEvaluating && scorecard == null && !showScorecardDialog) {
        LaunchedEffect(Unit) {
            performEvaluation()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(station.title, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        val min = timeRemaining / 60
                        val sec = timeRemaining % 60
                        Text(
                            text = String.format(Locale.US, "Timer: %02d:%02d", min, sec),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (timeRemaining < 180) MaterialTheme.colorScheme.primary else Color(0xFF10B981)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Button(
                        onClick = { performEvaluation() },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier.padding(end = 8.dp),
                        enabled = !isEvaluating && !showScorecardDialog
                    ) {
                        Text("Finish", color = Color.White, fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Messages List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    items(chatMessages) { msg ->
                        val isExaminer = msg.role == "examiner"
                        val alignment = if (isExaminer) Alignment.Start else Alignment.End
                        
                        val bubbleColor = if (isExaminer) {
                            MaterialTheme.colorScheme.surface
                        } else {
                            MaterialTheme.colorScheme.primary
                        }

                        val textColor = if (isExaminer) {
                            MaterialTheme.colorScheme.onSurface
                        } else {
                            Color.White
                        }

                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = alignment
                        ) {
                            Text(
                                text = if (isExaminer) "EXAMINER" else "CANDIDATE",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                modifier = Modifier.padding(bottom = 2.dp, start = 4.dp, end = 4.dp)
                            )
                            
                            Box(
                                modifier = Modifier
                                    .clip(
                                        RoundedCornerShape(
                                            topStart = 12.dp,
                                            topEnd = 12.dp,
                                            bottomStart = if (isExaminer) 0.dp else 12.dp,
                                            bottomEnd = if (isExaminer) 12.dp else 0.dp
                                        )
                                    )
                                    .background(bubbleColor)
                                    .padding(12.dp)
                                    .widthIn(max = 280.dp)
                            ) {
                                Text(
                                    text = msg.content,
                                    color = textColor,
                                    fontSize = 14.sp,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }

                // Send bar
                Surface(
                    tonalElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text("Type your answer here...", fontSize = 14.sp) },
                            maxLines = 4,
                            modifier = Modifier.weight(1f),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            ),
                            enabled = !isSending && !isEvaluating && !showScorecardDialog
                        )
                        
                        IconButton(
                            onClick = {
                                if (inputText.isBlank()) return@IconButton
                                
                                val candidateMsg = ChatMessage(role = "candidate", content = inputText.trim())
                                chatMessages = chatMessages + candidateMsg
                                inputText = ""
                                isSending = true
                                
                                coroutineScope.launch {
                                    try {
                                        val reply = AiClient.sendChatMessage(
                                            messages = chatMessages,
                                            scenario = station.scenario,
                                            patientProfile = station.patient_profile
                                        )
                                        chatMessages = chatMessages + ChatMessage(role = "examiner", content = reply)
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Connection error: ${e.message}", Toast.LENGTH_LONG).show()
                                    } finally {
                                        isSending = false
                                    }
                                }
                            },
                            enabled = inputText.isNotBlank() && !isSending && !isEvaluating && !showScorecardDialog
                        ) {
                            if (isSending) {
                                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                            } else {
                                Icon(Icons.Default.Send, contentDescription = "Send message", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }

            // Spinner during evaluation
            if (isEvaluating) {
                Surface(
                    color = Color.Black.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxSize()
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                                Text("Evaluating performance...", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // Scorecard popup
            if (showScorecardDialog && scorecard != null) {
                val scoreEval = scorecard!!
                Dialog(onDismissRequest = {
                    showScorecardDialog = false
                    onBack()
                }) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(0.85f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(20.dp)
                                .fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text("Evaluation Scorecard", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            
                            LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                item {
                                    Column(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = "${scoreEval.score} / 100",
                                            fontSize = 44.sp,
                                            fontWeight = FontWeight.Black,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = if (scoreEval.score >= 70) "PASS" else "FAIL",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (scoreEval.score >= 70) Color(0xFF10B981) else Color(0xFFEF4444)
                                        )
                                    }
                                }

                                item {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
                                        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("Global Feedback", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(scoreEval.globalFeedback, fontSize = 13.sp, lineHeight = 18.sp)
                                        }
                                    }
                                }

                                scoreEval.aspects.forEach { (aspectName, evaluation) ->
                                    item {
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text(aspectName, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                                    Text(
                                                        "Score: ${evaluation.score}",
                                                        fontWeight = FontWeight.ExtraBold,
                                                        color = MaterialTheme.colorScheme.primary,
                                                        fontSize = 14.sp
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(evaluation.feedback, fontSize = 12.sp, lineHeight = 16.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f))
                                            }
                                        }
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    showScorecardDialog = false
                                    onBack()
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Back to Study Hub", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}
