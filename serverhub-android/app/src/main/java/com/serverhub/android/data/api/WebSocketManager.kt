package com.serverhub.android.data.api

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

sealed class ConnectionState {
    object Connected : ConnectionState()
    object Disconnected : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}

class WebSocketManager {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val messages: SharedFlow<String> = _messages

    private val _connectionState = MutableSharedFlow<ConnectionState>(extraBufferCapacity = 4)
    val connectionState: SharedFlow<ConnectionState> = _connectionState

    private var webSocket: WebSocket? = null

    fun connect(url: String) {
        disconnect()
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                _connectionState.tryEmit(ConnectionState.Connected)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                _messages.tryEmit(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                _connectionState.tryEmit(ConnectionState.Disconnected)
                webSocket.close(1000, null)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _connectionState.tryEmit(ConnectionState.Error(t.message ?: "Connection failed"))
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "Disconnect")
        webSocket = null
    }
}
