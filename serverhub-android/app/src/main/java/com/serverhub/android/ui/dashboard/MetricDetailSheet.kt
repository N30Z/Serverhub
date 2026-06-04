@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.SystemMetrics
import com.serverhub.android.ui.components.AreaChart
import com.serverhub.android.ui.components.DonutChart
import com.serverhub.android.ui.components.DualAreaChart
import com.serverhub.android.ui.components.HorizontalBar
import com.serverhub.android.ui.components.formatMb
import com.serverhub.android.ui.components.formatUptime
import com.serverhub.android.ui.components.usageColor
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentOrange
import com.serverhub.android.ui.theme.AccentPurple
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import kotlin.math.roundToInt

enum class DetailTarget { CPU, MEMORY, NETWORK, LOAD, DISK, TEMPERATURE }

@Composable
fun MetricDetailSheet(target: DetailTarget, metrics: SystemMetrics, onDismiss: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = BgSecondary
    ) {
        Column(modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 8.dp)) {
            when (target) {
                DetailTarget.CPU         -> CpuDetail(metrics)
                DetailTarget.MEMORY      -> MemoryDetail(metrics)
                DetailTarget.NETWORK     -> NetworkDetail(metrics)
                DetailTarget.LOAD        -> LoadDetail(metrics)
                DetailTarget.DISK        -> DiskDetail(metrics)
                DetailTarget.TEMPERATURE -> TempDetail(metrics)
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SheetTitle(text: String) {
    Text(text, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary, modifier = Modifier.padding(bottom = 16.dp))
}

@Composable
private fun DetailRow(label: String, value: String, valueColor: androidx.compose.ui.graphics.Color = TextPrimary) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp), horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = TextSecondary)
        Text(value, fontSize = 13.sp, color = valueColor, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun CpuDetail(m: SystemMetrics) {
    SheetTitle("CPU Details")

    // Donut + percentage
    Row(verticalAlignment = Alignment.CenterVertically) {
        DonutChart(progress = (m.cpu.usage / 100).toFloat(), color = usageColor(m.cpu.usage), modifier = Modifier.height(80.dp).width(80.dp))
        Spacer(Modifier.width(16.dp))
        Column {
            Text("${m.cpu.usage.roundToInt()}%", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = usageColor(m.cpu.usage), fontFamily = FontFamily.Monospace)
            Text("CPU utilization", fontSize = 12.sp, color = TextSecondary)
        }
    }

    Spacer(Modifier.height(16.dp))
    DetailRow("Model",     m.cpu.model)
    DetailRow("Cores",     "${m.cpu.cores}")
    DetailRow("Frequency", "${m.cpu.frequency} GHz")

    if (m.cpu.history.isNotEmpty()) {
        Spacer(Modifier.height(16.dp))
        Text("History", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        AreaChart(data = m.cpu.history.map { it.value }, color = usageColor(m.cpu.usage), modifier = Modifier.fillMaxWidth().height(100.dp))
    }

    if (m.cpu.perCore.isNotEmpty()) {
        Spacer(Modifier.height(16.dp))
        Text("Per-core usage", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        m.cpu.perCore.forEachIndexed { i, pct ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Core $i", fontSize = 11.sp, color = TextSecondary, modifier = Modifier.width(54.dp))
                HorizontalBar((pct / 100).toFloat(), usageColor(pct), modifier = Modifier.weight(1f).height(6.dp))
                Spacer(Modifier.width(8.dp))
                Text("${pct.roundToInt()}%", fontSize = 11.sp, color = usageColor(pct), fontFamily = FontFamily.Monospace, modifier = Modifier.width(36.dp))
            }
        }
    }
}

@Composable
private fun MemoryDetail(m: SystemMetrics) {
    SheetTitle("Memory Details")

    Row(verticalAlignment = Alignment.CenterVertically) {
        DonutChart(progress = (m.memory.usage / 100).toFloat(), color = usageColor(m.memory.usage), modifier = Modifier.height(80.dp).width(80.dp))
        Spacer(Modifier.width(16.dp))
        Column {
            Text("${m.memory.usage.roundToInt()}%", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = usageColor(m.memory.usage), fontFamily = FontFamily.Monospace)
            Text("${formatMb(m.memory.used)} of ${formatMb(m.memory.total)}", fontSize = 12.sp, color = TextSecondary)
        }
    }

    Spacer(Modifier.height(16.dp))
    DetailRow("Total",   formatMb(m.memory.total))
    DetailRow("Used",    formatMb(m.memory.used),    usageColor(m.memory.usage))
    DetailRow("Cached",  formatMb(m.memory.cached),  AccentBlue)
    DetailRow("Buffers", formatMb(m.memory.buffers), AccentPurple)
    DetailRow("Free",    formatMb(m.memory.free),    AccentGreen)

    if (m.swap.total > 0) {
        Spacer(Modifier.height(12.dp))
        Text("Swap", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        DetailRow("Total", formatMb(m.swap.total))
        DetailRow("Used",  formatMb(m.swap.used), usageColor(m.swap.usage))
        DetailRow("Free",  formatMb(m.swap.free), AccentGreen)
    }

    if (m.memory.history.isNotEmpty()) {
        Spacer(Modifier.height(16.dp))
        Text("History", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        AreaChart(data = m.memory.history.map { it.value }, color = usageColor(m.memory.usage), modifier = Modifier.fillMaxWidth().height(100.dp))
    }
}

@Composable
private fun NetworkDetail(m: SystemMetrics) {
    SheetTitle("Network Details")

    val ifaces = m.network.interfaces
    ifaces.forEach { iface ->
        Text(iface.name, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(bottom = 4.dp))
        DetailRow("IP",      iface.ip)
        DetailRow("MAC",     iface.mac)
        DetailRow("RX rate", "${"%.2f".format(iface.rxRate)} MB/s", AccentBlue)
        DetailRow("TX rate", "${"%.2f".format(iface.txRate)} MB/s", AccentPurple)
        DetailRow("Total RX",formatMb(iface.rx / 1024))
        DetailRow("Total TX",formatMb(iface.tx / 1024))
        Spacer(Modifier.height(12.dp))
    }

    if (m.network.history.size >= 2) {
        Text("Bandwidth history", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        Row(modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp), horizontalArrangement = androidx.compose.foundation.layout.Arrangement.End) {
            androidx.compose.foundation.layout.Box(modifier = Modifier.background(AccentBlue).height(2.dp).width(12.dp))
            Spacer(Modifier.width(4.dp)); Text("RX", fontSize = 10.sp, color = TextSecondary)
            Spacer(Modifier.width(10.dp))
            androidx.compose.foundation.layout.Box(modifier = Modifier.background(AccentPurple).height(2.dp).width(12.dp))
            Spacer(Modifier.width(4.dp)); Text("TX", fontSize = 10.sp, color = TextSecondary)
        }
        DualAreaChart(
            rxData = m.network.history.map { it.rx },
            txData = m.network.history.map { it.tx },
            rxColor = AccentBlue,
            txColor = AccentPurple,
            modifier = Modifier.fillMaxWidth().height(120.dp)
        )
    }
}

@Composable
private fun LoadDetail(m: SystemMetrics) {
    SheetTitle("Load Average")

    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceEvenly) {
        LoadBig("1 min",  m.load.load1, m.cpu.cores)
        LoadBig("5 min",  m.load.load5, m.cpu.cores)
        LoadBig("15 min", m.load.load15, m.cpu.cores)
    }

    Spacer(Modifier.height(12.dp))
    DetailRow("CPU cores (reference)", "${m.cpu.cores}")

    if (m.load.history.isNotEmpty()) {
        Spacer(Modifier.height(16.dp))
        Text("1-minute load history", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(bottom = 6.dp))
        AreaChart(data = m.load.history.map { it.value }, color = AccentBlue, modifier = Modifier.fillMaxWidth().height(100.dp))
    }
}

@Composable
private fun LoadBig(label: String, value: Double, cores: Int) {
    val color = if (value > cores) AccentRed else if (value > cores * 0.75) AccentOrange else AccentGreen
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("%.2f".format(value), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = color, fontFamily = FontFamily.Monospace)
        Text(label, fontSize = 11.sp, color = TextSecondary)
    }
}

@Composable
private fun DiskDetail(m: SystemMetrics) {
    SheetTitle("Disk Usage")
    m.disk.forEach { disk ->
        Text(disk.mountpoint, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
        HorizontalBar((disk.usage / 100).toFloat(), usageColor(disk.usage), modifier = Modifier.fillMaxWidth().height(8.dp))
        Spacer(Modifier.height(4.dp))
        DetailRow("Device",   disk.device)
        DetailRow("FS Type",  disk.fstype)
        DetailRow("Total",    formatMb(disk.total))
        DetailRow("Used",     formatMb(disk.used),  usageColor(disk.usage))
        DetailRow("Free",     formatMb(disk.free),  AccentGreen)
        DetailRow("Read",     "${"%.1f".format(disk.readSpeed)} MB/s")
        DetailRow("Write",    "${"%.1f".format(disk.writeSpeed)} MB/s")
        Spacer(Modifier.height(8.dp))
        androidx.compose.material3.HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
    }
}

@Composable
private fun TempDetail(m: SystemMetrics) {
    SheetTitle("Temperatures")
    m.temperatures.forEach { temp ->
        val color = when {
            temp.temperature >= temp.critical -> AccentRed
            temp.temperature >= temp.high     -> AccentOrange
            else                              -> AccentGreen
        }
        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(temp.sensor, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                Text("High: ${temp.high}°C  Critical: ${temp.critical}°C", fontSize = 10.sp, color = TextSecondary)
            }
            Text("${temp.temperature}°C", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color, fontFamily = FontFamily.Monospace)
        }
        HorizontalBar(
            progress = (temp.temperature / temp.critical).toFloat().coerceIn(0f, 1f),
            color = color,
            modifier = Modifier.fillMaxWidth().height(6.dp)
        )
        Spacer(Modifier.height(8.dp))
    }
}
