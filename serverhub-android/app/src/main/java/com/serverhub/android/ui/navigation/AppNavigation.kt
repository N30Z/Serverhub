@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.DrawerValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.serverhub.android.data.api.ConnectionState
import com.serverhub.android.ui.alerts.AlertsScreen
import com.serverhub.android.ui.components.StatusDot
import com.serverhub.android.ui.cron.CronScreen
import com.serverhub.android.ui.dashboard.DashboardScreen
import com.serverhub.android.ui.docker.DockerScreen
import com.serverhub.android.ui.files.FilesScreen
import com.serverhub.android.ui.processes.ProcessesScreen
import com.serverhub.android.ui.services.ServicesScreen
import com.serverhub.android.ui.settings.SettingsScreen
import com.serverhub.android.ui.ssh.SshScreen
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgCard
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.GradientEnd
import com.serverhub.android.ui.theme.GradientStart
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary
import com.serverhub.android.viewmodel.MainViewModel
import kotlinx.coroutines.launch

object Routes {
    const val DASHBOARD  = "dashboard"
    const val PROCESSES  = "processes"
    const val SERVICES   = "services"
    const val DOCKER     = "docker"
    const val ALERTS     = "alerts"
    const val SSH        = "ssh"
    const val FILES      = "files"
    const val CRON       = "cron"
    const val SETTINGS   = "settings"
}

data class NavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

private val mainItems = listOf(
    NavItem(Routes.DASHBOARD, "Dashboard", Icons.Default.Dashboard),
    NavItem(Routes.SSH,       "SSH Terminal", Icons.Default.Terminal),
    NavItem(Routes.FILES,     "File Manager", Icons.Default.FolderOpen),
    NavItem(Routes.CRON,      "Cron Jobs", Icons.Default.AccessTime),
)
private val monitoringItems = listOf(
    NavItem(Routes.ALERTS,    "Alert Center", Icons.Default.Notifications),
    NavItem(Routes.PROCESSES, "Processes", Icons.Default.List),
    NavItem(Routes.SERVICES,  "Services", Icons.Default.Layers),
    NavItem(Routes.DOCKER,    "Docker", Icons.Default.Cloud),
)
private val configItems = listOf(
    NavItem(Routes.SETTINGS, "Settings", Icons.Default.Settings),
)

@Composable
fun AppNavigation(viewModel: MainViewModel) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route ?: Routes.DASHBOARD
    val connectionState by viewModel.connectionState.collectAsState()
    val metrics by viewModel.metrics.collectAsState()

    fun navigate(route: String) {
        if (route != currentRoute) {
            navController.navigate(route) {
                launchSingleTop = true
                restoreState = true
            }
        }
        scope.launch { drawerState.close() }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(260.dp),
                drawerContainerColor = BgSecondary,
                drawerTonalElevation = 0.dp
            ) {
                DrawerContent(
                    hostname = metrics?.hostname ?: "ServerHub",
                    connectionState = connectionState,
                    currentRoute = currentRoute,
                    onNavigate = ::navigate,
                    onLogout = { viewModel.logout() }
                )
            }
        }
    ) {
        NavHost(
            navController = navController,
            startDestination = Routes.DASHBOARD,
            modifier = Modifier.fillMaxSize().background(com.serverhub.android.ui.theme.BgPrimary)
        ) {
            composable(Routes.DASHBOARD) {
                DashboardScreen(
                    metrics = metrics,
                    connectionState = connectionState,
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }
            composable(Routes.PROCESSES) {
                ProcessesScreen(
                    processes = metrics?.processes ?: emptyList(),
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }
            composable(Routes.SERVICES) {
                ServicesScreen(
                    services = metrics?.services ?: emptyList(),
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }
            composable(Routes.DOCKER) {
                DockerScreen(
                    containers = metrics?.docker ?: emptyList(),
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }
            composable(Routes.ALERTS) {
                AlertsScreen(
                    alerts = viewModel.alerts.collectAsState().value,
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }
            composable(Routes.SSH)      { SshScreen(onOpenDrawer = { scope.launch { drawerState.open() } }) }
            composable(Routes.FILES)    { FilesScreen(onOpenDrawer = { scope.launch { drawerState.open() } }) }
            composable(Routes.CRON)     { CronScreen(onOpenDrawer = { scope.launch { drawerState.open() } }) }
            composable(Routes.SETTINGS) {
                SettingsScreen(
                    savedUrl = viewModel.savedUrl,
                    savedUsername = viewModel.savedUsername,
                    onOpenDrawer = { scope.launch { drawerState.open() } },
                    onLogout = { viewModel.logout() }
                )
            }
        }
    }
}

@Composable
private fun DrawerContent(
    hostname: String,
    connectionState: ConnectionState,
    currentRoute: String,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxHeight()
            .background(BgSecondary)
            .statusBarsPadding()
    ) {
        // ── Logo ─────────────────────────────────────────────────────────────
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "ServerHub",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                style = androidx.compose.ui.text.TextStyle(
                    brush = Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))
                )
            )
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                StatusDot(
                    color = if (connectionState is ConnectionState.Connected) AccentGreen else AccentRed
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = hostname,
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }
        }

        HorizontalDivider(color = BorderDefault, thickness = 1.dp)

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(vertical = 8.dp)
        ) {
            NavGroup("Main", mainItems, currentRoute, onNavigate)
            NavGroup("Monitoring", monitoringItems, currentRoute, onNavigate)
            NavGroup("Config", configItems, currentRoute, onNavigate)
        }

        HorizontalDivider(color = BorderDefault, thickness = 1.dp)

        // ── Logout ───────────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onLogout() }
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Logout, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(10.dp))
            Text("Logout", color = TextSecondary, fontSize = 14.sp)
        }
    }
}

@Composable
private fun NavGroup(
    title: String,
    items: List<NavItem>,
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    Text(
        text = title.uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        color = TextMuted,
        letterSpacing = 0.1.sp,
        modifier = Modifier.padding(start = 16.dp, top = 12.dp, bottom = 4.dp)
    )
    items.forEach { item ->
        val selected = currentRoute == item.route
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 1.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(if (selected) AccentBlue.copy(alpha = 0.1f) else Color.Transparent)
                .then(
                    if (selected) Modifier.border(1.dp, AccentBlue.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    else Modifier
                )
                .clickable { onNavigate(item.route) }
                .padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = null,
                tint = if (selected) AccentBlue else TextSecondary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = item.label,
                fontSize = 14.sp,
                color = if (selected) TextPrimary else TextSecondary,
                fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
            )
        }
    }
}
