package com.mrbarber.cliente.features.home.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.features.home.domain.usecase.GetCurrentUserUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    getCurrentUser: GetCurrentUserUseCase
) : ViewModel() {

    // Si la sesión se borra (logout desde el perfil) o vence, el estado pasa a isLoggedOut y la UI regresa al login.
    val uiState: StateFlow<HomeUiState> = getCurrentUser()
        .map { user ->
            if (user == null) {
                HomeUiState(isLoading = false, isLoggedOut = true)
            } else {
                HomeUiState(isLoading = false, userName = "${user.firstName} ${user.lastName}")
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())
}
