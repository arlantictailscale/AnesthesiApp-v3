package id.my.anesthesiapp.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale

@Composable
fun CalculatorTab() {
    var selectedSubTab by remember { mutableStateOf(0) }
    val tabs = listOf("Induction Bolus", "Vasoactive Infusion")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TabRow(
            selectedTabIndex = selectedSubTab,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedSubTab == index,
                    onClick = { selectedSubTab = index },
                    text = { Text(title, fontWeight = FontWeight.Bold) }
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            when (selectedSubTab) {
                0 -> InductionBolusCalculator()
                1 -> VasoactiveInfusionCalculator()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InductionBolusCalculator() {
    var weightStr by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()
    
    val weight = weightStr.toDoubleOrNull() ?: 0.0

    // Built-in calculations
    val drugCalculations = listOf(
        Triple("Propofol", "mg", Pair(1.5, 2.5)),
        Triple("Ketamine", "mg", Pair(1.0, 2.0)),
        Triple("Etomidate", "mg", Pair(0.2, 0.3)),
        Triple("Fentanyl", "mcg", Pair(1.0, 3.0)),
        Triple("Rocuronium (Intub)", "mg", Pair(0.6, 1.2)),
        Triple("Succinylcholine", "mg", Pair(1.0, 1.5))
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Weight-Based Induction Bolus", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        
        OutlinedTextField(
            value = weightStr,
            onValueChange = { weightStr = it },
            label = { Text("Patient Weight (kg)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        if (weight > 150.0 || (weight > 0 && weight < 5.0)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF7F1D1D))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.Warning, contentDescription = "Warning", tint = Color.White)
                Text(
                    text = "Extreme weight detected. Review calculated dosages carefully.",
                    color = Color.White,
                    fontSize = 13.sp
                )
            }
        }

        drugCalculations.forEach { (name, unit, range) ->
            val low = range.first * weight
            val high = range.second * weight
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(name, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = String.format(Locale.US, "%.1f - %.1f %s", low, high, unit),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Text(
                        text = String.format(Locale.US, "Range: %.2f - %.2f %s/kg", range.first, range.second, unit),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VasoactiveInfusionCalculator() {
    var weightStr by remember { mutableStateOf("70") }
    var ampuleMgStr by remember { mutableStateOf("4") }
    var syringeMlStr by remember { mutableStateOf("50") }
    var doseStr by remember { mutableStateOf("0.05") }
    var rateStr by remember { mutableStateOf("") }
    
    // Mode toggle: 0 = Calculate Rate from Dose, 1 = Calculate Dose from Rate
    var calculationMode by remember { mutableStateOf(0) }

    val weight = weightStr.toDoubleOrNull() ?: 0.0
    val ampuleMg = ampuleMgStr.toDoubleOrNull() ?: 0.0
    val syringeMl = syringeMlStr.toDoubleOrNull() ?: 0.0
    val dose = doseStr.toDoubleOrNull() ?: 0.0
    val rate = rateStr.toDoubleOrNull() ?: 0.0

    // Concentration: mg in mL -> mcg/mL
    // Concentration = (mg * 1000) / mL
    val concentrationMcgMl = if (syringeMl > 0) (ampuleMg * 1000.0) / syringeMl else 0.0

    // Calculated values
    val computedRate = if (concentrationMcgMl > 0 && weight > 0) {
        (dose * weight * 60.0) / concentrationMcgMl
    } else 0.0

    val computedDose = if (weight > 0 && concentrationMcgMl > 0) {
        (rate * concentrationMcgMl) / (weight * 60.0)
    } else 0.0

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Vasoactive Infusion", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)

        TabRow(
            selectedTabIndex = calculationMode,
            containerColor = MaterialTheme.colorScheme.surface,
            modifier = Modifier.clip(RoundedCornerShape(8.dp))
        ) {
            Tab(selected = calculationMode == 0, onClick = { calculationMode = 0 }, text = { Text("Calculate Rate", fontSize = 12.sp) })
            Tab(selected = calculationMode == 1, onClick = { calculationMode = 1 }, text = { Text("Calculate Dose", fontSize = 12.sp) })
        }

        Spacer(modifier = Modifier.height(4.dp))

        OutlinedTextField(
            value = weightStr,
            onValueChange = { weightStr = it },
            label = { Text("Weight (kg)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = ampuleMgStr,
                onValueChange = { ampuleMgStr = it },
                label = { Text("Amount (mg)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
            OutlinedTextField(
                value = syringeMlStr,
                onValueChange = { syringeMlStr = it },
                label = { Text("Diluent Vol (mL)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
        }

        if (calculationMode == 0) {
            OutlinedTextField(
                value = doseStr,
                onValueChange = { doseStr = it },
                label = { Text("Target Dose (mcg/kg/min)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        } else {
            OutlinedTextField(
                value = rateStr,
                onValueChange = { rateStr = it },
                label = { Text("Infusion Rate (mL/hr)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = String.format(Locale.US, "Concentration: %.1f mcg/mL", concentrationMcgMl),
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                
                if (calculationMode == 0) {
                    Text("Calculated Infusion Rate", fontSize = 14.sp)
                    Text(
                        text = String.format(Locale.US, "%.2f mL/hr", computedRate),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary
                    )
                } else {
                    Text("Calculated Delivered Dose", fontSize = 14.sp)
                    Text(
                        text = String.format(Locale.US, "%.3f mcg/kg/min", computedDose),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
