@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.cron

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.CRON_PRESETS
import com.serverhub.android.data.model.CronJob
import com.serverhub.android.ui.components.StatusDot
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgCard
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun CronScreen(
    jobs: List<CronJob>,
    onAdd: (CronJob) -> Unit,
    onUpdate: (CronJob) -> Unit,
    onDelete: (String) -> Unit,
    onOpenDrawer: () -> Unit
) {
    var editing  by remember { mutableStateOf<CronJob?>(null) }
    var showForm by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()

    fun openNew()        { editing = null; showForm = true }
    fun openEdit(j: CronJob) { editing = j; showForm = true }
    fun closeForm()      { showForm = false; editing = null }

    Scaffold(
        containerColor = BgPrimary,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Cron Jobs", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text("${jobs.count { it.enabled }} enabled · ${jobs.size} total", fontSize = 11.sp, color = TextSecondary)
                    }
                },
                navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = ::openNew,
                containerColor = AccentBlue,
                contentColor = Color.White,
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.Add, "Add cron job")
            }
        }
    ) { padding ->
        if (jobs.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.AccessTime, null, tint = TextSecondary, modifier = Modifier.size(56.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("No cron jobs yet", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Text("Tap + to schedule a new task", color = TextSecondary, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(jobs, key = { it.id }) { job ->
                    CronJobCard(job, onEdit = { openEdit(job) }, onDelete = { onDelete(job.id) }, onToggle = { onUpdate(job.copy(enabled = !job.enabled)) })
                }
                item { Spacer(Modifier.height(72.dp)) }
            }
        }

        if (showForm) {
            ModalBottomSheet(
                onDismissRequest = ::closeForm,
                sheetState = sheetState,
                containerColor = BgSecondary
            ) {
                CronJobForm(
                    initial = editing,
                    onSave = { job ->
                        if (editing == null) onAdd(job) else onUpdate(job)
                        scope.launch { sheetState.hide() }.invokeOnCompletion { closeForm() }
                    },
                    onCancel = {
                        scope.launch { sheetState.hide() }.invokeOnCompletion { closeForm() }
                    }
                )
            }
        }
    }
}

@Composable
private fun CronJobCard(job: CronJob, onEdit: () -> Unit, onDelete: () -> Unit, onToggle: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(BgCard)
            .padding(14.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                StatusDot(if (job.enabled) AccentGreen else TextMuted)
                Spacer(Modifier.width(8.dp))
                Text(job.name, fontSize = 14.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) { Icon(Icons.Default.Edit, null, tint = TextSecondary, modifier = Modifier.size(16.dp)) }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) { Icon(Icons.Default.Delete, null, tint = AccentRed, modifier = Modifier.size(16.dp)) }
                Switch(
                    checked = job.enabled,
                    onCheckedChange = { onToggle() },
                    modifier = Modifier.size(width = 44.dp, height = 24.dp),
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = AccentGreen,
                        uncheckedThumbColor = TextMuted,
                        uncheckedTrackColor = BgTertiary
                    )
                )
            }
        }

        Spacer(Modifier.height(8.dp))
        Text(job.command, fontSize = 12.sp, color = AccentBlue, fontFamily = FontFamily.Monospace, maxLines = 2)

        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            LabelValue("Schedule", job.scheduleLabel)
            LabelValue("User", job.user)
        }

        if (job.description.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            Text(job.description, fontSize = 11.sp, color = TextSecondary, maxLines = 2)
        }
    }
}

@Composable
private fun LabelValue(label: String, value: String) {
    Column {
        Text(label.uppercase(), fontSize = 9.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
        Text(value, fontSize = 11.sp, color = TextSecondary)
    }
}

@Composable
private fun CronJobForm(initial: CronJob?, onSave: (CronJob) -> Unit, onCancel: () -> Unit) {
    var name     by remember { mutableStateOf(initial?.name ?: "") }
    var command  by remember { mutableStateOf(initial?.command ?: "") }
    var schedule by remember { mutableStateOf(initial?.schedule ?: "0 * * * *") }
    var user     by remember { mutableStateOf(initial?.user ?: "root") }
    var desc     by remember { mutableStateOf(initial?.description ?: "") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 8.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(if (initial == null) "New Cron Job" else "Edit Cron Job", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            IconButton(onClick = onCancel) { Icon(Icons.Default.Close, null, tint = TextSecondary) }
        }

        Spacer(Modifier.height(16.dp))

        FormField("Name", name, { name = it }, "e.g. Backup database")
        Spacer(Modifier.height(12.dp))
        FormField("Command", command, { command = it }, "e.g. /usr/bin/backup.sh", mono = true)
        Spacer(Modifier.height(12.dp))
        FormField("User", user, { user = it }, "root")
        Spacer(Modifier.height(12.dp))

        // Schedule presets
        Text("Schedule", fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(CRON_PRESETS) { (label, expr) ->
                val selected = schedule == expr
                Text(
                    label,
                    fontSize = 11.sp,
                    color = if (selected) AccentBlue else TextSecondary,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (selected) AccentBlue.copy(0.12f) else BgTertiary)
                        .clickable { schedule = expr }
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        FormField("Custom expression", schedule, { schedule = it }, "* * * * *", mono = true)

        Spacer(Modifier.height(12.dp))
        FormField("Description (optional)", desc, { desc = it }, "What does this job do?")

        Spacer(Modifier.height(24.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(BgTertiary)
                    .clickable(onClick = onCancel)
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Cancel", color = TextSecondary, fontWeight = FontWeight.Medium)
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (name.isNotBlank() && command.isNotBlank()) AccentBlue else BgTertiary)
                    .clickable(enabled = name.isNotBlank() && command.isNotBlank()) {
                        onSave(
                            (initial ?: CronJob(name = "", command = "", schedule = "")).copy(
                                name = name.trim(),
                                command = command.trim(),
                                schedule = schedule.trim(),
                                user = user.trim().ifEmpty { "root" },
                                description = desc.trim()
                            )
                        )
                    }
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Save Job", color = Color.White, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun FormField(label: String, value: String, onValueChange: (String) -> Unit, placeholder: String, mono: Boolean = false) {
    Column {
        Text(label, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 5.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(BgTertiary)
                .padding(horizontal = 12.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                textStyle = TextStyle(color = TextPrimary, fontSize = if (mono) 13.sp else 14.sp, fontFamily = if (mono) FontFamily.Monospace else FontFamily.Default),
                singleLine = true,
                modifier = Modifier.weight(1f),
                decorationBox = { inner ->
                    if (value.isEmpty()) Text(placeholder, fontSize = 13.sp, color = TextMuted, fontFamily = if (mono) FontFamily.Monospace else FontFamily.Default)
                    inner()
                }
            )
        }
    }
}
