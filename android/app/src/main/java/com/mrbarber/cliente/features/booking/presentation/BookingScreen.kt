package com.mrbarber.cliente.features.booking.presentation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mrbarber.cliente.ui.components.BackButton
import com.mrbarber.cliente.ui.components.InitialsAvatar
import com.mrbarber.cliente.ui.components.LoadingButton
import com.mrbarber.cliente.ui.components.SectionCard
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.ui.theme.Negro
import java.text.NumberFormat
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun Booking(
    state: BookingUiState,
    onBack: () -> Unit,
    onShopSelected: (Int) -> Unit,
    onServiceToggled: (Int) -> Unit,
    onBarberSelected: (Int) -> Unit,
    onDateSelected: (LocalDate) -> Unit,
    onTimeSelected: (LocalTime) -> Unit,
    onConfirmClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 8.dp),
        ) {
            BackButton(onClick = onBack, enabled = !state.isSubmitting)

            Spacer(Modifier.height(8.dp))

            Text(
                "AGENDAR CITA",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(24.dp))

            SectionCard(title = "1. Sucursal") {
                ShopDropdown(
                    shops = state.shops,
                    selectedShop = state.selectedShop,
                    enabled = !state.isSubmitting,
                    onShopSelected = onShopSelected
                )
            }

            Spacer(Modifier.height(16.dp))

            SectionCard(title = "2. Servicios") {
                state.services.forEach { service ->
                    ServiceRow(
                        service = service,
                        selected = service.id in state.selectedServiceIds,
                        enabled = !state.isSubmitting,
                        onToggle = { onServiceToggled(service.id) }
                    )
                }
                if (state.selectedServiceIds.isNotEmpty()) {
                    HorizontalDivider(color = GrisClaro.copy(alpha = 0.3f))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            "Total · ${state.totalDurationMinutes} min",
                            color = GrisClaro,
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            state.totalPrice.toCurrency(),
                            color = Dorado,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Barbero, día y horario solo se habilitan con sucursal y servicios elegidos.
            if (!state.canChooseSchedule) {
                LockedHint("Selecciona una sucursal y al menos un servicio para elegir barbero y horario.")
            }

            AnimatedVisibility(visible = state.canChooseSchedule) {
                Column {
                    SectionCard(title = "3. Barbero") {
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            state.barbers.forEach { barber ->
                                BarberItem(
                                    barber = barber,
                                    selected = barber.id == state.selectedBarberId,
                                    enabled = !state.isSubmitting,
                                    onClick = { onBarberSelected(barber.id) }
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    SectionCard(title = "4. Día y horario") {
                        Text("Día", fontSize = 14.sp, color = GrisClaro)
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            state.availableDates.forEach { date ->
                                DateItem(
                                    date = date,
                                    selected = date == state.selectedDate,
                                    enabled = !state.isSubmitting,
                                    onClick = { onDateSelected(date) }
                                )
                            }
                        }

                        Text("Horario", fontSize = 14.sp, color = GrisClaro)
                        TimeSlots(
                            state = state,
                            onTimeSelected = onTimeSelected
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    BookingSummary(state = state)

                    state.error?.let {
                        Spacer(Modifier.height(12.dp))
                        Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                    }

                    Spacer(Modifier.height(16.dp))

                    LoadingButton(
                        text = "CONFIRMAR CITA",
                        onClick = onConfirmClick,
                        enabled = state.canConfirm,
                        isLoading = state.isSubmitting
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShopDropdown(
    shops: List<ShopOption>,
    selectedShop: ShopOption?,
    enabled: Boolean,
    onShopSelected: (Int) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { if (enabled) expanded = it }
    ) {
        OutlinedTextField(
            value = selectedShop?.name.orEmpty(),
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text("Selecciona una sucursal") },
            supportingText = selectedShop?.let { { Text(it.address, color = GrisClaro) } },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable, enabled)
                .fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            shops.forEach { shop ->
                DropdownMenuItem(
                    text = {
                        Column {
                            Text(shop.name, fontWeight = FontWeight.Bold)
                            Text(shop.address, fontSize = 12.sp, color = GrisClaro)
                        }
                    },
                    onClick = {
                        expanded = false
                        onShopSelected(shop.id)
                    }
                )
            }
        }
    }
}

@Composable
private fun ServiceRow(
    service: ServiceOption,
    selected: Boolean,
    enabled: Boolean,
    onToggle: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .border(
                BorderStroke(1.dp, if (selected) Dorado else GrisClaro.copy(alpha = 0.3f)),
                RoundedCornerShape(8.dp)
            )
            .clickable(enabled = enabled, onClick = onToggle)
            .padding(horizontal = 4.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = selected,
            onCheckedChange = { onToggle() },
            enabled = enabled,
            colors = CheckboxDefaults.colors(checkedColor = Dorado, checkmarkColor = Negro)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(service.name, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("${service.durationMinutes} min", fontSize = 12.sp, color = GrisClaro)
        }
        Text(
            service.price.toCurrency(),
            color = Dorado,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(end = 12.dp)
        )
    }
}

@Composable
private fun BarberItem(
    barber: BarberOption,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(84.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        InitialsAvatar(
            name = barber.name,
            size = 60.dp,
            fontSize = 20.sp,
            containerColor = if (selected) Dorado else Negro,
            contentColor = if (selected) Negro else Dorado,
            borderColor = if (selected) Dorado else GrisClaro.copy(alpha = 0.4f)
        )
        Spacer(Modifier.height(6.dp))
        Text(
            barber.name,
            fontSize = 13.sp,
            color = if (selected) Dorado else Color.Unspecified,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
            textAlign = TextAlign.Center,
            maxLines = 2
        )
    }
}

@Composable
private fun DateItem(
    date: LocalDate,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(60.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) Dorado else Negro)
            .border(
                1.dp,
                if (selected) Dorado else GrisClaro.copy(alpha = 0.3f),
                RoundedCornerShape(12.dp)
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val contentColor = if (selected) Negro else GrisClaro
        Text(date.format(DAY_OF_WEEK_FORMAT).uppercase(), fontSize = 12.sp, color = contentColor)
        Text(
            date.dayOfMonth.toString(),
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = if (selected) Negro else Color.Unspecified
        )
        Text(date.format(MONTH_FORMAT).uppercase(), fontSize = 12.sp, color = contentColor)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TimeSlots(
    state: BookingUiState,
    onTimeSelected: (LocalTime) -> Unit
) {
    when {
        state.selectedBarberId == null || state.selectedDate == null ->
            Text(
                "Elige un barbero y un día para ver los horarios disponibles.",
                fontSize = 13.sp,
                color = GrisClaro
            )

        state.isLoadingSlots ->
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Dorado, modifier = Modifier.size(28.dp))
            }

        state.timeSlots.none { it.isAvailable } ->
            Text("No hay horarios disponibles para este día.", fontSize = 13.sp, color = GrisClaro)

        else ->
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                state.timeSlots.forEach { slot ->
                    FilterChip(
                        selected = slot.time == state.selectedTime,
                        onClick = { onTimeSelected(slot.time) },
                        enabled = slot.isAvailable && !state.isSubmitting,
                        label = { Text(slot.time.format(TIME_FORMAT)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Dorado,
                            selectedLabelColor = Negro
                        )
                    )
                }
            }
    }
}

@Composable
private fun BookingSummary(state: BookingUiState) {
    SectionCard(title = "Resumen") {
        SummaryRow("Sucursal", state.selectedShop?.name)
        SummaryRow("Servicios", state.selectedServices.joinToString { it.name }.ifEmpty { null })
        SummaryRow("Barbero", state.selectedBarber?.name)
        SummaryRow(
            "Fecha",
            state.selectedDate?.format(FULL_DATE_FORMAT)?.replaceFirstChar { it.uppercase() }
        )
        SummaryRow("Hora", state.selectedTime?.format(TIME_FORMAT))
        HorizontalDivider(color = GrisClaro.copy(alpha = 0.3f))
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Total", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text(state.totalPrice.toCurrency(), color = Dorado, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String?) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(label, fontSize = 14.sp, color = GrisClaro, modifier = Modifier.width(96.dp))
        Text(
            value ?: "—",
            fontSize = 14.sp,
            color = if (value == null) GrisClaro else Color.Unspecified,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun LockedHint(text: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = GrisOscuro.copy(alpha = 0.5f)),
        border = BorderStroke(1.dp, GrisClaro.copy(alpha = 0.2f))
    ) {
        Text(
            text,
            fontSize = 14.sp,
            color = GrisClaro,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        )
    }
}

private val LOCALE_MX: Locale = Locale.forLanguageTag("es-MX")

private fun Double.toCurrency(): String = NumberFormat.getCurrencyInstance(LOCALE_MX).format(this)

private val DAY_OF_WEEK_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE", LOCALE_MX)
private val MONTH_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM", LOCALE_MX)
private val FULL_DATE_FORMAT: DateTimeFormatter =
    DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", LOCALE_MX)
private val TIME_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a", LOCALE_MX)

@Preview(showBackground = true, heightDp = 1800)
@Composable
fun BookingPreview() {
    // Estado local solo para poder interactuar con el diseño en el modo interactivo del preview.
    var state by remember {
        mutableStateOf(
            BookingUiState(
                shops = listOf(
                    ShopOption(1, "Mr. Barber Centro", "Av. Juárez 123, Centro"),
                    ShopOption(2, "Mr. Barber Norte", "Blvd. Las Torres 456, Col. Norte")
                ),
                services = listOf(
                    ServiceOption(1, "Corte de cabello", 40, 180.0),
                    ServiceOption(2, "Arreglo de barba", 25, 120.0),
                    ServiceOption(3, "Afeitado clásico", 30, 150.0),
                    ServiceOption(4, "Lavado y peinado", 20, 90.0)
                ),
                barbers = listOf(
                    BarberOption(1, "Carlos Méndez"),
                    BarberOption(2, "Luis Ortega"),
                    BarberOption(3, "Miguel Ríos"),
                    BarberOption(4, "Andrés Pérez")
                ),
                availableDates = (0L..13L).map { LocalDate.now().plusDays(it) },
                timeSlots = (10..19).flatMap { hour ->
                    listOf(
                        TimeSlotOption(LocalTime.of(hour, 0), isAvailable = hour % 3 != 0),
                        TimeSlotOption(LocalTime.of(hour, 30), isAvailable = hour % 4 != 1)
                    )
                }
            )
        )
    }

    MrBarberTheme {
        Booking(
            state = state,
            onBack = {},
            onShopSelected = { state = state.copy(selectedShopId = it) },
            onServiceToggled = { id ->
                val ids = state.selectedServiceIds
                state = state.copy(selectedServiceIds = if (id in ids) ids - id else ids + id)
            },
            onBarberSelected = { state = state.copy(selectedBarberId = it, selectedTime = null) },
            onDateSelected = { state = state.copy(selectedDate = it, selectedTime = null) },
            onTimeSelected = { state = state.copy(selectedTime = it) },
            onConfirmClick = {}
        )
    }
}
