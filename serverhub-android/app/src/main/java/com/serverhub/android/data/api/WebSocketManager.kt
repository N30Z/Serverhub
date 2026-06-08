package com.serverhub.android.data.api

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import kotlin.math.min

sealed class ConnectionState {
    object Connected : ConnectionState()
    object Disconnected : ConnectionState()
    object Connecting : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}

private const val INITIAL_RETRY_DELAY_MS = 2_000L
private const val MAX_RETRY_DELAY_MS = 30_000L

class WebSocketManager {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val messages: SharedFlow<String> = _messages

    private val _connectionState = MutableSharedFlow<ConnectionState>(extraBufferCapacity = 4, replay = 1)
    val connectionState: SharedFlow<ConnectionState> = _connectionState

    private val scope = CoroutineScope(SupervisorJob())

    private var webSocket: WebSocket? = null
    private var reconnectJob: Job? = null
    private var retryDelayMs = INITIAL_RETRY_DELAY_MS
    private var targetUrl: String? = null
    private var wantsConnection = false

    fun connect(url: String) {
        targetUrl = url
        wantsConnection = true
        retryDelayMs = INITIAL_RETRY_DELAY_MS
        reconnectJob?.cancel()
        reconnectJob = null
        openSocket(url)
    }

    private fun openSocket(url: String) {
        webSocket?.close(1000, null)
        webSocket = null
        _connectionState.tryEmit(ConnectionState.Connecting)

        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                retryDelayMs = INITIAL_RETRY_DELAY_MS
                _connectionState.tryEmit(ConnectionState.Connected)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                _messages.tryEmit(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                _connectionState.tryEmit(ConnectionState.Disconnected)
                webSocket.close(1000, null)
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _connectionState.tryEmit(ConnectionState.Error(t.message ?: "Connection failed"))
                scheduleReconnect()
            }
        })
    }

    /** Re-attempts the connection with exponential backoff while the caller still wants one. */
    private fun scheduleReconnect() {
        if (!wantsConnection || reconnectJob?.isActive == true) return
        val url = targetUrl ?: return
        val delayMs = retryDelayMs
        retryDelayMs = min(retryDelayMs * 2, MAX_RETRY_DELAY_MS)
        reconnectJob = scope.launch {
            delay(delayMs)
            if (wantsConnection) openSocket(url)
        }
    }

    fun disconnect() {
        wantsConnection = false
        targetUrl = null
        reconnectJob?.cancel()
        reconnectJob = null
        webSocket?.close(1000, "Disconnect")
        webSocket = null
        _connectionState.tryEmit(ConnectionState.Disconnected)
    }
}
