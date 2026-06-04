package com.serverhub.android.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.serverhub.android.data.api.ConnectionState
import com.serverhub.android.data.api.ServerHubApi
import com.serverhub.android.data.model.Alert
import com.serverhub.android.data.model.CronJob
import com.serverhub.android.data.model.ExecResult
import com.serverhub.android.data.model.FileEntry
import com.serverhub.android.data.model.SystemMetrics
import com.serverhub.android.data.model.generateAlerts
import com.serverhub.android.data.repository.MetricsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

sealed class UiState {
    object Loading : UiState()
    object Login : UiState()
    object LoggingIn : UiState()
    object Dashboard : UiState()
    data class LoginError(val message: String) : UiState()
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("serverhub", Context.MODE_PRIVATE)
    private val repository = MetricsRepository()
    private val jsonParser = Json { ignoreUnknownKeys = true }

    // Authenticated API instance — set after successful login or on restore.
    private var api: ServerHubApi? = null

    private val _metrics = MutableStateFlow<SystemMetrics?>(null)
    val metrics: StateFlow<SystemMetrics?> = _metrics

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState

    private val _alerts = MutableStateFlow<List<Alert>>(emptyList())
    val alerts: StateFlow<List<Alert>> = _alerts

    private val _cronJobs = MutableStateFlow<List<CronJob>>(emptyList())
    val cronJobs: StateFlow<List<CronJob>> = _cronJobs

    val savedUrl: String get() = prefs.getString("server_url", "") ?: ""
    val savedUsername: String get() = prefs.getString("username", "") ?: ""

    init {
        viewModelScope.launch {
            repository.messages.collect { msg ->
                try {
                    val m = jsonParser.decodeFromString<SystemMetrics>(msg)
                    _metrics.value = m
                    _alerts.value = m.generateAlerts()
                } catch (_: Exception) {}
            }
        }
        viewModelScope.launch {
            repository.connectionState.collect { state ->
                _connectionState.value = state
            }
        }

        val token = prefs.getString("token", null)
        val url = savedUrl
        if (!token.isNullOrEmpty() && url.isNotEmpty()) {
            api = ServerHubApi(url).also { it.token = token }
            repository.connect(url, token)
            _uiState.value = UiState.Dashboard
            viewModelScope.launch { refreshCronJobs() }
        } else {
            _uiState.value = UiState.Login
        }
    }

    fun login(url: String, username: String, password: String) {
        val normalizedUrl = url.trimEnd('/')
        viewModelScope.launch {
            _uiState.value = UiState.LoggingIn
            val serverApi = ServerHubApi(normalizedUrl)
            serverApi.login(username, password).fold(
                onSuccess = { token ->
                    prefs.edit()
                        .putString("server_url", normalizedUrl)
                        .putString("username", username)
                        .putString("token", token)
                        .apply()
                    api = serverApi
                    repository.connect(normalizedUrl, token)
                    _uiState.value = UiState.Dashboard
                    refreshCronJobs()
                },
                onFailure = { error ->
                    _uiState.value = UiState.LoginError(error.message ?: "Login failed")
                }
            )
        }
    }

    fun logout() {
        repository.disconnect()
        prefs.edit().remove("token").apply()
        api = null
        _metrics.value = null
        _alerts.value = emptyList()
        _cronJobs.value = emptyList()
        _connectionState.value = ConnectionState.Disconnected
        _uiState.value = UiState.Login
    }

    // ── Files ─────────────────────────────────────────────────────────────────

    suspend fun listFiles(path: String): Result<List<FileEntry>> =
        api?.listFiles(path) ?: Result.failure(Exception("Not connected"))

    // ── Exec ──────────────────────────────────────────────────────────────────

    suspend fun exec(command: String): Result<ExecResult> =
        api?.exec(command) ?: Result.failure(Exception("Not connected"))

    // ── Cron ──────────────────────────────────────────────────────────────────

    private suspend fun refreshCronJobs() {
        api?.listCron()?.onSuccess { _cronJobs.value = it }
    }

    fun addCronJob(job: CronJob) {
        viewModelScope.launch {
            api?.addCron(job)?.onSuccess { created ->
                _cronJobs.value = _cronJobs.value + created
            }
        }
    }

    fun updateCronJob(job: CronJob) {
        viewModelScope.launch {
            api?.updateCron(job)?.onSuccess { updated ->
                _cronJobs.value = _cronJobs.value.map { if (it.id == updated.id) updated else it }
            }
        }
    }

    fun deleteCronJob(id: String) {
        viewModelScope.launch {
            api?.deleteCron(id)?.onSuccess {
                _cronJobs.value = _cronJobs.value.filter { it.id != id }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        repository.disconnect()
    }
}
