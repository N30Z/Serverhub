@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.files

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentYellow
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

private data class FsEntry(
    val name: String,
    val isDir: Boolean,
    val size: String = "",
    val modified: String = "Jan 01 00:00",
    val permissions: String = if (true) "drwxr-xr-x" else "-rw-r--r--"
)

private val FS_TREE: Map<String, List<FsEntry>> = mapOf(
    "/"          to listOf("bin","boot","dev","etc","home","lib","opt","proc","root","run","sbin","srv","sys","tmp","usr","var").map { FsEntry(it, true) },
    "/etc"       to listOf(FsEntry("fstab",false,"1.2K"), FsEntry("hosts",false,"218B"), FsEntry("hostname",false,"12B"), FsEntry("passwd",false,"2.3K"), FsEntry("group",false,"1.1K"), FsEntry("nginx",true), FsEntry("systemd",true), FsEntry("cron.d",true), FsEntry("ssh",true), FsEntry("apt",true)),
    "/etc/nginx" to listOf(FsEntry("nginx.conf",false,"2.8K"), FsEntry("sites-available",true), FsEntry("sites-enabled",true), FsEntry("conf.d",true)),
    "/home"      to listOf(FsEntry("admin",true)),
    "/home/admin"to listOf(FsEntry(".bashrc",false,"3.5K"), FsEntry(".profile",false,"807B"), FsEntry(".bash_history",false,"12K"), FsEntry(".ssh",true), FsEntry("scripts",true), FsEntry("logs",true)),
    "/root"      to listOf(FsEntry(".bashrc",false,"3.5K"), FsEntry(".profile",false,"807B"), FsEntry(".bash_history",false,"24K"), FsEntry(".ssh",true), FsEntry("scripts",true)),
    "/var"       to listOf("backups","cache","lib","log","mail","opt","run","spool","tmp","www").map { FsEntry(it, true) },
    "/var/log"   to listOf(FsEntry("syslog",false,"48M","Jan 04 12:31"), FsEntry("auth.log",false,"8.2M","Jan 04 09:11"), FsEntry("kern.log",false,"2.1M"), FsEntry("dpkg.log",false,"1.4M"), FsEntry("nginx",true), FsEntry("apt",true)),
    "/var/www"   to listOf(FsEntry("html",true)),
    "/tmp"       to listOf(FsEntry(".ICE-unix",true), FsEntry("snap-private-tmp",true)),
    "/usr"       to listOf("bin","include","lib","local","sbin","share").map { FsEntry(it, true) },
)

private fun dirContents(path: String): List<FsEntry> =
    FS_TREE[path] ?: FS_TREE.entries.filter { path.startsWith(it.key + "/") && it.key != path }.minByOrNull { path.length - it.key.length }?.value ?: emptyList()

@Composable
fun FilesScreen(onOpenDrawer: () -> Unit) {
    var cwd   by remember { mutableStateOf("/") }
    var query by remember { mutableStateOf("") }

    val entries = dirContents(cwd).filter { query.isBlank() || it.name.contains(query, ignoreCase = true) }
    val canGoUp = cwd != "/"

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("File Manager", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            actions = {
                IconButton(onClick = { cwd = "/root" }) { Icon(Icons.Default.Home, null, tint = TextSecondary) }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        // Breadcrumb
        Row(
            modifier = Modifier.fillMaxWidth().background(BgSecondary).padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (canGoUp) {
                IconButton(onClick = {
                    cwd = cwd.substringBeforeLast("/").ifEmpty { "/" }
                    query = ""
                }, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = AccentBlue, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(4.dp))
            }
            Text(
                cwd,
                fontSize = 12.sp,
                color = TextSecondary,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1f)
            )
        }

        HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)

        // Search
        Row(
            modifier = Modifier.fillMaxWidth().background(BgSecondary)
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

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 12.dp)
        ) {
            items(entries, key = { it.name }) { entry ->
                FileRow(entry, onClick = {
                    if (entry.isDir) {
                        cwd = if (cwd == "/") "/${entry.name}" else "$cwd/${entry.name}"
                        query = ""
                    }
                })
                HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
            }

            if (entries.isEmpty()) {
                item {
                    Text(
                        if (query.isNotEmpty()) "No files matching "$query"" else "(empty directory)",
                        color = TextMuted,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun FileRow(entry: FsEntry, onClick: () -> Unit) {
    val (icon, tint) = when {
        entry.isDir                                         -> Icons.Default.Folder to AccentBlue
        entry.name.endsWith(".tar.gz") || entry.name.endsWith(".zip") || entry.name.endsWith(".deb") ->
            Icons.Default.Archive to AccentYellow
        entry.name.endsWith(".conf") || entry.name.endsWith(".cfg") || entry.name.endsWith(".ini") ->
            Icons.Default.Settings to TextSecondary
        else                                               -> Icons.Default.Description to TextSecondary
    }

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
                Text(entry.name, fontSize = 13.sp, color = TextPrimary, fontWeight = if (entry.isDir) FontWeight.Medium else FontWeight.Normal, maxLines = 1)
                Text(
                    "${entry.permissions}   ${entry.modified}",
                    fontSize = 10.sp,
                    color = TextMuted,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
        if (entry.size.isNotEmpty()) {
            Text(entry.size, fontSize = 11.sp, color = TextSecondary, fontFamily = FontFamily.Monospace)
        }
    }
}
