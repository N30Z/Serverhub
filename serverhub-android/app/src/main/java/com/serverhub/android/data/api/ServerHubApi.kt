package com.serverhub.android.data.api

import android.net.Uri
import com.serverhub.android.data.model.CronJob
import com.serverhub.android.data.model.ExecResult
import com.serverhub.android.data.model.FileEntry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
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
    private val jsonType = "application/json".toMediaType()

    var token: String = ""

    // ── Auth ─────────────────────────────────────────────────────────────────

    suspend fun login(username: String, password: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val body = """{"username":"$username","password":"$password","client":"android"}"""
                    .toRequestBody(jsonType)
                val response = client.newCall(
                    Request.Builder().url("$baseUrl/api/auth/login").post(body).build()
                ).execute()
                if (!response.isSuccessful) return@withContext Result.failure(
                    Exception("Login failed (${response.code}): check credentials")
                )
                val raw = response.body?.string()
                    ?: return@withContext Result.failure(Exception("Empty response"))
                val tok = json.parseToJsonElement(raw).jsonObject["token"]?.jsonPrimitive?.content
                    ?: return@withContext Result.failure(Exception("No token in response"))
                token = tok
                Result.success(tok)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    fun wsUrl(): String {
        val wsBase = baseUrl
            .replace("https://", "wss://")
            .replace("http://", "ws://")
        return "$wsBase/ws?token=$token"
    }

    // ── Files ─────────────────────────────────────────────────────────────────

    suspend fun listFiles(path: String): Result<List<FileEntry>> =
        withContext(Dispatchers.IO) {
            try {
                val encoded = Uri.encode(path)
                val resp = authedGet("/api/files?path=$encoded")
                if (!resp.isSuccessful) return@withContext Result.failure(
                    Exception("HTTP ${resp.code}")
                )
                val body = resp.body?.string() ?: return@withContext Result.failure(
                    Exception("Empty response")
                )
                Result.success(json.decodeFromString<List<FileEntry>>(body))
            } catch (e: Exception) { Result.failure(e) }
        }

    suspend fun readFile(path: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val encoded = Uri.encode(path)
                val resp = authedGet("/api/files/read?path=$encoded")
                if (!resp.isSuccessful) return@withContext Result.failure(
                    Exception("HTTP ${resp.code}")
                )
                Result.success(resp.body?.string() ?: "")
            } catch (e: Exception) { Result.failure(e) }
        }

    // ── Exec ──────────────────────────────────────────────────────────────────

    suspend fun exec(command: String, timeoutSecs: Int = 10): Result<ExecResult> =
        withContext(Dispatchers.IO) {
            try {
                val bodyStr = """{"command":${Json.encodeToString(command)},"timeout":$timeoutSecs}"""
                val resp = authedPost("/api/exec", bodyStr)
                val raw = resp.body?.string() ?: return@withContext Result.failure(
                    Exception("Empty response")
                )
                if (!resp.isSuccessful) return@withContext Result.failure(Exception("HTTP ${resp.code}: $raw"))
                Result.success(json.decodeFromString<ExecResult>(raw))
            } catch (e: Exception) { Result.failure(e) }
        }

    // ── Cron ──────────────────────────────────────────────────────────────────

    suspend fun listCron(): Result<List<CronJob>> =
        withContext(Dispatchers.IO) {
            try {
                val resp = authedGet("/api/cron")
                if (!resp.isSuccessful) return@withContext Result.failure(Exception("HTTP ${resp.code}"))
                val body = resp.body?.string() ?: return@withContext Result.failure(Exception("Empty"))
                Result.success(json.decodeFromString<List<CronJob>>(body))
            } catch (e: Exception) { Result.failure(e) }
        }

    suspend fun addCron(job: CronJob): Result<CronJob> =
        withContext(Dispatchers.IO) {
            try {
                val resp = authedPost("/api/cron", json.encodeToString(job))
                val body = resp.body?.string() ?: return@withContext Result.failure(Exception("Empty"))
                if (!resp.isSuccessful) return@withContext Result.failure(Exception("HTTP ${resp.code}: $body"))
                Result.success(json.decodeFromString<CronJob>(body))
            } catch (e: Exception) { Result.failure(e) }
        }

    suspend fun updateCron(job: CronJob): Result<CronJob> =
        withContext(Dispatchers.IO) {
            try {
                val resp = authedPut("/api/cron/${job.id}", json.encodeToString(job))
                val body = resp.body?.string() ?: return@withContext Result.failure(Exception("Empty"))
                if (!resp.isSuccessful) return@withContext Result.failure(Exception("HTTP ${resp.code}: $body"))
                Result.success(json.decodeFromString<CronJob>(body))
            } catch (e: Exception) { Result.failure(e) }
        }

    suspend fun deleteCron(id: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val resp = authedDelete("/api/cron/$id")
                if (!resp.isSuccessful) return@withContext Result.failure(Exception("HTTP ${resp.code}"))
                Result.success(Unit)
            } catch (e: Exception) { Result.failure(e) }
        }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun authedGet(path: String) =
        client.newCall(
            Request.Builder().url("$baseUrl$path")
                .header("Authorization", "Bearer $token").get().build()
        ).execute()

    private fun authedPost(path: String, bodyStr: String) =
        client.newCall(
            Request.Builder().url("$baseUrl$path")
                .header("Authorization", "Bearer $token")
                .post(bodyStr.toRequestBody(jsonType)).build()
        ).execute()

    private fun authedPut(path: String, bodyStr: String) =
        client.newCall(
            Request.Builder().url("$baseUrl$path")
                .header("Authorization", "Bearer $token")
                .put(bodyStr.toRequestBody(jsonType)).build()
        ).execute()

    private fun authedDelete(path: String) =
        client.newCall(
            Request.Builder().url("$baseUrl$path")
                .header("Authorization", "Bearer $token")
                .delete().build()
        ).execute()
}
