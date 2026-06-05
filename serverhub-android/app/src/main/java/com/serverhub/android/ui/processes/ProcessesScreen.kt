@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.processes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.Process
import com.serverhub.android.ui.components.HorizontalBar
import com.serverhub.android.ui.components.StatusBadge
import com.serverhub.android.ui.components.usageColor
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlin.math.roundToInt

enum class ProcessSort { NAME, CPU, MEMORY }

@Composable
fun ProcessesScreen(processes: List<Process>, onOpenDrawer: () -> Unit) {
    var query by remember { mutableStateOf("") }
    var sortBy by remember { mutableStateOf(ProcessSort.CPU) }
    var sortDesc by remember { mutableStateOf(true) }

    val filtered = processes
        .filter { it.name.contains(query, ignoreCase = true) || it.user.contains(query, ignoreCase = true) }
        .let { list ->
            when (sortBy) {
                ProcessSort.NAME   -> if (sortDesc) list.sortedByDescending { it.name } else list.sortedBy { it.name }
                ProcessSort.CPU    -> if (sortDesc) list.sortedByDescending { it.cpu }    else list.sortedBy { it.cpu }
                ProcessSort.MEMORY -> if (sortDesc) list.sortedByDescending { it.memory } else list.sortedBy { it.memory }
            }
        }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("Processes", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        // Search bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(BgTertiary)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Search, null, tint = TextMuted, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            BasicTextField(
                value = query,
                onValueChange = { query = it },
                textStyle = TextStyle(color = TextPrimary, fontSize = 14.sp),
                singleLine = true,
                decorationBox = { inner ->
                    if (query.isEmpty()) Text("Filter processes…", fontSize = 14.sp, color = TextMuted)
                    inner()
                },
                modifier = Modifier.weight(1f)
            )
        }

        // Column headers
        Row(
            modifier = Modifier.fillMaxWidth()
                .background(BgSecondary)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("PID", Modifier.width(44.dp), fontSize = 10.sp, color = TextMuted)
            SortHeader("Process", ProcessSort.NAME, sortBy, sortDesc, Modifier.weight(1f)) {
                if (sortBy == ProcessSort.NAME) sortDesc = !sortDesc else { sortBy = ProcessSort.NAME; sortDesc = true }
            }
            SortHeader("CPU", ProcessSort.CPU, sortBy, sortDesc, Modifier.width(54.dp)) {
                if (sortBy == ProcessSort.CPU) sortDesc = !sortDesc else { sortBy = ProcessSort.CPU; sortDesc = true }
            }
            SortHeader("MEM", ProcessSort.MEMORY, sortBy, sortDesc, Modifier.width(54.dp)) {
                if (sortBy == ProcessSort.MEMORY) sortDesc = !sortDesc else { sortBy = ProcessSort.MEMORY; sortDesc = true }
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 12.dp)
        ) {
            items(filtered, key = { it.pid }) { proc ->
                ProcessRow(proc)
                HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
            }
        }
    }
}

@Composable
private fun SortHeader(label: String, sort: ProcessSort, current: ProcessSort, desc: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier.clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 10.sp, color = if (current == sort) AccentBlue else TextMuted, fontWeight = FontWeight.SemiBold)
        if (current == sort) {
            Spacer(Modifier.width(2.dp))
            Icon(
                if (desc) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                null, tint = AccentBlue, modifier = Modifier.size(10.dp)
            )
        }
    }
}

@Composable
private fun ProcessRow(proc: Process) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("${proc.pid}", Modifier.width(44.dp), fontSize = 11.sp, color = TextMuted, fontFamily = FontFamily.Monospace)
            Column(Modifier.weight(1f)) {
                Text(proc.name, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.Medium, maxLines = 1)
                Text(proc.user, fontSize = 10.sp, color = TextSecondary)
            }
            Text("${proc.cpu.roundToInt()}%", Modifier.width(54.dp), fontSize = 12.sp, color = usageColor(proc.cpu), fontFamily = FontFamily.Monospace)
            Text("${proc.memory.roundToInt()}%", Modifier.width(54.dp), fontSize = 12.sp, color = TextSecondary, fontFamily = FontFamily.Monospace)
        }
        Spacer(Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            HorizontalBar((proc.cpu / 100).toFloat(), usageColor(proc.cpu), modifier = Modifier.weight(1f).height(3.dp))
            HorizontalBar((proc.memory / 100).toFloat(), AccentBlue, modifier = Modifier.weight(1f).height(3.dp))
        }
    }
}
