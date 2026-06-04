@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgCard
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.GradientEnd
import com.serverhub.android.ui.theme.GradientStart
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

@Composable
fun SettingsScreen(
    savedUrl: String,
    savedUsername: String,
    onOpenDrawer: () -> Unit,
    onLogout: () -> Unit
) {
    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("Settings", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)
        ) {
            // App branding
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "ServerHub",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    style = androidx.compose.ui.text.TextStyle(
                        brush = Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))
                    )
                )
                Text("Server Monitoring App", fontSize = 12.sp, color = TextSecondary)
            }

            SectionHeader("Connection")
            SettingsCard {
                SettingsRow(icon = Icons.Default.Link, label = "Server URL", value = savedUrl)
                HorizontalDivider(color = BorderDefault, thickness = 0.5.dp)
                SettingsRow(icon = Icons.Default.Person, label = "Username", value = savedUsername)
            }

            Spacer(Modifier.height(16.dp))
            SectionHeader("Session")
            SettingsCard {
                SettingsRow(icon = Icons.Default.Link, label = "App Version", value = "1.0.0")
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentRed.copy(0.15f)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Logout, null, tint = AccentRed)
                Spacer(Modifier.width(8.dp))
                Text("Logout", color = AccentRed, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title.uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        color = TextMuted,
        letterSpacing = 0.08.sp,
        modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp)
    )
}

@Composable
private fun SettingsCard(content: @Composable Column.() -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(BgCard),
        content = content
    )
}

@Composable
private fun SettingsRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = TextSecondary, modifier = Modifier.width(16.dp))
        Spacer(Modifier.width(12.dp))
        Text(label, fontSize = 14.sp, color = TextPrimary, modifier = Modifier.weight(1f))
        Text(value, fontSize = 12.sp, color = TextSecondary, maxLines = 1)
    }
}
