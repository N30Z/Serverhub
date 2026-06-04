package com.serverhub.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SystemMetrics(
    val hostname: String = "",
    val os: String = "",
    val kernel: String = "",
    val uptime: Long = 0,
    val cpu: CpuMetrics = CpuMetrics(),
    val memory: MemoryMetrics = MemoryMetrics(),
    val swap: SwapMetrics = SwapMetrics(),
    val disk: List<DiskMetrics> = emptyList(),
    val network: NetworkMetrics = NetworkMetrics(),
    val load: LoadMetrics = LoadMetrics(),
    val temperatures: List<TempMetrics> = emptyList(),
    val processes: List<Process> = emptyList(),
    val users: List<LoggedUser> = emptyList(),
    val services: List<Service> = emptyList(),
    val docker: List<DockerContainer> = emptyList()
)

@Serializable
data class CpuMetrics(
    val usage: Double = 0.0,
    val cores: Int = 0,
    val model: String = "",
    val frequency: Double = 0.0,
    val history: List<TimePoint> = emptyList(),
    val perCore: List<Double> = emptyList()
)

@Serializable
data class MemoryMetrics(
    val total: Double = 0.0,
    val used: Double = 0.0,
    val free: Double = 0.0,
    val cached: Double = 0.0,
    val buffers: Double = 0.0,
    val usage: Double = 0.0,
    val history: List<TimePoint> = emptyList()
)

@Serializable
data class SwapMetrics(
    val total: Double = 0.0,
    val used: Double = 0.0,
    val free: Double = 0.0,
    val usage: Double = 0.0
)

@Serializable
data class DiskMetrics(
    val device: String = "",
    val mountpoint: String = "",
    val fstype: String = "",
    val total: Double = 0.0,
    val used: Double = 0.0,
    val free: Double = 0.0,
    val usage: Double = 0.0,
    val readSpeed: Double = 0.0,
    val writeSpeed: Double = 0.0
)

@Serializable
data class NetworkMetrics(
    val interfaces: List<NetworkInterface> = emptyList(),
    val totalRx: Double = 0.0,
    val totalTx: Double = 0.0,
    val history: List<NetPoint> = emptyList()
)

@Serializable
data class NetworkInterface(
    val name: String = "",
    val ip: String = "",
    val mac: String = "",
    val rx: Double = 0.0,
    val tx: Double = 0.0,
    val rxRate: Double = 0.0,
    val txRate: Double = 0.0
)

@Serializable
data class LoadMetrics(
    val load1: Double = 0.0,
    val load5: Double = 0.0,
    val load15: Double = 0.0,
    val history: List<TimePoint> = emptyList()
)

@Serializable
data class TempMetrics(
    val sensor: String = "",
    val temperature: Double = 0.0,
    val high: Double = 80.0,
    val critical: Double = 95.0
)

@Serializable
data class Process(
    val pid: Int = 0,
    val name: String = "",
    val user: String = "",
    val cpu: Double = 0.0,
    val memory: Double = 0.0,
    val status: String = "",
    val started: String = ""
)

@Serializable
data class LoggedUser(
    val user: String = "",
    val tty: String = "",
    val from: String = "",
    val loginTime: String = ""
)

@Serializable
data class Service(
    val name: String = "",
    val status: String = "",
    val enabled: Boolean = false,
    val description: String = "",
    val since: String = ""
)

@Serializable
data class DockerContainer(
    val id: String = "",
    val name: String = "",
    val image: String = "",
    val status: String = "",
    val ports: List<String> = emptyList(),
    val cpu: Double = 0.0,
    val memory: Double = 0.0,
    val created: String = "",
    val uptime: String = ""
)

@Serializable
data class TimePoint(val time: String = "", val value: Double = 0.0)

@Serializable
data class NetPoint(val time: String = "", val rx: Double = 0.0, val tx: Double = 0.0)
