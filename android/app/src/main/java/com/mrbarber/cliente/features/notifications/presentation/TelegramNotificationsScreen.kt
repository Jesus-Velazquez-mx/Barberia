package com.mrbarber.cliente.features.notifications.presentation

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mrbarber.cliente.R
import com.mrbarber.cliente.ui.components.BackButton
import com.mrbarber.cliente.ui.components.SectionCard
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.ui.theme.Negro
import com.mrbarber.cliente.ui.theme.TelegramAzul

/**
 * Pantalla para vincular la cuenta con el bot de Telegram y recibir avisos de las citas.
 */
@Composable
fun TelegramNotificationsRoute(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TelegramNotificationsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current

    // Abre Telegram (o el navegador si no está instalado). Si no hay app que lo abra, openUri lanza.
    LaunchedEffect(state.linkUrl) {
        state.linkUrl?.let {
            runCatching { uriHandler.openUri(it) }
                .onSuccess { viewModel.onLinkOpened() }
                .onFailure { viewModel.onLinkOpenFailed() }
        }
    }

    // Al abrir la pantalla y al volver de Telegram, revisa si la cuenta ya quedó vinculada.
    LifecycleResumeEffect(Unit) {
        viewModel.refreshStatus()
        onPauseOrDispose { }
    }

    TelegramNotifications(
        isLinked = state.isLinked,
        isLoading = state.isLoading,
        error = state.error,
        onBack = onBack,
        onConnectClick = viewModel::onConnectClick,
        onDismissError = viewModel::dismissError,
        onRetryClick = if (state.canRetryStatus) viewModel::retryStatus else null,
        modifier = modifier
    )
}

/**
 * @param onRetryClick si no es null, el error muestra "Reintentar" (solo para fallos al consultar el estado;
 * para los del enlace, el propio botón de conectar sirve para reintentar).
 */
@Composable
fun TelegramNotifications(
    isLinked: Boolean,
    isLoading: Boolean,
    error: String?,
    onBack: () -> Unit,
    onConnectClick: () -> Unit,
    onDismissError: () -> Unit,
    modifier: Modifier = Modifier,
    onRetryClick: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 8.dp)
        ) {
            BackButton(onClick = onBack)

            Spacer(Modifier.height(8.dp))

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("RECORDATORIOS", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(24.dp))

                Image(
                    painter = painterResource(id = R.drawable.telegram_logo),
                    contentDescription = "Logo de Telegram",
                    modifier = Modifier.requiredSize(150.dp)
                )

                Spacer(Modifier.height(16.dp))
                Text(
                    text = "Recibe tus avisos por Telegram",
                    fontSize = 20.sp,
                    color = Dorado,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Te avisaremos cuando queden 24 horas y 4 horas antes de cada cita.",
                    fontSize = 14.sp,
                    color = GrisClaro,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(24.dp))

            if (!isLinked) {
                SectionCard(title = "¿Cómo funciona?") {
                    Step(number = 1, text = "Toca el botón para abrir nuestro bot en Telegram.")
                    Step(number = 2, text = "En el chat del bot, pulsa \"Iniciar\".")
                    Step(number = 3, text = "Listo: tu cuenta queda vinculada y empezarás a recibir avisos.")
                }

                Spacer(Modifier.height(24.dp))
            }

            error?.let {
                ErrorMessage(message = it, onDismiss = onDismissError, onRetry = onRetryClick)
                Spacer(Modifier.height(12.dp))
            }

            if (isLinked) {
                LinkedStatus()
            } else {
                Button(
                    onClick = onConnectClick,
                    enabled = !isLoading,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = TelegramAzul,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                    } else {
                        Text("CONECTAR CON TELEGRAM", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun Step(number: Int, text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(Dorado, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number.toString(),
                color = Negro,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
        Text(text = text, fontSize = 14.sp, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun ErrorMessage(message: String, onDismiss: () -> Unit, onRetry: (() -> Unit)?) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = message, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            onRetry?.let {
                TextButton(onClick = it) { Text("Reintentar", color = Dorado) }
            }
            TextButton(onClick = onDismiss) { Text("Cerrar", color = GrisClaro) }
        }
    }
}

@Composable
private fun LinkedStatus() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Dorado.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "✓ Telegram vinculado",
            color = Dorado,
            fontWeight = FontWeight.Bold
        )
    }
}

@Preview(showBackground = true)
@Composable
fun TelegramNotificationsPreview() {
    MrBarberTheme {
        TelegramNotifications(
            isLinked = false,
            isLoading = false,
            error = null,
            onBack = {},
            onConnectClick = {},
            onDismissError = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun TelegramNotificationsLinkedPreview() {
    MrBarberTheme {
        TelegramNotifications(
            isLinked = true,
            isLoading = false,
            error = null,
            onBack = {},
            onConnectClick = {},
            onDismissError = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun TelegramNotificationsErrorPreview() {
    MrBarberTheme {
        TelegramNotifications(
            isLinked = false,
            isLoading = false,
            error = "No se pudo conectar con el servidor. Revisa tu conexión.",
            onBack = {},
            onConnectClick = {},
            onDismissError = {},
            onRetryClick = {}
        )
    }
}
