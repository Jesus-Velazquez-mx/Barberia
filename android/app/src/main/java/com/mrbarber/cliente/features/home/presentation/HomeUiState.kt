package com.mrbarber.cliente.features.home.presentation

data class HomeUiState(
    val isLoading: Boolean = true,
    val userName: String = "",
    val isLoggedOut: Boolean = false
)
