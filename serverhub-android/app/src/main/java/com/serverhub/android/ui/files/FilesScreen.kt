@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.files

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.FileEntry
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentYellow
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FilesScreen(
    onListFiles: suspend (String) -> Result<List<FileEntry>>,
    onReadFile: suspend (String) -> Result<String>,
    onOpenDrawer: () -> Unit
) {
    var cwd     by remember { mutableStateOf("/") }
    var query   by remember { mutableStateOf("") }
    var entries by remember { mutableStateOf<List<FileEntry>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error   by remember { mutableStateOf<String?>(null) }
    var preview by remember { mutableStateOf<FilePreview?>(null) }
    val scope   = rememberCoroutineScope()

    fun load(path: String) {
        loading = true; error = null
        scope.launch {
            onListFiles(path).fold(
                onSuccess = { list -> entries = list.sortedWith(compareByDescending<FileEntry> { it.isDir }.thenBy { it.name }); cwd = path; query = "" },
                onFailure = { error = it.message }
            )
            loading = false
        }
    }

    fun openFile(entry: FileEntry) {
        preview = FilePreview(entry.name, null, true)
        scope.launch {
            onReadFile(entry.path).fold(
                onSuccess = { preview = FilePreview(entry.name, it, false) },
                onFailure = { preview = FilePreview(entry.name, "Could not read file: ${it.message}", false) }
            )
        }
    }

    LaunchedEffect(Unit) { load("/") }

    val visible = if (query.isBlank()) entries
                  else entries.filter { it.name.contains(query, ignoreCase = true) }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("File Manager", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            actions = {
                IconButton(onClick = { load("/root") }) { Icon(Icons.Default.Home, null, tint = TextSecondary) }
                IconButton(onClick = { load(cwd) }) { Icon(Icons.Default.Refresh, null, tint = TextSecondary) }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        // Breadcrumb
        Row(
            modifier = Modifier.fillMaxWidth().background(BgSecondary).padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (cwd != "/") {
                IconButton(
                    onClick = { load(cwd.substringBeforeLast("/").ifEmpty { "/" }) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = AccentBlue, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(4.dp))
            }
            Text(cwd, fontSize = 12.sp, color = TextSecondary, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
        }

        HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)

        // Search
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(BgSecondary)
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(BgTertiary)
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Search, null, tint = TextMuted, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            BasicTextField(
                value = query,
                onValueChange = { query = it },
                textStyle = TextStyle(color = TextPrimary, fontSize = 13.sp),
                singleLine = true,
                modifier = Modifier.weight(1f),
                decorationBox = { inner ->
                    if (query.isEmpty()) Text("Search…", fontSize = 13.sp, color = TextMuted)
                    inner()
                }
            )
        }

        when {
            loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AccentBlue)
            }
            error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                    Text(error ?: "Error loading directory", color = TextSecondary, fontSize = 13.sp)
                }
            }
            else -> LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 12.dp)) {
                items(visible, key = { it.path }) { entry ->
                    FileRow(entry, onClick = { if (entry.isDir) load(entry.path) else openFile(entry) })
                    HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
                }
                if (visible.isEmpty()) {
                    item {
                        Text(
                            if (query.isNotEmpty()) "No files matching \"$query\"" else "(empty directory)",
                            color = TextMuted, fontSize = 13.sp, modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }
        }
    }

    preview?.let { p ->
        FilePreviewSheet(p, onDismiss = { preview = null })
    }
}

private data class FilePreview(val name: String, val content: String?, val loading: Boolean)

@Composable
private fun FilePreviewSheet(preview: FilePreview, onDismiss: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = BgSecondary
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
            Text(preview.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary, fontFamily = FontFamily.Monospace, maxLines = 1)
            Spacer(Modifier.size(12.dp))
            when {
                preview.loading -> Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AccentBlue)
                }
                else -> Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(BgTertiary)
                        .verticalScroll(rememberScrollState())
                        .padding(12.dp)
                ) {
                    Text(
                        preview.content?.ifEmpty { "(empty file)" } ?: "(empty file)",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = 16.sp
                    )
                }
            }
            Spacer(Modifier.size(32.dp))
        }
    }
}

private val dateFmt = SimpleDateFormat("MMM dd HH:mm", Locale.getDefault())

@Composable
private fun FileRow(entry: FileEntry, onClick: () -> Unit) {
    val (icon, tint) = when {
        entry.isDir -> Icons.Default.Folder to AccentBlue
        entry.name.endsWith(".tar.gz") || entry.name.endsWith(".zip") || entry.name.endsWith(".deb") ->
            Icons.Default.Archive to AccentYellow
        entry.name.endsWith(".conf") || entry.name.endsWith(".cfg") || entry.name.endsWith(".ini") ->
            Icons.Default.Settings to TextSecondary
        else -> Icons.Default.Description to TextSecondary
    }
    val sizeStr = when {
        entry.isDir            -> ""
        entry.size >= 1048576  -> "${"%.1f".format(entry.size / 1048576.0)} MB"
        entry.size >= 1024     -> "${"%.1f".format(entry.size / 1024.0)} KB"
        else                   -> "${entry.size} B"
    }
    val modStr = dateFmt.format(Date(entry.modTime * 1000))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    entry.name, fontSize = 13.sp, color = TextPrimary,
                    fontWeight = if (entry.isDir) FontWeight.Medium else FontWeight.Normal,
                    maxLines = 1
                )
                Text("${entry.mode}   $modStr", fontSize = 10.sp, color = TextMuted, fontFamily = FontFamily.Monospace)
            }
        }
        if (sizeStr.isNotEmpty()) {
            Text(sizeStr, fontSize = 11.sp, color = TextSecondary, fontFamily = FontFamily.Monospace)
        }
    }
}
