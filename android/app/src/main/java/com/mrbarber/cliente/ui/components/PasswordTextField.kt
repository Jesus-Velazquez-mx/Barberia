package com.mrbarber.cliente.ui.components

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.mrbarber.cliente.ui.theme.Dorado

/** Campo de contraseña con botón "Ver" / "Ocultar". */
@Composable
fun PasswordTextField(
    value: String,
    onValueChange: (String) -> Unit,
    isVisible: Boolean,
    onToggleVisibility: () -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Contraseña",
    enabled: Boolean = true,
    supportingText: String? = null
) {
    AppTextField(
        value = value,
        onValueChange = onValueChange,
        label = label,
        modifier = modifier,
        enabled = enabled,
        supportingText = supportingText,
        keyboardType = KeyboardType.Password,
        visualTransformation = if (isVisible) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = {
            TextButton(onClick = onToggleVisibility) {
                Text(if (isVisible) "Ocultar" else "Ver", color = Dorado)
            }
        }
    )
}
