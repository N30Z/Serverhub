@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.alerts

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Warning
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.Alert
import com.serverhub.android.data.model.AlertSeverity
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.AccentYellow
import com.serverhub.android.ui.theme.BgCard
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val filterOptions = listOf("All", "Critical", "Warning", "Info")

@Composable
fun AlertsScreen(alerts: List<Alert>, onOpenDrawer: () -> Unit) {
    var filter by remember { mutableStateOf("All") }

    val filtered = when (filter) {
        "Critical" -> alerts.filter { it.severity == AlertSeverity.CRITICAL }
        "Warning"  -> alerts.filter { it.severity == AlertSeverity.WARNING }
        "Info"     -> alerts.filter { it.severity == AlertSeverity.INFO }
        else       -> alerts
    }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Alert Center", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    val critical = alerts.count { it.severity == AlertSeverity.CRITICAL }
                    if (critical > 0) {
                        Spacer(Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(AccentRed)
                                .padding(horizontal = 6.dp, vertical = 1.dp)
                        ) {
                            Text("$critical", fontSize = 10.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filterOptions) { f ->
                val selected = f == filter
                Text(
                    text = f,
                    fontSize = 12.sp,
                    color = if (selected) AccentBlue else TextSecondary,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (selected) AccentBlue.copy(0.12f) else BgTertiary)
                        .clickable { filter = f }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }

        if (filtered.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Notifications, null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("No alerts", color = TextSecondary)
                }
            }
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filtered, key = { it.id }) { alert ->
                AlertCard(alert)
            }
        }
    }
}

@Composable
private fun AlertCard(alert: Alert) {
    val (color, icon) = when (alert.severity) {
        AlertSeverity.CRITICAL -> AccentRed    to Icons.Default.Warning
        AlertSeverity.WARNING  -> AccentYellow to Icons.Default.Warning
        AlertSeverity.INFO     -> AccentBlue   to Icons.Default.Info
    }
    val sdf = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(color.copy(alpha = 0.08f))
            .then(
                Modifier.then(
                    androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.25f)).let {
                        Modifier  // border handled below
                    }
                )
            )
            .clip(RoundedCornerShape(10.dp))
            .background(BgCard)
            .padding(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(icon, null, tint = color, modifier = Modifier.size(18.dp).padding(top = 1.dp))
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(alert.title, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                Text(sdf.format(Date(alert.timestamp)), fontSize = 10.sp, color = TextSecondary)
            }
            Spacer(Modifier.height(2.dp))
            Text(alert.message, fontSize = 12.sp, color = TextSecondary)
        }
    }
}
