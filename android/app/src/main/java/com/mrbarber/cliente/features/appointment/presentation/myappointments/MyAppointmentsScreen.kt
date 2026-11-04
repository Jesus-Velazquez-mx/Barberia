package com.mrbarber.cliente.features.appointment.presentation.myappointments

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mrbarber.cliente.features.appointment.domain.model.Appointment
import com.mrbarber.cliente.features.appointment.domain.model.BUSINESS_ZONE
import com.mrbarber.cliente.features.appointment.domain.usecase.CancelAppointmentUseCase
import com.mrbarber.cliente.ui.components.BackButton
import com.mrbarber.cliente.ui.components.ConfirmDialog
import com.mrbarber.cliente.ui.components.FullScreenLoading
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.ui.theme.Negro
import com.mrbarber.cliente.ui.theme.Rojo
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun MyAppointmentsRoute(
    onBack: () -> Unit,
    onEditClick: (appointmentId: String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MyAppointmentsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    // Se recarga al entrar y al volver de modificar una cita.
    LifecycleResumeEffect(Unit) {
        viewModel.load()
        onPauseOrDispose { }
    }

    state.appointmentToCancel?.let {
        ConfirmDialog(
            title = "Cancelar cita",
            text = "¿Seguro que quieres cancelar esta cita? El horario quedará libre para otros clientes.",
            confirmText = "Cancelar cita",
            onDismiss = viewModel::onCancelDismiss,
            onConfirm = viewModel::onCancelConfirm,
            isDestructive = true
        ) {
            OutlinedTextField(
                value = state.cancelReason,
                onValueChange = viewModel::onCancelReasonChanged,
                label = { Text("Motivo (opcional)") },
                supportingText = {
                    Text("${state.cancelReason.length}/${CancelAppointmentUseCase.MAX_REASON_LENGTH}", color = GrisClaro)
                },
                maxLines = 3,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }

    MyAppointments(
        state = state,
        onBack = onBack,
        onRetry = viewModel::load,
        onEditClick = { onEditClick(it.id) },
        onCancelClick = viewModel::onCancelClick,
        modifier = modifier
    )
}

@Composable
fun MyAppointments(
    state: MyAppointmentsUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onEditClick: (Appointment) -> Unit,
    onCancelClick: (Appointment) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 8.dp)
        ) {
            BackButton(onClick = onBack)

            Spacer(Modifier.height(8.dp))

            Text(
                "MIS CITAS",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(16.dp))

            state.error?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                Spacer(Modifier.height(12.dp))
            }

            when {
                // Solo pantalla completa en la primera carga; al recargar se mantiene la lista.
                state.isLoading && state.appointments.isEmpty() -> FullScreenLoading()

                state.appointments.isEmpty() && state.error != null ->
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        TextButton(onClick = onRetry) {
                            Text("REINTENTAR", color = Dorado, fontWeight = FontWeight.Bold)
                        }
                    }

                state.appointments.isEmpty() -> EmptyAppointments()

                else ->
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(state.appointments, key = { it.id }) { appointment ->
                            AppointmentCard(
                                appointment = appointment,
                                shopName = state.shopNames[appointment.shopId],
                                serviceNames = appointment.serviceIds.mapNotNull { state.serviceNames[it] },
                                isCancelling = appointment.id == state.cancellingId,
                                onEditClick = { onEditClick(appointment) },
                                onCancelClick = { onCancelClick(appointment) }
                            )
                        }
                        item { Spacer(Modifier.height(16.dp)) }
                    }
            }
        }
    }
}

@Composable
private fun AppointmentCard(
    appointment: Appointment,
    shopName: String?,
    serviceNames: List<String>,
    isCancelling: Boolean,
    onEditClick: () -> Unit,
    onCancelClick: () -> Unit
) {
    // El backend responde en UTC: se muestra en la hora de la sucursal.
    val start = appointment.scheduledStart.atZoneSameInstant(BUSINESS_ZONE)
    val end = appointment.scheduledEnd.atZoneSameInstant(BUSINESS_ZONE)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = GrisOscuro),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    start.format(FULL_DATE_FORMAT).replaceFirstChar { it.uppercase() },
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Dorado,
                    modifier = Modifier.weight(1f)
                )
                StatusBadge(appointment.status)
            }
            Text(
                "${start.format(TIME_FORMAT)} – ${end.format(TIME_FORMAT)}",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            shopName?.let { Text(it, fontSize = 14.sp, color = GrisClaro) }
            if (serviceNames.isNotEmpty()) {
                Text(serviceNames.joinToString(), fontSize = 14.sp)
            }
            appointment.notes?.let { Text("Notas: $it", fontSize = 13.sp, color = GrisClaro) }

            Spacer(Modifier.height(4.dp))

            if (appointment.canModify) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = onEditClick,
                        enabled = !isCancelling,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Dorado),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("REAGENDAR", fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onCancelClick,
                        enabled = !isCancelling,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Rojo, contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        if (isCancelling) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                        } else {
                            Text("CANCELAR", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                Text(
                    "Faltan menos de ${Appointment.MIN_HOURS_BEFORE} horas: ya no se puede reagendar " +
                        "ni cancelar desde la app. Comunícate con la sucursal.",
                    fontSize = 12.sp,
                    color = GrisClaro
                )
            }
        }
    }
}

@Composable
private fun StatusBadge(status: String) {
    val (label, color) = when (status) {
        "scheduled" -> "Agendada" to Dorado
        "rescheduled" -> "Reagendada" to Color(0xFF64B5F6)
        else -> status to GrisClaro
    }
    Text(
        label,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        color = Negro,
        modifier = Modifier
            .background(color, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 2.dp)
    )
}

@Composable
private fun EmptyAppointments() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("No tienes citas próximas", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(
            "Cuando agendes una cita aparecerá aquí.",
            fontSize = 14.sp,
            color = GrisClaro,
            textAlign = TextAlign.Center
        )
    }
}

private val LOCALE_MX: Locale = Locale.forLanguageTag("es-MX")
private val FULL_DATE_FORMAT: DateTimeFormatter =
    DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", LOCALE_MX)
private val TIME_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a", LOCALE_MX)

@Preview(showBackground = true)
@Composable
fun MyAppointmentsPreview() {
    val tomorrow = OffsetDateTime.now(BUSINESS_ZONE).plusDays(1).withHour(11).withMinute(0)
    MrBarberTheme {
        MyAppointments(
            state = MyAppointmentsUiState(
                appointments = listOf(
                    Appointment(
                        id = "1", shopId = "s1", barberId = "b1", serviceIds = listOf("1", "2"),
                        status = "scheduled", scheduledStart = tomorrow,
                        scheduledEnd = tomorrow.plusMinutes(65), notes = null
                    ),
                    Appointment(
                        id = "2", shopId = "s1", barberId = "b2", serviceIds = listOf("1"),
                        status = "rescheduled", scheduledStart = OffsetDateTime.now().plusHours(3),
                        scheduledEnd = OffsetDateTime.now().plusHours(4), notes = "Degradado bajo"
                    )
                ),
                shopNames = mapOf("s1" to "Mr. Barber Centro"),
                serviceNames = mapOf("1" to "Corte de cabello", "2" to "Arreglo de barba")
            ),
            onBack = {},
            onRetry = {},
            onEditClick = {},
            onCancelClick = {}
        )
    }
}
