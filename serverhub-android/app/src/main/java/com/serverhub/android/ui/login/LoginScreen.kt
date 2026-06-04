package com.serverhub.android.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.ui.text.font.FontFamily
import com.serverhub.android.ui.theme.AccentBlue
import com.serverhub.android.ui.theme.AccentRed
import com.serverhub.android.ui.theme.BgPrimary
import com.serverhub.android.ui.theme.BgSecondary
import com.serverhub.android.ui.theme.BgTertiary
import com.serverhub.android.ui.theme.BorderDefault
import com.serverhub.android.ui.theme.GradientEnd
import com.serverhub.android.ui.theme.GradientStart
import com.serverhub.android.ui.theme.TextMuted
import com.serverhub.android.ui.theme.TextPrimary
import com.serverhub.android.ui.theme.TextSecondary

@Composable
fun LoginScreen(
    initialUrl: String,
    initialUsername: String,
    isLoading: Boolean,
    error: String?,
    onLogin: (url: String, username: String, password: String) -> Unit
) {
    var url by remember { mutableStateOf(initialUrl) }
    var username by remember { mutableStateOf(initialUsername) }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(Modifier.height(48.dp))

        // ── Brand ─────────────────────────────────────────────────────────────
        Text(
            text = "ServerHub",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            style = TextStyle(
                brush = Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))
            )
        )
        Spacer(Modifier.height(4.dp))
        Text("Server Monitoring", fontSize = 13.sp, color = TextSecondary)

        Spacer(Modifier.height(40.dp))

        // ── Form card ─────────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(BgSecondary)
                .border(1.dp, BorderDefault, RoundedCornerShape(12.dp))
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            InputField(
                label = "Server URL",
                value = url,
                onValueChange = { url = it },
                placeholder = "http://192.168.1.100:8080",
                keyboardType = KeyboardType.Uri,
                enabled = !isLoading
            )
            InputField(
                label = "Username",
                value = username,
                onValueChange = { username = it },
                placeholder = "admin",
                enabled = !isLoading
            )
            InputField(
                label = "Password",
                value = password,
                onValueChange = { password = it },
                placeholder = "••••••••",
                isPassword = !passwordVisible,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                enabled = !isLoading,
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }, modifier = Modifier.size(32.dp)) {
                        Icon(
                            if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null, tint = TextMuted, modifier = Modifier.size(18.dp)
                        )
                    }
                }
            )
        }

        if (error != null) {
            Spacer(Modifier.height(10.dp))
            Text(error, fontSize = 12.sp, color = AccentRed)
        }

        Spacer(Modifier.height(16.dp))

        // ── Connect button ────────────────────────────────────────────────────
        Button(
            onClick = { onLogin(url.trim(), username.trim(), password) },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            enabled = !isLoading && url.isNotBlank() && username.isNotBlank() && password.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.Transparent,
                disabledContainerColor = Color.Transparent
            ),
            shape = RoundedCornerShape(10.dp)
        ) {
            val brush = Brush.linearGradient(colors = listOf(GradientStart, GradientEnd))
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (!isLoading && url.isNotBlank() && username.isNotBlank() && password.isNotBlank()) brush else Brush.linearGradient(listOf(Color(0xFF2D3748), Color(0xFF2D3748)))),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Connect", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                }
            }
        }

        Spacer(Modifier.height(48.dp))
    }
}

@Composable
private fun InputField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    enabled: Boolean = true,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    Column {
        Text(label, fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 5.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(BgTertiary)
                .border(1.dp, BorderDefault, RoundedCornerShape(8.dp))
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                enabled = enabled,
                singleLine = true,
                visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
                keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
                textStyle = TextStyle(
                    color = TextPrimary,
                    fontSize = 14.sp,
                    fontFamily = if (isPassword) FontFamily.Monospace else FontFamily.Default
                ),
                modifier = Modifier.weight(1f),
                decorationBox = { inner ->
                    if (value.isEmpty()) Text(placeholder, fontSize = 14.sp, color = TextMuted)
                    inner()
                }
            )
            trailingIcon?.invoke()
        }
    }
}
