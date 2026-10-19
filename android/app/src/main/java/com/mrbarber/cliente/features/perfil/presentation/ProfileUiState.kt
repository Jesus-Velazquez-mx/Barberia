package com.mrbarber.cliente.features.perfil.presentation

import com.mrbarber.cliente.features.perfil.domain.model.Gender
import java.time.LocalDate

data class ProfileUiState(
    val isLoading: Boolean = true,
    // Encabezado: lo que está guardado actualmente
    val displayName: String = "",
    val displayEmail: String = "",
    // Formulario editable
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phone: String = "",
    val birthDate: LocalDate? = null,
    val gender: Gender? = null,
    val hasChanges: Boolean = false,
    val isSaving: Boolean = false,
    val isDeleting: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val isLoggedOut: Boolean = false
) {
    val isBusy: Boolean get() = isSaving || isDeleting
    val canSave: Boolean get() = hasChanges && !isBusy
}
