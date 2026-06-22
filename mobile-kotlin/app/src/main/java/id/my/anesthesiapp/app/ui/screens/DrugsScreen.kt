package id.my.anesthesiapp.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import id.my.anesthesiapp.app.data.StaticData
import id.my.anesthesiapp.app.data.models.Drug

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrugsScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Drug Reference", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            DrugsLibrarySubTab()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DrugsLibrarySubTab() {
    var searchQuery by remember { mutableStateOf("") }
    var selectedDrug by remember { mutableStateOf<Drug?>(null) }
    
    val drugsList = remember { StaticData.builtInDrugs }
    val filteredDrugs = drugsList.filter {
        it.name.contains(searchQuery, ignoreCase = true) || 
        it.category.contains(searchQuery, ignoreCase = true)
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by drug name or class...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface
            )
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            items(filteredDrugs) { drug ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedDrug = drug },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .padding(16.dp)
                            .fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(drug.name, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(drug.category, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        }
                        
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (drug.high_alert) {
                                Surface(
                                    color = Color(0xFF7F1D1D),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        "HIGH ALERT",
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text("Details →", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    if (selectedDrug != null) {
        DrugDetailsDialog(drug = selectedDrug!!, onDismiss = { selectedDrug = null })
    }
}

@Composable
fun DrugDetailsDialog(drug: Drug, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
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
                    .fillMaxSize()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(drug.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    if (drug.high_alert) {
                        Surface(color = Color(0xFF7F1D1D), shape = RoundedCornerShape(4.dp)) {
                            Text("HIGH ALERT", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                }
                Text(drug.category, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item { DetailSection(title = "Onset of Action", content = drug.onset) }
                    item { DetailSection(title = "Duration of Action", content = drug.duration) }
                    item { DetailSection(title = "Induction Dosage", content = drug.dosage) }
                    
                    drug.mechanism?.let {
                        item { DetailSection(title = "Mechanism of Action", content = it) }
                    }
                    drug.pk?.let {
                        item { DetailSection(title = "Pharmacokinetics (PK)", content = it) }
                    }
                    drug.pd?.let {
                        item { DetailSection(title = "Pharmacodynamics (PD)", content = it) }
                    }
                    drug.considerations?.let {
                        item { DetailSection(title = "Clinical Considerations", content = it) }
                    }
                    drug.contraindications?.let {
                        item { DetailSection(title = "Contraindications", content = it) }
                    }
                }

                Button(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Close", color = Color.White)
                }
            }
        }
    }
}

@Composable
private fun DetailSection(title: String, content: String) {
    Column {
        Text(title, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
        Spacer(modifier = Modifier.height(2.dp))
        Text(content, fontSize = 14.sp, lineHeight = 19.sp)
    }
}
