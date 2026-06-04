package com.serverhub.android.data.model

import java.util.UUID

enum class AlertSeverity { CRITICAL, WARNING, INFO }

data class Alert(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val message: String,
    val severity: AlertSeverity,
    val timestamp: Long = System.currentTimeMillis(),
    val resolved: Boolean = false
)

fun SystemMetrics.generateAlerts(): List<Alert> {
    val alerts = mutableListOf<Alert>()

    if (cpu.usage >= 95) alerts += Alert(title = "CPU Critical", message = "CPU at ${cpu.usage.toInt()}%", severity = AlertSeverity.CRITICAL)
    else if (cpu.usage >= 80) alerts += Alert(title = "CPU High", message = "CPU at ${cpu.usage.toInt()}%", severity = AlertSeverity.WARNING)

    if (memory.usage >= 95) alerts += Alert(title = "Memory Critical", message = "Memory at ${memory.usage.toInt()}%", severity = AlertSeverity.CRITICAL)
    else if (memory.usage >= 80) alerts += Alert(title = "Memory High", message = "Memory at ${memory.usage.toInt()}%", severity = AlertSeverity.WARNING)

    disk.forEach { d ->
        if (d.usage >= 95) alerts += Alert(title = "Disk Critical", message = "${d.mountpoint} at ${d.usage.toInt()}%", severity = AlertSeverity.CRITICAL)
        else if (d.usage >= 85) alerts += Alert(title = "Disk High", message = "${d.mountpoint} at ${d.usage.toInt()}%", severity = AlertSeverity.WARNING)
    }

    temperatures.forEach { t ->
        if (t.temperature >= t.critical) alerts += Alert(title = "Temperature Critical", message = "${t.sensor}: ${t.temperature}°C", severity = AlertSeverity.CRITICAL)
        else if (t.temperature >= t.high) alerts += Alert(title = "Temperature High", message = "${t.sensor}: ${t.temperature}°C", severity = AlertSeverity.WARNING)
    }

    services.filter { it.status == "failed" }.forEach { s ->
        alerts += Alert(title = "Service Failed", message = "${s.name} has failed", severity = AlertSeverity.CRITICAL)
    }

    if (alerts.isEmpty()) alerts += Alert(title = "All systems normal", message = "No issues detected", severity = AlertSeverity.INFO)

    return alerts
}
