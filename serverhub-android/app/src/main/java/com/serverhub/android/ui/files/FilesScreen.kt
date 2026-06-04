@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.files

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FolderOpen
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

@Composable
fun FilesScreen(onOpenDrawer: () -> Unit) {
    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = { Text("File Manager", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary) },
            navigationIcon = { IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = TextSecondary) } },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.FolderOpen, null, tint = TextSecondary, modifier = Modifier.size(56.dp))
                Spacer(Modifier.height(16.dp))
                Text("File Manager", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(6.dp))
                Text("Coming soon — requires SFTP agent support", color = TextSecondary, fontSize = 13.sp)
            }
        }
    }
}
