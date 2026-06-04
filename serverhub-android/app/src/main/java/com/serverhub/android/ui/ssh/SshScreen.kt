@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.ssh

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
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
import com.serverhub.android.data.model.ExecResult
import com.serverhub.android.data.model.SystemMetrics
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlinx.coroutines.launch

private val QUICK_CMDS = listOf(
    "ls -la", "pwd", "ps aux", "df -h", "free -h", "uptime",
    "who", "ifconfig", "ip addr", "docker ps",
    "systemctl list-units --state=running", "uname -a", "cat /etc/os-release"
)

private data class TermLine(val text: String, val kind: CommandProcessor.LineKind)

@Composable
fun SshScreen(
    metrics: SystemMetrics?,
    onExec: suspend (String) -> Result<ExecResult>,
    onOpenDrawer: () -> Unit
) {
    val hostname  = metrics?.hostname ?: "server"
    val lines     = remember { mutableStateListOf<TermLine>() }
    val history   = remember { mutableStateListOf<String>() }
    var histIdx   by remember { mutableStateOf(-1) }
    var input     by remember { mutableStateOf("") }
    var cwd       by remember { mutableStateOf("~") }
    var executing by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scope     = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val banner = if (metrics != null) listOf(
            TermLine("ServerHub Terminal  —  ${metrics.hostname}", CommandProcessor.LineKind.HEADER),
            TermLine("OS: ${metrics.os}  Kernel: ${metrics.kernel}", CommandProcessor.LineKind.MUTED),
            TermLine("Commands execute on the real server via the agent API.", CommandProcessor.LineKind.MUTED),
            TermLine("Type 'help' for local commands.  All others run on the server.", CommandProcessor.LineKind.MUTED),
            TermLine("", CommandProcessor.LineKind.NORMAL),
        ) else listOf(TermLine("ServerHub Terminal  —  (waiting for connection…)", CommandProcessor.LineKind.MUTED))
        lines.addAll(banner)
    }

    LaunchedEffect(lines.size) {
        if (lines.isNotEmpty()) listState.animateScrollToItem(lines.size - 1)
    }

    fun submit() {
        val cmd = input.trim()
        if (cmd.isEmpty() || executing) return
        history.add(0, cmd)
        histIdx = -1
        input = ""
        lines += TermLine("${promptStr(hostname, cwd)} $cmd", CommandProcessor.LineKind.PROMPT)

        when (val result = CommandProcessor.handle(cmd, cwd)) {
            is CommandProcessor.Result.Local -> {
                if (result.lines.firstOrNull()?.text == "CLEAR") {
                    lines.clear()
                } else {
                    result.lines.forEach { lines += TermLine(it.text, it.kind) }
                    lines += TermLine("", CommandProcessor.LineKind.NORMAL)
                }
                cwd = result.nextCwd
            }
            is CommandProcessor.Result.Remote -> {
                executing = true
                scope.launch {
                    onExec(result.command).fold(
                        onSuccess = { exec ->
                            if (exec.stdout.isNotEmpty()) {
                                exec.stdout.trimEnd('\n').split('\n').forEach { line ->
                                    lines += TermLine(line, CommandProcessor.LineKind.NORMAL)
                                }
                            }
                            if (exec.stderr.isNotEmpty()) {
                                exec.stderr.trimEnd('\n').split('\n').forEach { line ->
                                    lines += TermLine(line, CommandProcessor.LineKind.ERROR)
                                }
                            }
                        },
                        onFailure = { e ->
                            lines += TermLine("error: ${e.message}", CommandProcessor.LineKind.ERROR)
                        }
                    )
                    lines += TermLine("", CommandProcessor.LineKind.NORMAL)
                    executing = false
                }
            }
        }
    }

    Column(Modifier.fillMaxSize().background(Color(0xFF0A0E13))) {
        TopAppBar(
            title = {
                Column {
                    Text("SSH Terminal", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text("$hostname:$cwd", fontSize = 11.sp, color = AccentGreen, fontFamily = FontFamily.Monospace)
                }
            },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        // Terminal output
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp)
        ) {
            itemsIndexed(lines) { _, line ->
                Text(
                    text = line.text,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = when (line.kind) {
                        CommandProcessor.LineKind.PROMPT  -> AccentGreen
                        CommandProcessor.LineKind.HEADER  -> AccentBlue
                        CommandProcessor.LineKind.ERROR   -> AccentRed
                        CommandProcessor.LineKind.MUTED   -> TextMuted
                        CommandProcessor.LineKind.SUCCESS -> AccentGreen
                        else                             -> TextPrimary
                    }
                )
            }
            if (executing) {
                item {
                    Text("…", fontFamily = FontFamily.Monospace, fontSize = 12.sp, color = TextMuted)
                }
            }
        }

        HorizontalDivider(color = BorderDefault, thickness = 1.dp)

        // Quick commands bar
        LazyRow(
            modifier = Modifier.fillMaxWidth().background(BgSecondary).padding(horizontal = 8.dp, vertical = 5.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(QUICK_CMDS) { cmd ->
                Text(
                    text = cmd,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(BgTertiary)
                        .clickable(enabled = !executing) { input = cmd; submit() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        // Input bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(BgSecondary)
                .imePadding()
                .padding(horizontal = 10.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                promptStr(hostname, cwd) + " ",
                fontFamily = FontFamily.Monospace, fontSize = 12.sp, color = AccentGreen
            )
            Spacer(Modifier.width(4.dp))
            BasicTextField(
                value = input,
                onValueChange = { input = it; histIdx = -1 },
                textStyle = TextStyle(color = TextPrimary, fontSize = 13.sp, fontFamily = FontFamily.Monospace),
                singleLine = true,
                modifier = Modifier.weight(1f),
                decorationBox = { inner ->
                    if (input.isEmpty()) Text(
                        if (executing) "executing…" else "type a command…",
                        fontSize = 13.sp, color = TextMuted, fontFamily = FontFamily.Monospace
                    )
                    inner()
                }
            )
            Spacer(Modifier.width(4.dp))
            Text("↑", fontSize = 16.sp,
                color = if (history.isNotEmpty()) TextSecondary else TextMuted,
                modifier = Modifier.clickable {
                    if (history.isNotEmpty()) {
                        histIdx = (histIdx + 1).coerceAtMost(history.size - 1)
                        input = history[histIdx]
                    }
                }
            )
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = ::submit, modifier = Modifier.size(36.dp)) {
                Icon(Icons.AutoMirrored.Filled.Send, null,
                    tint = if (input.isNotBlank() && !executing) AccentBlue else TextMuted)
            }
        }
    }
}

private fun promptStr(hostname: String, cwd: String): String {
    val shortCwd = if (cwd == "~") "~" else cwd.substringAfterLast("/").ifEmpty { "/" }
    return "root@$hostname:$shortCwd#"
}
