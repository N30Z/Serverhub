@file:OptIn(ExperimentalMaterial3Api::class)

package com.serverhub.android.ui.ssh

import android.annotation.SuppressLint
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SshScreen(
    terminalUrl: String,
    onOpenDrawer: () -> Unit
) {
    Column(Modifier.fillMaxSize().background(BgPrimary)) {
        TopAppBar(
            title = {
                Text(
                    "SSH Terminal",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
            },
            navigationIcon = {
                IconButton(onClick = onOpenDrawer) {
                    Icon(Icons.Default.Menu, null, tint = TextSecondary)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = BgSecondary)
        )

        if (terminalUrl.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Not connected to agent", color = TextSecondary, fontSize = 14.sp)
            }
            return@Column
        }

        val context = LocalContext.current
        val webView = remember {
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                // Allow WebSockets from the page
                settings.cacheMode = WebSettings.LOAD_NO_CACHE

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest
                    ) = false
                }
                loadUrl(terminalUrl)
            }
        }

        DisposableEffect(Unit) {
            onDispose {
                webView.stopLoading()
                webView.destroy()
            }
        }

        AndroidView(
            factory = { webView },
            modifier = Modifier.fillMaxSize()
        )
    }
}
