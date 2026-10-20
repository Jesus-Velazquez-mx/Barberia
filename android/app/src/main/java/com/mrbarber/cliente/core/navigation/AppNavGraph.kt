package com.mrbarber.cliente.core.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mrbarber.cliente.features.home.presentation.HomeRoute
import com.mrbarber.cliente.features.login.presentation.LoginRoute
import com.mrbarber.cliente.features.profile.presentation.ProfileRoute

@Composable
fun AppNavGraph(
    modifier: Modifier = Modifier,
    startViewModel: StartViewModel = hiltViewModel()
) {
    val startDestination by startViewModel.startDestination.collectAsStateWithLifecycle()

    // Todavía se está leyendo la sesión guardada: solo el fondo, sin parpadeo del login.
    val start = startDestination ?: run {
        Box(modifier.fillMaxSize().background(MaterialTheme.colorScheme.background))
        return
    }

    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = start,
        modifier = modifier
    ) {
        composable<LoginDestination> {
            LoginRoute(
                onLoginSuccess = {
                    navController.navigate(HomeDestination) {
                        popUpTo<LoginDestination> { inclusive = true }
                    }
                }
            )
        }
        composable<HomeDestination> {
            HomeRoute(
                onProfileClick = { navController.navigate(ProfileDestination) },
                onLoggedOut = { navController.navigateToLoginClearingStack() }
            )
        }
        composable<ProfileDestination> {
            ProfileRoute(
                onBack = { navController.popBackStack() },
                onLoggedOut = { navController.navigateToLoginClearingStack() }
            )
        }
    }
}

/** Al cerrar sesión o eliminar la cuenta no debe quedar ninguna pantalla privada en la pila. */
private fun NavHostController.navigateToLoginClearingStack() {
    navigate(LoginDestination) {
        popUpTo(graph.id) { inclusive = true }
    }
}
