package com.serverhub.android.data.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class CronJob(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val command: String,
    val schedule: String,        // cron expression  e.g. "0 * * * *"
    val description: String = "",
    val user: String = "root",
    val enabled: Boolean = true
) {
    val scheduleLabel: String get() = cronToLabel(schedule)
}

private fun cronToLabel(expr: String): String = when (expr) {
    "* * * * *"   -> "Every minute"
    "*/5 * * * *" -> "Every 5 minutes"
    "*/15 * * * *"-> "Every 15 minutes"
    "*/30 * * * *"-> "Every 30 minutes"
    "0 * * * *"   -> "Every hour"
    "0 */6 * * *" -> "Every 6 hours"
    "0 */12 * * *"-> "Every 12 hours"
    "0 0 * * *"   -> "Daily at midnight"
    "0 6 * * *"   -> "Daily at 06:00"
    "0 0 * * 0"   -> "Weekly (Sunday)"
    "0 0 1 * *"   -> "Monthly"
    "@reboot"     -> "On boot"
    else          -> expr
}

val CRON_PRESETS: List<Pair<String, String>> = listOf(
    "Every minute"    to "* * * * *",
    "Every 5 minutes" to "*/5 * * * *",
    "Every 15 minutes" to "*/15 * * * *",
    "Every 30 minutes" to "*/30 * * * *",
    "Every hour"       to "0 * * * *",
    "Every 6 hours"    to "0 */6 * * *",
    "Every 12 hours"   to "0 */12 * * *",
    "Daily at midnight" to "0 0 * * *",
    "Daily at 06:00"  to "0 6 * * *",
    "Weekly (Sunday)" to "0 0 * * 0",
    "Monthly"         to "0 0 1 * *",
    "On boot"         to "@reboot",
)
