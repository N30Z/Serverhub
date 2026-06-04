package com.serverhub.android.data.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ServerHubApi(private val baseUrl: String) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun login(username: String, password: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val body = """{"username":"$username","password":"$password"}"""
                    .toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$baseUrl/api/auth/login")
                    .post(body)
                    .build()
                val response = client.newCall(request).execute()
                if (!response.isSuccessful) {
                    return@withContext Result.failure(
                        Exception("Login failed (${response.code}): check credentials")
                    )
                }
                val responseBody = response.body?.string()
                    ?: return@withContext Result.failure(Exception("Empty response"))
                val token = json.parseToJsonElement(responseBody)
                    .jsonObject["token"]?.jsonPrimitive?.content
                    ?: return@withContext Result.failure(Exception("No token in response"))
                Result.success(token)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    fun wsUrl(token: String): String {
        val wsBase = baseUrl
            .replace("https://", "wss://")
            .replace("http://", "ws://")
        return "$wsBase/ws?token=$token"
    }
}
