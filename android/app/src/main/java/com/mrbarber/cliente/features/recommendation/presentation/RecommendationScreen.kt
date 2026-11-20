package com.mrbarber.cliente.features.recommendation.presentation

import android.content.ActivityNotFoundException
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.SubcomposeAsyncImage
import com.mrbarber.cliente.features.recommendation.domain.model.Haircut
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationHistoryEntry
import com.mrbarber.cliente.features.recommendation.domain.model.RecommendationResult
import com.mrbarber.cliente.features.recommendation.domain.usecase.MAX_PREFERENCES_LENGTH
import com.mrbarber.cliente.ui.components.BackButton
import com.mrbarber.cliente.ui.components.LoadingButton
import com.mrbarber.cliente.ui.components.SectionCard
import com.mrbarber.cliente.ui.theme.Dorado
import com.mrbarber.cliente.ui.theme.GrisClaro
import com.mrbarber.cliente.ui.theme.GrisOscuro
import com.mrbarber.cliente.ui.theme.MrBarberTheme
import com.mrbarber.cliente.ui.theme.Negro
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Recomendación de corte con IA: el cliente elige o toma una foto de su rostro, escribe sus
 * preferencias (opcional) y recibe el corte sugerido. Abajo se muestra su historial.
 */
@Composable
fun RecommendationRoute(
    onBack: () -> Unit,
    onBookAppointmentClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: RecommendationViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    // Selector de fotos del sistema: no requiere permisos de almacenamiento.
    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { viewModel.onPhotoSelected(it.toString()) }
    }

    // La app de cámara escribe en un archivo nuestro; se recuerda su Uri por si Android recrea la pantalla.
    var pendingCameraUri by rememberSaveable { mutableStateOf<String?>(null) }
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { saved ->
        val uri = pendingCameraUri
        if (saved && uri != null) viewModel.onPhotoSelected(uri)
        pendingCameraUri = null
    }

    Recommendation(
        state = state,
        onBack = onBack,
        onGalleryClick = {
            galleryLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        },
        onCameraClick = {
            val uri = createCameraPhotoUri(context)
            pendingCameraUri = uri.toString()
            try {
                cameraLauncher.launch(uri)
            } catch (_: ActivityNotFoundException) {
                pendingCameraUri = null
                viewModel.onCameraUnavailable()
            }
        },
        onPreferencesChange = viewModel::onPreferencesChange,
        onGenerateClick = viewModel::onGenerateClick,
        onRetryHistoryClick = viewModel::loadHistory,
        onBookAppointmentClick = onBookAppointmentClick,
        onViewHaircutPhoto = viewModel::onViewHaircutPhoto,
        onDismissHaircutPhoto = viewModel::onDismissHaircutPhoto,
        modifier = modifier
    )
}

@Composable
fun Recommendation(
    state: RecommendationUiState,
    onBack: () -> Unit,
    onGalleryClick: () -> Unit,
    onCameraClick: () -> Unit,
    onPreferencesChange: (String) -> Unit,
    onGenerateClick: () -> Unit,
    onRetryHistoryClick: () -> Unit,
    onBookAppointmentClick: () -> Unit,
    modifier: Modifier = Modifier,
    onViewHaircutPhoto: (Haircut) -> Unit = {},
    onDismissHaircutPhoto: () -> Unit = {}
) {
    state.haircutPhoto?.let { HaircutPhotoDialog(photo = it, onDismiss = onDismissHaircutPhoto) }

    // Al llegar el resultado se desplaza hasta él: suele quedar debajo del botón, fuera de la pantalla.
    val resultRequester = remember { BringIntoViewRequester() }
    LaunchedEffect(state.result) {
        if (state.result != null) resultRequester.bringIntoView()
    }

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
                Text(
                    text = "RECOMIENDA MI CORTE",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Sube una foto de tu rostro y te sugeriremos el corte que mejor te queda.",
                    fontSize = 14.sp,
                    color = GrisClaro,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(Modifier.height(24.dp))

            SectionCard(title = "1. Tu foto") {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    PhotoPreview(photoUri = state.photoUri, hasPreviousPhoto = state.hasPreviousPhoto)
                }
                Text(
                    text = "De frente, con buena luz y sin lentes ni gorra.",
                    fontSize = 13.sp,
                    color = GrisClaro,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    GoldOutlinedButton(
                        text = "GALERÍA",
                        onClick = onGalleryClick,
                        enabled = !state.isGenerating,
                        modifier = Modifier.weight(1f)
                    )
                    GoldOutlinedButton(
                        text = "CÁMARA",
                        onClick = onCameraClick,
                        enabled = !state.isGenerating,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            SectionCard(title = "2. Tus preferencias (opcional)") {
                OutlinedTextField(
                    value = state.preferences,
                    onValueChange = onPreferencesChange,
                    enabled = !state.isGenerating,
                    placeholder = { Text("Ej. Algo corto y fácil de peinar") },
                    supportingText = {
                        Text(
                            text = "${state.preferences.length}/$MAX_PREFERENCES_LENGTH",
                            textAlign = TextAlign.End,
                            modifier = Modifier.fillMaxWidth()
                        )
                    },
                    minLines = 3,
                    maxLines = 6,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(Modifier.height(24.dp))

            state.error?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                Spacer(Modifier.height(12.dp))
            }

            LoadingButton(
                text = "OBTENER RECOMENDACIÓN",
                onClick = onGenerateClick,
                enabled = state.canGenerate,
                isLoading = state.isGenerating,
                modifier = Modifier.height(50.dp)
            )

            if (state.isGenerating) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Analizando tu rostro… puede tardar hasta un minuto.",
                    fontSize = 13.sp,
                    color = GrisClaro,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            } else if (state.photoUri == null && !state.hasPreviousPhoto) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Elige o toma una foto para continuar.",
                    fontSize = 13.sp,
                    color = GrisClaro,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            state.result?.let { result ->
                Spacer(Modifier.height(24.dp))
                Box(Modifier.bringIntoViewRequester(resultRequester)) {
                    when (result) {
                        is RecommendationResult.Recommended ->
                            RecommendedCard(
                                result = result,
                                haircutsWithPhoto = state.haircutsWithPhoto,
                                onViewPhotoClick = onViewHaircutPhoto,
                                onBookAppointmentClick = onBookAppointmentClick
                            )
                        is RecommendationResult.NoSuitableHaircut ->
                            NoSuitableHaircutCard(reason = result.reason, onBookAppointmentClick = onBookAppointmentClick)
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            HistorySection(
                history = state.history,
                isLoading = state.isHistoryLoading,
                error = state.historyError,
                onRetryClick = onRetryHistoryClick
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

private sealed interface Thumbnail {
    data object None : Thumbnail
    data object Loading : Thumbnail
    data object Failed : Thumbnail
    data class Loaded(val bitmap: ImageBitmap) : Thumbnail
}

@Composable
private fun PhotoPreview(photoUri: String?, hasPreviousPhoto: Boolean) {
    val context = LocalContext.current
    val thumbnail by produceState<Thumbnail>(Thumbnail.Loading, photoUri) {
        value = if (photoUri == null) {
            Thumbnail.None
        } else {
            withContext(Dispatchers.IO) { loadThumbnail(context, photoUri) }
                ?.let { Thumbnail.Loaded(it.asImageBitmap()) }
                ?: Thumbnail.Failed
        }
    }

    val shape = RoundedCornerShape(16.dp)
    Box(
        modifier = Modifier
            .size(180.dp)
            .clip(shape)
            .background(Negro)
            .border(1.dp, Dorado.copy(alpha = 0.5f), shape),
        contentAlignment = Alignment.Center
    ) {
        when (val current = thumbnail) {
            is Thumbnail.Loaded -> Image(
                bitmap = current.bitmap,
                contentDescription = "Tu foto",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Thumbnail.Loading -> CircularProgressIndicator(
                color = Dorado,
                strokeWidth = 2.dp,
                modifier = Modifier.size(24.dp)
            )
            Thumbnail.Failed -> PlaceholderText("No se pudo mostrar la foto")
            Thumbnail.None -> PlaceholderText(
                if (hasPreviousPhoto) "Usaremos tu foto anterior" else "Sin foto"
            )
        }
    }
}

@Composable
private fun PlaceholderText(text: String) {
    Text(
        text = text,
        color = GrisClaro,
        fontSize = 13.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(16.dp)
    )
}

@Composable
private fun RecommendedCard(
    result: RecommendationResult.Recommended,
    haircutsWithPhoto: Set<String>,
    onViewPhotoClick: (Haircut) -> Unit,
    onBookAppointmentClick: () -> Unit
) {
    SectionCard(title = "TU CORTE IDEAL") {
        result.haircuts.forEach { haircut ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        haircut.name,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Dorado,
                        modifier = Modifier.weight(1f)
                    )
                    if (haircut.id in haircutsWithPhoto) {
                        PillButton(text = "Ver corte", onClick = { onViewPhotoClick(haircut) })
                    }
                }
                haircut.description?.takeIf { it.isNotBlank() }?.let {
                    Text(it, fontSize = 14.sp, color = GrisClaro)
                }
            }
        }

        ConfidenceBar(percent = result.confidencePercent)

        if (result.suggestionText.isNotBlank()) {
            Text(result.suggestionText, fontSize = 15.sp)
        }

        if (result.reasoning.isNotBlank()) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("¿Por qué?", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(result.reasoning, fontSize = 14.sp, color = GrisClaro)
            }
        }

        LoadingButton(text = "AGENDAR CITA", onClick = onBookAppointmentClick)
    }
}

@Composable
private fun PillButton(text: String, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(percent = 50),
        color = Dorado.copy(alpha = 0.15f),
        border = BorderStroke(1.dp, Dorado)
    ) {
        Text(
            text = text,
            color = Dorado,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun HaircutPhotoDialog(photo: HaircutPhotoState, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Cerrar", color = Dorado, fontWeight = FontWeight.Bold) }
        },
        title = { Text(photo.haircutName, color = Dorado, fontWeight = FontWeight.Bold) },
        text = {
            when (photo) {
                is HaircutPhotoState.Loaded -> HaircutPhoto(url = photo.url, haircutName = photo.haircutName)
                is HaircutPhotoState.Loading -> Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxWidth().aspectRatio(4f / 3f)
                ) {
                    CircularProgressIndicator(color = Dorado, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                }
                is HaircutPhotoState.Failed -> Text(photo.message, color = GrisClaro)
            }
        }
    )
}

@Composable
private fun HaircutPhoto(url: String, haircutName: String) {
    val shape = RoundedCornerShape(16.dp)
    SubcomposeAsyncImage(
        model = url,
        contentDescription = "Foto del corte $haircutName",
        contentScale = ContentScale.Crop,
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(4f / 3f)
            .clip(shape)
            .background(Negro)
            .border(1.dp, Dorado.copy(alpha = 0.5f), shape),
        loading = {
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Dorado, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
            }
        },
        error = {
            Box(contentAlignment = Alignment.Center) { PlaceholderText("No se pudo mostrar la foto del corte") }
        }
    )
}

@Composable
private fun NoSuitableHaircutCard(reason: String, onBookAppointmentClick: () -> Unit) {
    SectionCard(title = "SIN CORTE IDEAL") {
        Text(
            text = "Ninguno de nuestros cortes encaja del todo con lo que buscas. " +
                "Platica con tu barbero en tu próxima cita para encontrar la mejor opción.",
            fontSize = 15.sp
        )
        if (reason.isNotBlank()) {
            Text(reason, fontSize = 14.sp, color = GrisClaro)
        }
        GoldOutlinedButton(text = "AGENDAR CITA", onClick = onBookAppointmentClick)
    }
}

@Composable
private fun ConfidenceBar(percent: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Coincidencia", fontSize = 13.sp, color = GrisClaro, modifier = Modifier.weight(1f))
            Text("$percent%", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Dorado)
        }
        LinearProgressIndicator(
            progress = { percent / 100f },
            color = Dorado,
            trackColor = Negro,
            drawStopIndicator = {},
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
        )
    }
}

@Composable
private fun HistorySection(
    history: List<RecommendationHistoryEntry>,
    isLoading: Boolean,
    error: String?,
    onRetryClick: () -> Unit
) {
    Text("HISTORIAL", fontSize = 18.sp, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(12.dp))

    when {
        isLoading && history.isEmpty() -> Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Dorado, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
        }
        error != null && history.isEmpty() -> Column {
            Text(error, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            TextButton(onClick = onRetryClick) {
                Text("Reintentar", color = Dorado)
            }
        }
        history.isEmpty() -> Text(
            text = "Aún no has pedido recomendaciones.",
            fontSize = 14.sp,
            color = GrisClaro
        )
        else -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            history.forEach { HistoryItem(it) }
        }
    }
}

@Composable
private fun HistoryItem(entry: RecommendationHistoryEntry) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = GrisOscuro)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(
                        text = if (entry.wasRecommended) entry.haircutName ?: "Corte recomendado" else "Sin corte ideal",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (entry.wasRecommended) Dorado else GrisClaro
                    )
                    entry.requestedAt?.let {
                        Text(formatHistoryDate(it), fontSize = 12.sp, color = GrisClaro)
                    }
                }
                entry.confidencePercent?.let {
                    Text("$it%", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Dorado)
                }
            }
            // Con recomendación se muestra la sugerencia; sin ella, el motivo.
            (if (entry.wasRecommended) entry.suggestionText else entry.reasoning)
                ?.takeIf { it.isNotBlank() }
                ?.let {
                    Text(it, fontSize = 13.sp, maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
        }
    }
}

@Composable
private fun GoldOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = Dorado),
        modifier = modifier.fillMaxWidth()
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}

private val HISTORY_DATE_FORMAT: DateTimeFormatter =
    DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.forLanguageTag("es-MX"))

private fun formatHistoryDate(instant: Instant): String =
    instant.atZone(ZoneId.systemDefault()).format(HISTORY_DATE_FORMAT)

private val previewHistory = listOf(
    RecommendationHistoryEntry(
        id = "1",
        wasRecommended = true,
        suggestionText = "Este estilo resalta tus pómulos y es fácil de mantener.",
        confidencePercent = 92,
        reasoning = null,
        haircutName = "Fade clásico",
        requestedAt = Instant.parse("2026-11-10T18:30:00Z")
    ),
    RecommendationHistoryEntry(
        id = "2",
        wasRecommended = false,
        suggestionText = null,
        confidencePercent = null,
        reasoning = "Buscas el cabello largo y los cortes disponibles son todos cortos.",
        haircutName = null,
        requestedAt = Instant.parse("2026-11-02T16:00:00Z")
    )
)

@Preview(showBackground = true, heightDp = 1400)
@Composable
fun RecommendationResultPreview() {
    MrBarberTheme {
        Recommendation(
            state = RecommendationUiState(
                preferences = "Algo corto y fácil de peinar",
                isHistoryLoading = false,
                history = previewHistory,
                result = RecommendationResult.Recommended(
                    haircuts = listOf(Haircut("1", "Fade clásico", "Degradado progresivo en los laterales.")),
                    suggestionText = "Este estilo se adapta a tus características.",
                    reasoning = "Tu rostro ovalado admite volumen arriba y laterales cortos.",
                    confidencePercent = 92
                )
            ),
            onBack = {},
            onGalleryClick = {},
            onCameraClick = {},
            onPreferencesChange = {},
            onGenerateClick = {},
            onRetryHistoryClick = {},
            onBookAppointmentClick = {}
        )
    }
}

@Preview(showBackground = true, heightDp = 1000)
@Composable
fun RecommendationEmptyPreview() {
    MrBarberTheme {
        Recommendation(
            state = RecommendationUiState(isHistoryLoading = false),
            onBack = {},
            onGalleryClick = {},
            onCameraClick = {},
            onPreferencesChange = {},
            onGenerateClick = {},
            onRetryHistoryClick = {},
            onBookAppointmentClick = {}
        )
    }
}
