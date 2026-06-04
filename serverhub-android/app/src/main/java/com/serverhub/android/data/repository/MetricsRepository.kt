package com.serverhub.android.data.repository

import com.serverhub.android.data.api.ConnectionState
import com.serverhub.android.data.api.WebSocketManager
import kotlinx.coroutines.flow.SharedFlow

class MetricsRepository {

    private val wsManager = WebSocketManager()

    val messages: SharedFlow<String> = wsManager.messages
    val connectionState: SharedFlow<ConnectionState> = wsManager.connectionState

    fun connect(baseUrl: String, token: String) {
        val wsBase = baseUrl.replace("https://", "wss://").replace("http://", "ws://")
        wsManager.connect("$wsBase/ws?token=$token")
    }

    fun disconnect() {
        wsManager.disconnect()
    }
}
