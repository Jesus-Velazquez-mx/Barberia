package com.mrbarber.cliente.features.perfil.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mrbarber.cliente.core.common.toUserMessage
import com.mrbarber.cliente.features.perfil.domain.model.Gender
import com.mrbarber.cliente.features.perfil.domain.model.Profile
import com.mrbarber.cliente.features.perfil.domain.usecase.DeleteAccountUseCase
import com.mrbarber.cliente.features.perfil.domain.usecase.GetProfileUseCase
import com.mrbarber.cliente.features.perfil.domain.usecase.LogoutUseCase
import com.mrbarber.cliente.features.perfil.domain.usecase.UpdateProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    getProfile: GetProfileUseCase,
    private val updateProfile: UpdateProfileUseCase,
    private val deleteAccount: DeleteAccountUseCase,
    private val logout: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    /** Último perfil guardado; sirve para saber si el formulario tiene cambios. */
    private var saved: Profile? = null

    init {
        viewModelScope.launch {
            // Cuando la sesión se borra (logout, cuenta eliminada o token vencido) llega null.
            getProfile().collect { profile ->
                if (profile == null) {
                    _uiState.update { it.copy(isLoading = false, isLoggedOut = true) }
                    return@collect
                }
                val isFirstLoad = saved == null
                saved = profile
                _uiState.update { state ->
                    val base = if (isFirstLoad) state.withForm(profile) else state
                    base.copy(
                        isLoading = false,
                        displayName = profile.fullName,
                        displayEmail = profile.email
                    ).withChanges()
                }
            }
        }
    }

    fun onFirstNameChange(value: String) = edit { copy(firstName = value) }
    fun onLastNameChange(value: String) = edit { copy(lastName = value) }
    fun onEmailChange(value: String) = edit { copy(email = value) }
    fun onPhoneChange(value: String) = edit { copy(phone = value.filter(Char::isDigit).take(10)) }
    fun onBirthDateChange(value: LocalDate) = edit { copy(birthDate = value) }
    fun onGenderChange(value: Gender) = edit { copy(gender = value) }

    fun onSaveClick() {
        val state = _uiState.value
        val current = saved ?: return
        if (!state.canSave) return

        _uiState.update { it.copy(isSaving = true, error = null, successMessage = null) }
        viewModelScope.launch {
            updateProfile(state.toProfile(current.id))
                .onSuccess { profile ->
                    saved = profile
                    _uiState.update {
                        it.withForm(profile)
                            .copy(isSaving = false, successMessage = "Tus datos se guardaron correctamente")
                            .withChanges()
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSaving = false, error = e.toUserMessage()) }
                }
        }
    }

    fun onLogoutConfirm() {
        viewModelScope.launch { logout() }
    }

    fun onDeleteAccountConfirm() {
        _uiState.update { it.copy(isDeleting = true, error = null, successMessage = null) }
        viewModelScope.launch {
            // Si se elimina, la sesión se borra y el colector de init marca isLoggedOut.
            deleteAccount().onFailure { e ->
                _uiState.update { it.copy(isDeleting = false, error = e.toUserMessage()) }
            }
        }
    }

    private fun edit(transform: ProfileUiState.() -> ProfileUiState) {
        _uiState.update { it.transform().copy(error = null, successMessage = null).withChanges() }
    }

    private fun ProfileUiState.withForm(profile: Profile) = copy(
        firstName = profile.firstName,
        lastName = profile.lastName,
        email = profile.email,
        phone = profile.phone,
        birthDate = profile.birthDate,
        gender = profile.gender
    )

    private fun ProfileUiState.withChanges(): ProfileUiState {
        val current = saved ?: return copy(hasChanges = false)
        return copy(hasChanges = toProfile(current.id) != current)
    }

    private fun ProfileUiState.toProfile(id: String) = Profile(
        id = id,
        firstName = firstName.trim(),
        lastName = lastName.trim(),
        email = email.trim(),
        phone = phone.trim(),
        birthDate = birthDate,
        gender = gender
    )
}
