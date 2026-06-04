@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.serverhub.android.data.api.ConnectionState
import com.serverhub.android.data.model.SystemMetrics
import kotlin.math.roundToInt

@Composable
fun DashboardScreen(
    metrics: SystemMetrics?,
    connectionState: ConnectionState,
    onLogout: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(metrics?.hostname ?: "ServerHub")
                        Text(
                            text = when (connectionState) {
                                is ConnectionState.Connected -> "Live"
                                is ConnectionState.Disconnected -> "Disconnected"
                                is ConnectionState.Error -> "Error: ${connectionState.message}"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = if (connectionState is ConnectionState.Connected)
                                Color(0xFF4CAF50) else MaterialTheme.colorScheme.error
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { padding ->
        if (metrics == null) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { SystemInfoCard(metrics) }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    UsageCard(
                        modifier = Modifier.weight(1f),
                        title = "CPU",
                        usage = metrics.cpu.usage,
                        subtitle = "${metrics.cpu.cores} cores · ${metrics.cpu.frequency} GHz",
                        icon = Icons.Default.Memory
                    )
                    UsageCard(
                        modifier = Modifier.weight(1f),
                        title = "Memory",
                        usage = metrics.memory.usage,
                        subtitle = "${formatMb(metrics.memory.used)} / ${formatMb(metrics.memory.total)}",
                        icon = Icons.Default.Storage
                    )
                }
            }

            item { LoadCard(metrics) }

            if (metrics.disk.isNotEmpty()) {
                item { DiskCard(metrics) }
            }

            if (metrics.network.interfaces.isNotEmpty()) {
                item { NetworkCard(metrics) }
            }

            if (metrics.swap.total > 0) {
                item {
                    UsageCard(
                        modifier = Modifier.fillMaxWidth(),
                        title = "Swap",
                        usage = metrics.swap.usage,
                        subtitle = "${formatMb(metrics.swap.used)} / ${formatMb(metrics.swap.total)}",
                        icon = Icons.Default.SwapHoriz
                    )
                }
            }

            if (metrics.temperatures.isNotEmpty()) {
                item { TempCard(metrics) }
            }

            if (metrics.processes.isNotEmpty()) {
                item { ProcessCard(metrics) }
            }

            if (metrics.docker.isNotEmpty()) {
                item { DockerCard(metrics) }
            }
        }
    }
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}

@Composable
private fun SystemInfoCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.Computer,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.width(8.dp))
            Column {
                Text(metrics.hostname, style = MaterialTheme.typography.titleMedium)
                Text(
                    metrics.os,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "Kernel: ${metrics.kernel}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "Uptime: ${formatUptime(metrics.uptime)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun UsageCard(
    modifier: Modifier,
    title: String,
    usage: Double,
    subtitle: String,
    icon: ImageVector
) {
    val color = usageColor(usage)
    MetricCard(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(title, style = MaterialTheme.typography.labelLarge)
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = "${usage.roundToInt()}%",
            style = MaterialTheme.typography.headlineMedium,
            color = color
        )
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { (usage / 100).toFloat().coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth(),
            color = color,
            trackColor = MaterialTheme.colorScheme.surface
        )
        Spacer(Modifier.height(4.dp))
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun LoadCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Speed, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Load Average", style = MaterialTheme.typography.labelLarge)
        }
        Spacer(Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            LoadItem("1 min", metrics.load.load1)
            LoadItem("5 min", metrics.load.load5)
            LoadItem("15 min", metrics.load.load15)
        }
    }
}

@Composable
private fun LoadItem(label: String, value: Double) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("%.2f".format(value), style = MaterialTheme.typography.titleLarge)
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun DiskCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Storage, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Disks", style = MaterialTheme.typography.labelLarge)
        }
        metrics.disk.forEach { disk ->
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(disk.mountpoint, style = MaterialTheme.typography.bodyMedium)
                Text(
                    "${disk.usage.roundToInt()}%",
                    color = usageColor(disk.usage),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Spacer(Modifier.height(2.dp))
            LinearProgressIndicator(
                progress = { (disk.usage / 100).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth(),
                color = usageColor(disk.usage),
                trackColor = MaterialTheme.colorScheme.surface
            )
            Text(
                "${formatMb(disk.used)} / ${formatMb(disk.total)} · ${disk.fstype}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun NetworkCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.NetworkCheck, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Network", style = MaterialTheme.typography.labelLarge)
        }
        metrics.network.interfaces.forEach { iface ->
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(iface.name, style = MaterialTheme.typography.bodyMedium)
                    Text(iface.ip, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("↑ ${"%.1f".format(iface.txRate)} MB/s", style = MaterialTheme.typography.bodySmall)
                    Text("↓ ${"%.1f".format(iface.rxRate)} MB/s", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun TempCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Thermostat, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Temperatures", style = MaterialTheme.typography.labelLarge)
        }
        metrics.temperatures.forEach { temp ->
            Spacer(Modifier.height(6.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(temp.sensor, style = MaterialTheme.typography.bodySmall)
                Text(
                    "${temp.temperature}°C",
                    style = MaterialTheme.typography.bodySmall,
                    color = when {
                        temp.temperature >= temp.critical -> MaterialTheme.colorScheme.error
                        temp.temperature >= temp.high -> Color(0xFFFF9800)
                        else -> Color(0xFF4CAF50)
                    }
                )
            }
        }
    }
}

@Composable
private fun ProcessCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.List, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Top Processes", style = MaterialTheme.typography.labelLarge)
        }
        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Process", modifier = Modifier.weight(1f), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("CPU", modifier = Modifier.width(44.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Mem", modifier = Modifier.width(44.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        metrics.processes.take(10).forEach { proc ->
            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), thickness = 0.5.dp)
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(proc.name, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                    Text(proc.user, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text(
                    "${proc.cpu.roundToInt()}%",
                    modifier = Modifier.width(44.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = usageColor(proc.cpu)
                )
                Text(
                    "${proc.memory.roundToInt()}%",
                    modifier = Modifier.width(44.dp),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun DockerCard(metrics: SystemMetrics) {
    MetricCard(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Cloud, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Docker Containers", style = MaterialTheme.typography.labelLarge)
        }
        metrics.docker.forEach { container ->
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(container.name, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
                    Text(container.image, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                }
                Spacer(Modifier.width(8.dp))
                Badge(
                    containerColor = when (container.status) {
                        "running" -> Color(0xFF4CAF50)
                        "paused" -> Color(0xFFFF9800)
                        else -> MaterialTheme.colorScheme.error
                    }
                ) {
                    Text(
                        container.status,
                        modifier = Modifier.padding(horizontal = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }
        }
    }
}

private fun usageColor(usage: Double): Color = when {
    usage >= 90 -> Color(0xFFE53935)
    usage >= 75 -> Color(0xFFFF9800)
    else -> Color(0xFF4CAF50)
}

private fun formatUptime(seconds: Long): String {
    val days = seconds / 86400
    val hours = (seconds % 86400) / 3600
    val minutes = (seconds % 3600) / 60
    return when {
        days > 0 -> "${days}d ${hours}h ${minutes}m"
        hours > 0 -> "${hours}h ${minutes}m"
        else -> "${minutes}m"
    }
}

private fun formatMb(mb: Double): String = when {
    mb >= 1024 -> "${"%.1f".format(mb / 1024)} GB"
    else -> "${"%.0f".format(mb)} MB"
}
