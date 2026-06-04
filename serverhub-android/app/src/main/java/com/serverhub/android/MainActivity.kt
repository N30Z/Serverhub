package com.serverhub.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.serverhub.android.ui.login.LoginScreen
import com.serverhub.android.ui.navigation.AppNavigation
import com.serverhub.android.ui.theme.ServerHubTheme
import com.serverhub.android.viewmodel.MainViewModel
import com.serverhub.android.viewmodel.UiState

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ServerHubTheme {
                val uiState by viewModel.uiState.collectAsState()

                when (uiState) {
                    is UiState.Loading -> Unit
                    is UiState.Login,
                    is UiState.LoggingIn,
                    is UiState.LoginError -> LoginScreen(
                        initialUrl = viewModel.savedUrl,
                        initialUsername = viewModel.savedUsername,
                        isLoading = uiState is UiState.LoggingIn,
                        error = (uiState as? UiState.LoginError)?.message,
                        onLogin = viewModel::login
                    )
                    is UiState.Dashboard -> AppNavigation(viewModel)
                }
            }
        }
    }
}
