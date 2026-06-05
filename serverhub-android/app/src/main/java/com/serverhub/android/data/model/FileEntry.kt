package com.serverhub.android.data.model

import kotlinx.serialization.Serializable

@Serializable
data class FileEntry(
    val name: String,
    val path: String,
    val isDir: Boolean,
    val size: Long = 0,
    val mode: String = "",
    val modTime: Long = 0
)

@Serializable
data class ExecResult(
    val stdout: String,
    val stderr: String,
    val exitCode: Int
)
