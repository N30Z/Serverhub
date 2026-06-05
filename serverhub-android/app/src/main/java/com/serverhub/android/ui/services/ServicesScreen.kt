@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.services

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.data.model.Service
import com.serverhub.android.ui.components.StatusBadge
import com.serverhub.android.ui.components.StatusDot
import com.serverhub.android.ui.components.serviceStatusColor
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

private val filters = listOf("All", "Active", "Inactive", "Failed")

@Composable
fun ServicesScreen(services: List<Service>, onOpenDrawer: () -> Unit) {
    var filter by remember { mutableStateOf("All") }

    val filtered = when (filter) {
        "Active"   -> services.filter { it.status == "active" }
        "Inactive" -> services.filter { it.status == "inactive" }
        "Failed"   -> services.filter { it.status == "failed" }
        else       -> services
    }

    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = {
                Column {
                    Text("Services", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text("${services.size} total · ${services.count { it.status == "active" }} active · ${services.count { it.status == "failed" }} failed",
                        fontSize = 11.sp, color = TextSecondary)
                }
            },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filters) { f ->
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

        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 12.dp)) {
            items(filtered, key = { it.name }) { svc ->
                ServiceRow(svc)
                HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
            }
        }
    }
}

@Composable
private fun ServiceRow(svc: Service) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            StatusDot(serviceStatusColor(svc.status))
            Spacer(Modifier.width(10.dp))
            Column {
                Text(svc.name, fontSize = 13.sp, color = TextPrimary, fontWeight = FontWeight.Medium, maxLines = 1)
                if (svc.description.isNotEmpty()) {
                    Text(svc.description, fontSize = 11.sp, color = TextSecondary, maxLines = 1)
                }
            }
        }
        Spacer(Modifier.width(8.dp))
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
            StatusBadge(svc.status, serviceStatusColor(svc.status))
            if (svc.enabled) StatusBadge("enabled", Color(0xFF484F58))
        }
    }
}
