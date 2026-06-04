package com.serverhub.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val ServerHubColorScheme = darkColorScheme(
    primary          = AccentBlue,
    secondary        = AccentPurple,
    tertiary         = AccentGreen,
    background       = BgPrimary,
    surface          = BgSecondary,
    surfaceVariant   = BgCard,
    surfaceContainer = BgTertiary,
    onBackground     = TextPrimary,
    onSurface        = TextPrimary,
    onSurfaceVariant = TextSecondary,
    outline          = BorderDefault,
    outlineVariant   = BorderSubtle,
    error            = AccentRed,
    onPrimary        = BgPrimary,
)

@Composable
fun ServerHubTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ServerHubColorScheme,
        content = content
    )
}
