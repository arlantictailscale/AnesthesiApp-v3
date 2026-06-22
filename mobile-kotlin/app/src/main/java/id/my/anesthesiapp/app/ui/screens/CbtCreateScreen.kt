package id.my.anesthesiapp.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Save
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
import id.my.anesthesiapp.app.data.api.SupabaseClient
import id.my.anesthesiapp.app.data.models.CbtPackage
import id.my.anesthesiapp.app.data.models.CbtQuestion
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.util.UUID

private val CATEGORIES = listOf(
    "Farmakologi & Fisiologi",
    "Resusitasi & Critical Care",
    "Anestesi Umum & Regional",
    "Anestesi Obstetrik",
    "Anestesi Pediatrik",
    "Neuroanestesi",
    "Anestesi Kardiovaskular",
    "Manajemen Nyeri (Pain Management)",
    "Anestesi Geriatrik",
    "Anestesi Rawat Jalan & NORA"
)

@Serializable
data class TempQuestion(
    val id: String = UUID.randomUUID().toString(),
    var text: String = "",
    var optA: String = "",
    var optB: String = "",
    var optC: String = "",
    var optD: String = "",
    var optE: String = "",
    var correctOption: String = "A",
    var category: String = CATEGORIES.first(),
    var explanation: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CbtCreateScreen(
    localRepository: LocalRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var packageName by remember { mutableStateOf("") }
    var packageDescription by remember { mutableStateOf("") }
    
    // We start with one default empty question
    val questionsList = remember { mutableStateListOf(TempQuestion()) }
    var saving by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Buat Paket Soal", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
                actions = {
                    if (saving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp).padding(end = 16.dp),
                            color = MaterialTheme.colorScheme.primary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(
                            onClick = {
                                // Validation
                                if (packageName.trim().isEmpty()) {
                                    Toast.makeText(context, "Nama paket wajib diisi", Toast.LENGTH_SHORT).show()
                                    return@IconButton
                                }
                                if (questionsList.isEmpty()) {
                                    Toast.makeText(context, "Harap tambahkan minimal 1 soal", Toast.LENGTH_SHORT).show()
                                    return@IconButton
                                }
                                for (i in questionsList.indices) {
                                    val q = questionsList[i]
                                    if (q.text.trim().isEmpty()) {
                                        Toast.makeText(context, "Teks soal nomor ${i+1} kosong", Toast.LENGTH_SHORT).show()
                                        return@IconButton
                                    }
                                    if (q.optA.trim().isEmpty() || q.optB.trim().isEmpty() || q.optC.trim().isEmpty() || q.optD.trim().isEmpty() || q.optE.trim().isEmpty()) {
                                        Toast.makeText(context, "Semua opsi (A-E) soal nomor ${i+1} harus diisi", Toast.LENGTH_SHORT).show()
                                        return@IconButton
                                    }
                                    if (q.explanation.trim().isEmpty()) {
                                        Toast.makeText(context, "Pembahasan soal nomor ${i+1} wajib diisi", Toast.LENGTH_SHORT).show()
                                        return@IconButton
                                    }
                                }

                                saving = true
                                coroutineScope.launch {
                                    try {
                                        val mappedQuestions = questionsList.map { q ->
                                            CbtQuestion(
                                                id = q.id,
                                                text = q.text.trim(),
                                                options = mapOf(
                                                    "A" to q.optA.trim(),
                                                    "B" to q.optB.trim(),
                                                    "C" to q.optC.trim(),
                                                    "D" to q.optD.trim(),
                                                    "E" to q.optE.trim()
                                                ),
                                                correctOption = q.correctOption,
                                                category = q.category,
                                                explanation = q.explanation.trim()
                                            )
                                        }

                                        val newPackage = CbtPackage(
                                            id = UUID.randomUUID().toString(),
                                            name = packageName.trim(),
                                            description = packageDescription.trim(),
                                            questions = mappedQuestions,
                                            creator_email = SupabaseClient.getSession()?.user?.email
                                        )

                                        // Save to Supabase and cache locally
                                        SupabaseClient.saveCbtPackage(newPackage)
                                        localRepository.addLocalCbtPackage(newPackage)

                                        Toast.makeText(context, "Paket soal berhasil dipublikasikan!", Toast.LENGTH_LONG).show()
                                        onBack()
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Gagal menyimpan: ${e.message}", Toast.LENGTH_LONG).show()
                                    } finally {
                                        saving = false
                                    }
                                }
                            }
                        ) {
                            Icon(Icons.Default.Save, contentDescription = "Simpan", tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        val scrollState = rememberScrollState()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // General Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("1. Informasi Paket", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    OutlinedTextField(
                        value = packageName,
                        onValueChange = { packageName = it },
                        label = { Text("Nama Paket Soal") },
                        placeholder = { Text("Contoh: Paket Latihan Neuroanestesi") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = packageDescription,
                        onValueChange = { packageDescription = it },
                        label = { Text("Deskripsi Paket") },
                        placeholder = { Text("Contoh: Kumpulan 10 soal mengenai TIK tinggi...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
            }

            // Questions Section
            Text("2. Daftar Pertanyaan (${questionsList.size})", fontWeight = FontWeight.Bold, fontSize = 16.sp)

            questionsList.forEachIndexed { index, q ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Soal #${index + 1}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp)
                            if (questionsList.size > 1) {
                                IconButton(
                                    onClick = { questionsList.removeAt(index) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                                }
                            }
                        }

                        // Category Dropdown styled selector
                        var categoryExpanded by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = q.category,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Kategori Subspesialisasi") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { categoryExpanded = true },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded)
                                }
                            )
                            DropdownMenu(
                                expanded = categoryExpanded,
                                onDismissRequest = { categoryExpanded = false }
                            ) {
                                CATEGORIES.forEach { cat ->
                                    DropdownMenuItem(
                                        text = { Text(cat) },
                                        onClick = {
                                            questionsList[index] = q.copy(category = cat)
                                            categoryExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = q.text,
                            onValueChange = { questionsList[index] = q.copy(text = it) },
                            label = { Text("Teks Pertanyaan") },
                            placeholder = { Text("Masukkan skenario klinis atau pertanyaan...") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3
                        )

                        // Options A - E
                        Text("Pilihan Jawaban (A-E)", fontWeight = FontWeight.Bold, fontSize = 13.sp)

                        listOf("A", "B", "C", "D", "E").forEach { letter ->
                            val value = when(letter) {
                                "A" -> q.optA
                                "B" -> q.optB
                                "C" -> q.optC
                                "D" -> q.optD
                                else -> q.optE
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                val isCorrect = q.correctOption == letter
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (isCorrect) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                                        .clickable { questionsList[index] = q.copy(correctOption = letter) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = letter,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isCorrect) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                OutlinedTextField(
                                    value = value,
                                    onValueChange = { newValue ->
                                        questionsList[index] = when(letter) {
                                            "A" -> q.copy(optA = newValue)
                                            "B" -> q.copy(optB = newValue)
                                            "C" -> q.copy(optC = newValue)
                                            "D" -> q.copy(optD = newValue)
                                            else -> q.copy(optE = newValue)
                                        }
                                    },
                                    placeholder = { Text("Opsi $letter") },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true
                                )
                            }
                        }

                        OutlinedTextField(
                            value = q.explanation,
                            onValueChange = { questionsList[index] = q.copy(explanation = it) },
                            label = { Text("Pembahasan (Alasan Kunci)") },
                            placeholder = { Text("Jelaskan mengapa pilihan ${q.correctOption} benar...") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2
                        )
                    }
                }
            }

            Button(
                onClick = { questionsList.add(TempQuestion()) },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), contentColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Tambah Pertanyaan Baru", fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
