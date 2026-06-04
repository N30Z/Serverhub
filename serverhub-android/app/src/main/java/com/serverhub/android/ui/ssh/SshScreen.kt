@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.ssh

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.ExperimentalMaterial3Api
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
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

private val quickCommands = listOf("ls", "ls -la", "pwd", "top", "df -h", "free -h", "ps aux", "uptime", "whoami")

@Composable
fun SshScreen(onOpenDrawer: () -> Unit) {
    val lines = remember { mutableStateListOf("ServerHub SSH Terminal — agent SSH support required", "") }
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(lines.size) {
        if (lines.isNotEmpty()) listState.animateScrollToItem(lines.size - 1)
    }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("SSH Terminal", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        // Terminal output
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth().background(Color(0xFF0D1117)).padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            items(lines) { line ->
                Text(
                    text = line,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = if (line.startsWith("$")) AccentGreen else TextPrimary,
                    lineHeight = 18.sp
                )
            }
        }

        // Quick commands
        LazyRow(
            modifier = Modifier.fillMaxWidth().background(BgSecondary).padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(quickCommands) { cmd ->
                Text(
                    text = cmd,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(BgTertiary)
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
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("$ ", fontFamily = FontFamily.Monospace, fontSize = 14.sp, color = AccentGreen)
            BasicTextField(
                value = input,
                onValueChange = { input = it },
                textStyle = TextStyle(color = TextPrimary, fontSize = 14.sp, fontFamily = FontFamily.Monospace),
                singleLine = true,
                modifier = Modifier.weight(1f),
                decorationBox = { inner ->
                    if (input.isEmpty()) Text("type a command…", fontSize = 14.sp, color = TextMuted, fontFamily = FontFamily.Monospace)
                    inner()
                }
            )
            IconButton(onClick = {
                if (input.isNotBlank()) {
                    lines += "$ $input"
                    lines += "[SSH not connected — configure agent SSH support]"
                    lines += ""
                    input = ""
                }
            }, modifier = Modifier.size(36.dp)) {
                Icon(Icons.AutoMirrored.Filled.Send, null, tint = if (input.isNotBlank()) AccentGreen else TextMuted)
            }
        }
    }
}
