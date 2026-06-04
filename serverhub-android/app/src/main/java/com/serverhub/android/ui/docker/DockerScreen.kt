@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.docker

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.DockerContainer
import com.serverhub.android.ui.components.HorizontalBar
import com.serverhub.android.ui.components.MetricCard
import com.serverhub.android.ui.components.StatusBadge
import com.serverhub.android.ui.components.StatusDot
import com.serverhub.android.ui.components.containerStatusColor
import com.serverhub.android.ui.components.usageColor
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlin.math.roundToInt

@Composable
fun DockerScreen(containers: List<DockerContainer>, onOpenDrawer: () -> Unit) {
    val running  = containers.count { it.status == "running" }
    val stopped  = containers.count { it.status != "running" }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = {
                Column {
                    Text("Docker", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text("$running running · $stopped stopped", fontSize = 11.sp, color = TextSecondary)
                }
            },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        if (containers.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Cloud, null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("No Docker containers", color = TextSecondary)
                }
            }
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(containers, key = { it.id }) { c ->
                ContainerCard(c)
            }
        }
    }
}

@Composable
private fun ContainerCard(c: DockerContainer) {
    MetricCard(Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                StatusDot(containerStatusColor(c.status))
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(c.name, fontSize = 14.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1)
                    Text(c.image, fontSize = 11.sp, color = TextSecondary, maxLines = 1)
                }
            }
            StatusBadge(c.status, containerStatusColor(c.status))
        }

        if (c.status == "running") {
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(Modifier.weight(1f)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("CPU", fontSize = 10.sp, color = TextSecondary)
                        Text("${c.cpu.roundToInt()}%", fontSize = 10.sp, color = usageColor(c.cpu), fontFamily = FontFamily.Monospace)
                    }
                    Spacer(Modifier.height(3.dp))
                    HorizontalBar((c.cpu / 100).toFloat(), usageColor(c.cpu), modifier = Modifier.fillMaxWidth().height(5.dp))
                }
                Column(Modifier.weight(1f)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("MEM", fontSize = 10.sp, color = TextSecondary)
                        Text("${c.memory.roundToInt()}%", fontSize = 10.sp, color = AccentBlue, fontFamily = FontFamily.Monospace)
                    }
                    Spacer(Modifier.height(3.dp))
                    HorizontalBar((c.memory / 100).toFloat(), AccentBlue, modifier = Modifier.fillMaxWidth().height(5.dp))
                }
            }
        }

        if (c.ports.isNotEmpty()) {
            Spacer(Modifier.height(6.dp))
            Text(c.ports.joinToString(" · "), fontSize = 10.sp, color = TextSecondary)
        }

        if (c.uptime.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            Text("Up ${c.uptime}", fontSize = 10.sp, color = TextSecondary)
        }
    }
}
