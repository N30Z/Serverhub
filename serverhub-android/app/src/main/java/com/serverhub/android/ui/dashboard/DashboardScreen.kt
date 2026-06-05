@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.dashboard

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.api.ConnectionState
import com.serverhub.android.data.model.SystemMetrics
import com.serverhub.android.ui.components.AreaChart
import com.serverhub.android.ui.components.CardHeader
import com.serverhub.android.ui.components.DonutChart
import com.serverhub.android.ui.components.DualAreaChart
import com.serverhub.android.ui.components.HorizontalBar
import com.serverhub.android.ui.components.MetricCard
import com.serverhub.android.ui.components.MetricValue
import com.serverhub.android.ui.components.StatusBadge
import com.serverhub.android.ui.components.StatusDot
import com.serverhub.android.ui.components.containerStatusColor
import com.serverhub.android.ui.components.formatMb
import com.serverhub.android.ui.components.formatUptime
import com.serverhub.android.ui.components.serviceStatusColor
import com.serverhub.android.ui.components.usageColor
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentOrange
import com.serverhub.android.ui.theme.AccentPurple
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.AccentYellow
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlin.math.roundToInt

@Composable
fun DashboardScreen(
    metrics: SystemMetrics?,
    connectionState: ConnectionState,
    onOpenDrawer: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        metrics?.hostname ?: "Dashboard",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Spacer(Modifier.width(8.dp))
                    StatusDot(
                        color = when (connectionState) {
                            is ConnectionState.Connected -> AccentGreen
                            is ConnectionState.Error     -> AccentRed
                            else                         -> AccentYellow
                        }
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = when (connectionState) {
                            is ConnectionState.Connected -> "Live"
                            is ConnectionState.Disconnected -> "Offline"
                            is ConnectionState.Error -> "Error"
                        },
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                }
            },
            navigationIcon = {
                IconButton(onClick = onOpenDrawer) {
                    Icon(Icons.Default.Menu, contentDescription = "Menu", tint = TextSecondary)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        if (metrics == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AccentBlue)
            }
            return@Column
        }

        var activeDetail by remember { mutableStateOf<DetailTarget?>(null) }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // ── System Overview ───────────────────────────────────────────────
            item { SystemOverviewCard(metrics) }

            // ── CPU + Memory (side-by-side donut cards) ───────────────────────
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CpuCard(metrics, Modifier.weight(1f).tappable { activeDetail = DetailTarget.CPU })
                    MemoryCard(metrics, Modifier.weight(1f).tappable { activeDetail = DetailTarget.MEMORY })
                }
            }

            // ── Network ───────────────────────────────────────────────────────
            if (metrics.network.interfaces.isNotEmpty()) {
                item { NetworkCard(metrics, Modifier.tappable { activeDetail = DetailTarget.NETWORK }) }
            }

            // ── Load Average ──────────────────────────────────────────────────
            item { LoadCard(metrics, Modifier.tappable { activeDetail = DetailTarget.LOAD }) }

            // ── Filesystems ───────────────────────────────────────────────────
            if (metrics.disk.isNotEmpty()) {
                item { FilesystemsCard(metrics, Modifier.tappable { activeDetail = DetailTarget.DISK }) }
            }

            // ── Memory Breakdown ──────────────────────────────────────────────
            item { MemoryBreakdownCard(metrics, Modifier.tappable { activeDetail = DetailTarget.MEMORY }) }

            // ── Temperatures ──────────────────────────────────────────────────
            if (metrics.temperatures.isNotEmpty()) {
                item { TemperaturesCard(metrics, Modifier.tappable { activeDetail = DetailTarget.TEMPERATURE }) }
            }

            // ── Top Processes ─────────────────────────────────────────────────
            if (metrics.processes.isNotEmpty()) {
                item { ProcessesCard(metrics) }
            }

            // ── Logged-in Users ───────────────────────────────────────────────
            if (metrics.users.isNotEmpty()) {
                item { UsersCard(metrics) }
            }

            // ── Services summary ──────────────────────────────────────────────
            if (metrics.services.isNotEmpty()) {
                item { ServicesCard(metrics) }
            }

            // ── Docker ────────────────────────────────────────────────────────
            if (metrics.docker.isNotEmpty()) {
                item { DockerCard(metrics) }
            }
        }

        activeDetail?.let { target ->
            MetricDetailSheet(
                target = target,
                metrics = metrics,
                onDismiss = { activeDetail = null }
            )
        }
    }
}

private fun Modifier.tappable(onClick: () -> Unit): Modifier =
    this.clip(RoundedCornerShape(10.dp)).clickable(onClick = onClick)

// ── Widgets ───────────────────────────────────────────────────────────────────

@Composable
private fun SystemOverviewCard(m: SystemMetrics) {
    MetricCard(Modifier.fillMaxWidth()) {
        CardHeader(label = "System", icon = Icons.Default.Computer)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            InfoItem("Hostname", m.hostname)
            InfoItem("OS", m.os.take(30))
        }
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            InfoItem("Kernel", m.kernel.take(30))
            InfoItem("Uptime", formatUptime(m.uptime))
        }
    }
}

@Composable
private fun InfoItem(label: String, value: String) {
    Column {
        Text(label, fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium, maxLines = 1)
    }
}

@Composable
private fun CpuCard(m: SystemMetrics, modifier: Modifier) {
    val color = usageColor(m.cpu.usage)
    MetricCard(modifier) {
        CardHeader(label = "CPU", icon = Icons.Default.Memory)
        Spacer(Modifier.height(10.dp))
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(72.dp).align(Alignment.CenterHorizontally)) {
            DonutChart(progress = (m.cpu.usage / 100).toFloat(), color = color, modifier = Modifier.fillMaxSize())
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${m.cpu.usage.roundToInt()}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color, fontFamily = FontFamily.Monospace)
            }
        }
        Spacer(Modifier.height(6.dp))
        Text("${m.cpu.cores} cores · ${m.cpu.frequency} GHz", fontSize = 10.sp, color = TextSecondary, modifier = Modifier.align(Alignment.CenterHorizontally))
        if (m.cpu.history.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            AreaChart(
                data = m.cpu.history.map { it.value },
                color = color,
                modifier = Modifier.fillMaxWidth().height(40.dp)
            )
        }
    }
}

@Composable
private fun MemoryCard(m: SystemMetrics, modifier: Modifier) {
    val color = usageColor(m.memory.usage)
    MetricCard(modifier) {
        CardHeader(label = "Memory", icon = Icons.Default.Storage)
        Spacer(Modifier.height(10.dp))
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(72.dp).align(Alignment.CenterHorizontally)) {
            DonutChart(progress = (m.memory.usage / 100).toFloat(), color = color, modifier = Modifier.fillMaxSize())
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${m.memory.usage.roundToInt()}%", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color, fontFamily = FontFamily.Monospace)
            }
        }
        Spacer(Modifier.height(6.dp))
        Text("${formatMb(m.memory.used)} / ${formatMb(m.memory.total)}", fontSize = 10.sp, color = TextSecondary, modifier = Modifier.align(Alignment.CenterHorizontally))
        if (m.memory.history.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            AreaChart(
                data = m.memory.history.map { it.value },
                color = color,
                modifier = Modifier.fillMaxWidth().height(40.dp)
            )
        }
    }
}

@Composable
private fun NetworkCard(m: SystemMetrics, modifier: Modifier = Modifier) {
    MetricCard(modifier.fillMaxWidth()) {
        CardHeader(label = "Network", icon = Icons.Default.NetworkCheck, trailing = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).background(AccentBlue, androidx.compose.foundation.shape.CircleShape))
                    Spacer(Modifier.width(3.dp))
                    Text("RX", fontSize = 10.sp, color = TextSecondary)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).background(AccentPurple, androidx.compose.foundation.shape.CircleShape))
                    Spacer(Modifier.width(3.dp))
                    Text("TX", fontSize = 10.sp, color = TextSecondary)
                }
            }
        })
        Spacer(Modifier.height(6.dp))

        // Live RX/TX totals
        val primaryIface = m.network.interfaces.firstOrNull()
        if (primaryIface != null) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    MetricValue("${"%.1f".format(primaryIface.rxRate)}", color = AccentBlue)
                    Text("MB/s ↓ RX", fontSize = 10.sp, color = TextSecondary)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    MetricValue("${"%.1f".format(primaryIface.txRate)}", color = AccentPurple)
                    Text("MB/s ↑ TX", fontSize = 10.sp, color = TextSecondary)
                }
            }
        }

        if (m.network.history.size >= 2) {
            Spacer(Modifier.height(8.dp))
            DualAreaChart(
                rxData = m.network.history.map { it.rx },
                txData = m.network.history.map { it.tx },
                rxColor = AccentBlue,
                txColor = AccentPurple,
                modifier = Modifier.fillMaxWidth().height(56.dp)
            )
        }

        // Interface list
        if (m.network.interfaces.size > 1) {
            Spacer(Modifier.height(8.dp))
            m.network.interfaces.forEach { iface ->
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(iface.name, fontSize = 12.sp, color = TextPrimary)
                    Text(iface.ip, fontSize = 12.sp, color = TextSecondary)
                }
            }
        }
    }
}

@Composable
private fun LoadCard(m: SystemMetrics, modifier: Modifier = Modifier) {
    MetricCard(modifier.fillMaxWidth()) {
        CardHeader(label = "Load Average", icon = Icons.Default.Speed)
        Spacer(Modifier.height(10.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            LoadItem("1 min", m.load.load1)
            LoadItem("5 min", m.load.load5)
            LoadItem("15 min", m.load.load15)
        }
        if (m.load.history.size >= 2) {
            Spacer(Modifier.height(8.dp))
            AreaChart(
                data = m.load.history.map { it.value },
                color = AccentBlue,
                modifier = Modifier.fillMaxWidth().height(48.dp)
            )
        }
    }
}

@Composable
private fun LoadItem(label: String, value: Double) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        MetricValue("%.2f".format(value))
        Text(label, fontSize = 10.sp, color = TextSecondary)
    }
}

@Composable
private fun FilesystemsCard(m: SystemMetrics, modifier: Modifier = Modifier) {
    MetricCard(modifier.fillMaxWidth()) {
        CardHeader(label = "Filesystems", icon = Icons.Default.Storage)
        m.disk.forEach { disk ->
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(disk.mountpoint, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                Text("${disk.usage.roundToInt()}%", fontSize = 12.sp, color = usageColor(disk.usage), fontFamily = FontFamily.Monospace)
            }
            Spacer(Modifier.height(3.dp))
            HorizontalBar(
                progress = (disk.usage / 100).toFloat(),
                color = usageColor(disk.usage),
                modifier = Modifier.fillMaxWidth().height(8.dp)
            )
            Text(
                "${formatMb(disk.used)} used of ${formatMb(disk.total)} · ${disk.fstype}",
                fontSize = 10.sp, color = TextSecondary
            )
        }
    }
}

@Composable
private fun MemoryBreakdownCard(m: SystemMetrics, modifier: Modifier = Modifier) {
    MetricCard(modifier.fillMaxWidth()) {
        CardHeader(label = "Memory Map", icon = Icons.Default.Memory)
        Spacer(Modifier.height(10.dp))

        // Stacked segments: used / cached / buffers / free
        val total = m.memory.total.coerceAtLeast(1.0)
        val usedPct  = (m.memory.used    / total).toFloat()
        val cachePct = (m.memory.cached  / total).toFloat()
        val bufPct   = (m.memory.buffers / total).toFloat()

        // Stacked bar
        Row(modifier = Modifier.fillMaxWidth().height(12.dp).background(BorderDefault, androidx.compose.foundation.shape.RoundedCornerShape(6.dp)), verticalAlignment = Alignment.CenterVertically) {
            if (usedPct > 0f)  Box(Modifier.weight(usedPct).height(12.dp).background(AccentRed.copy(alpha = 0.8f)))
            if (cachePct > 0f) Box(Modifier.weight(cachePct).height(12.dp).background(AccentYellow.copy(alpha = 0.7f)))
            if (bufPct > 0f)   Box(Modifier.weight(bufPct).height(12.dp).background(AccentBlue.copy(alpha = 0.5f)))
            val freePct = (1f - usedPct - cachePct - bufPct).coerceAtLeast(0f)
            if (freePct > 0f)  Box(Modifier.weight(freePct).height(12.dp))
        }

        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            LegendItem("Used",    formatMb(m.memory.used),    AccentRed)
            LegendItem("Cached",  formatMb(m.memory.cached),  AccentYellow)
            LegendItem("Buffers", formatMb(m.memory.buffers), AccentBlue)
            LegendItem("Free",    formatMb(m.memory.free),    TextSecondary)
        }

        if (m.swap.total > 0) {
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Swap", fontSize = 11.sp, color = TextSecondary)
                Text("${formatMb(m.swap.used)} / ${formatMb(m.swap.total)}", fontSize = 11.sp, color = TextSecondary)
            }
            Spacer(Modifier.height(3.dp))
            HorizontalBar((m.swap.usage / 100).toFloat(), usageColor(m.swap.usage), modifier = Modifier.fillMaxWidth().height(8.dp))
        }
    }
}

@Composable
private fun LegendItem(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(6.dp).background(color, androidx.compose.foundation.shape.CircleShape))
            Spacer(Modifier.width(3.dp))
            Text(label, fontSize = 10.sp, color = TextSecondary)
        }
        Text(value, fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun TemperaturesCard(m: SystemMetrics, modifier: Modifier = Modifier) {
    MetricCard(modifier.fillMaxWidth()) {
        CardHeader(label = "Temperatures", icon = Icons.Default.Thermostat)
        m.temperatures.forEach { temp ->
            Spacer(Modifier.height(8.dp))
            val col = when {
                temp.temperature >= temp.critical -> AccentRed
                temp.temperature >= temp.high -> AccentOrange
                else -> AccentGreen
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(temp.sensor, fontSize = 12.sp, color = TextPrimary, modifier = Modifier.weight(1f))
                Text("${temp.temperature}°C", fontSize = 12.sp, color = col, fontFamily = FontFamily.Monospace)
            }
            Spacer(Modifier.height(3.dp))
            HorizontalBar(
                progress = (temp.temperature / temp.critical).toFloat().coerceIn(0f, 1f),
                color = col,
                modifier = Modifier.fillMaxWidth().height(6.dp)
            )
        }
    }
}

@Composable
private fun ProcessesCard(m: SystemMetrics) {
    MetricCard(Modifier.fillMaxWidth()) {
        CardHeader(label = "Top Processes")
        Spacer(Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Process", Modifier.weight(1f), fontSize = 10.sp, color = TextSecondary)
            Text("CPU", Modifier.width(42.dp), fontSize = 10.sp, color = TextSecondary)
            Text("MEM", Modifier.width(42.dp), fontSize = 10.sp, color = TextSecondary)
        }
        m.processes.take(7).forEach { proc ->
            androidx.compose.material3.HorizontalDivider(color = BorderDefault, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 4.dp))
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(proc.name, fontSize = 12.sp, color = TextPrimary, maxLines = 1)
                    Text(proc.user, fontSize = 10.sp, color = TextSecondary)
                }
                Text("${proc.cpu.roundToInt()}%", Modifier.width(42.dp), fontSize = 12.sp, color = usageColor(proc.cpu), fontFamily = FontFamily.Monospace)
                Text("${proc.memory.roundToInt()}%", Modifier.width(42.dp), fontSize = 12.sp, color = TextSecondary, fontFamily = FontFamily.Monospace)
            }
        }
    }
}

@Composable
private fun UsersCard(m: SystemMetrics) {
    MetricCard(Modifier.fillMaxWidth()) {
        CardHeader(label = "Logged-in Users")
        Spacer(Modifier.height(8.dp))
        m.users.forEach { user ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusDot(color = AccentGreen)
                    Spacer(Modifier.width(6.dp))
                    Text(user.user, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(user.tty, fontSize = 11.sp, color = TextSecondary)
                    Text(user.from, fontSize = 10.sp, color = TextSecondary)
                }
            }
        }
    }
}

@Composable
private fun ServicesCard(m: SystemMetrics) {
    val active   = m.services.count { it.status == "active" }
    val failed   = m.services.count { it.status == "failed" }
    val inactive = m.services.count { it.status == "inactive" }
    MetricCard(Modifier.fillMaxWidth()) {
        CardHeader(label = "Services", trailing = {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (active   > 0) StatusBadge("$active active",   AccentGreen)
                if (failed   > 0) StatusBadge("$failed failed",   AccentRed)
                if (inactive > 0) StatusBadge("$inactive inactive", TextSecondary)
            }
        })
        Spacer(Modifier.height(8.dp))
        m.services.take(8).forEach { svc ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusDot(color = serviceStatusColor(svc.status))
                    Spacer(Modifier.width(6.dp))
                    Text(svc.name, fontSize = 12.sp, color = TextPrimary, maxLines = 1)
                }
                StatusBadge(svc.status, serviceStatusColor(svc.status))
            }
        }
        if (m.services.size > 8) {
            Text("+ ${m.services.size - 8} more", fontSize = 11.sp, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
private fun DockerCard(m: SystemMetrics) {
    val running = m.docker.count { it.status == "running" }
    MetricCard(Modifier.fillMaxWidth()) {
        CardHeader(label = "Docker", trailing = {
            StatusBadge("$running running", AccentGreen)
        })
        Spacer(Modifier.height(8.dp))
        m.docker.forEach { c ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(c.name, fontSize = 12.sp, color = TextPrimary, maxLines = 1, fontWeight = FontWeight.Medium)
                    Text(c.image, fontSize = 10.sp, color = TextSecondary, maxLines = 1)
                }
                Spacer(Modifier.width(8.dp))
                StatusBadge(c.status, containerStatusColor(c.status))
            }
        }
    }
}
