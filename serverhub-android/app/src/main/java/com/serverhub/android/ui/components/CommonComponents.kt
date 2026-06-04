package com.serverhub.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentGreen
import com.serverhub.android.ui.theme.AccentOrange
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.AccentYellow
import com.serverhub.android.ui.theme.BgCard
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.TextSecondary

val CardShape = RoundedCornerShape(12.dp)

@Composable
fun MetricCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .clip(CardShape)
            .background(BgCard)
            .border(1.dp, BorderDefault, CardShape)
            .padding(12.dp),
        content = content
    )
}

@Composable
fun CardHeader(
    label: String,
    icon: ImageVector? = null,
    modifier: Modifier = Modifier,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(Modifier.width(5.dp))
            }
            Text(
                text = label.uppercase(),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.08.sp,
                color = TextSecondary
            )
        }
        trailing?.invoke()
    }
}

@Composable
fun MetricValue(
    value: String,
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.onSurface
) {
    Text(
        text = value,
        fontSize = 26.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
        color = color,
        modifier = modifier
    )
}

@Composable
fun StatusBadge(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.15f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(text, fontSize = 11.sp, color = color, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun StatusDot(color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(color)
    )
}

fun usageColor(pct: Double): Color = when {
    pct >= 90 -> AccentRed
    pct >= 75 -> AccentOrange
    pct >= 60 -> AccentYellow
    else -> AccentGreen
}

fun serviceStatusColor(status: String): Color = when (status) {
    "active"   -> AccentGreen
    "failed"   -> AccentRed
    "inactive" -> Color(0xFF484F58)
    else       -> AccentYellow
}

fun containerStatusColor(status: String): Color = when (status) {
    "running"    -> AccentGreen
    "paused"     -> AccentYellow
    "restarting" -> AccentBlue
    else         -> AccentRed
}

private fun formatMbShared(mb: Double): String = when {
    mb >= 1024 -> "${"%.1f".format(mb / 1024)} GB"
    else       -> "${"%.0f".format(mb)} MB"
}
val formatMb: (Double) -> String = ::formatMbShared

fun formatUptime(seconds: Long): String {
    val d = seconds / 86400
    val h = (seconds % 86400) / 3600
    val m = (seconds % 3600) / 60
    return when {
        d > 0  -> "${d}d ${h}h ${m}m"
        h > 0  -> "${h}h ${m}m"
        else   -> "${m}m"
    }
}
