package com.mrbarber.cliente.core.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.datastore.SessionStorage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

/**
 * Decide la pantalla inicial: si hay una sesión guardada y vigente se abre Home, si no, Login.
 * Mientras se lee DataStore el valor es null.
 */
@HiltViewModel
class StartViewModel @Inject constructor(
    sessionStorage: SessionStorage
) : ViewModel() {

    val startDestination: StateFlow<Any?> = flow {
        val session = sessionStorage.session.first()
        emit(if (session != null) HomeDestination else LoginDestination)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, null)
}
