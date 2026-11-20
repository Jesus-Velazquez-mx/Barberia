package com.mrbarber.cliente.features.recommendation.presentation

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import java.io.File
import kotlin.math.max

private const val CAMERA_DIR = "camera_photos"

/**
 * Devuelve un Uri compartible de un archivo nuevo en caché para que la app de cámara guarde ahí la foto.
 * No borra las fotos anteriores: si el usuario cancela la cámara, la foto que ya tenía elegida debe
 * seguir existiendo. La limpieza la hace [deleteOtherCameraPhotos] cuando la captura sale bien.
 * El authority debe coincidir con el `<provider>` del AndroidManifest.
 */
fun createCameraPhotoUri(context: Context): Uri {
    val dir = File(context.cacheDir, CAMERA_DIR).apply { mkdirs() }
    // Nombre único: si se repitiera, la vista previa no se refrescaría al tomar otra foto.
    val file = File(dir, "face_${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
}

/** Borra las fotos de cámara anteriores (y las vacías de capturas canceladas); conserva solo [keepUri]. */
fun deleteOtherCameraPhotos(context: Context, keepUri: String) {
    val keepName = Uri.parse(keepUri).lastPathSegment ?: return
    File(context.cacheDir, CAMERA_DIR).listFiles()
        ?.filter { it.name != keepName }
        ?.forEach { it.delete() }
}

/** Miniatura para la vista previa (no la que se sube). Devuelve null si no se puede leer. */
fun loadThumbnail(context: Context, uri: String, maxSidePx: Int = 600): Bitmap? = runCatching {
    val parsed = Uri.parse(uri)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // ImageDecoder ya aplica la rotación EXIF.
        ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, parsed)) { decoder, info, _ ->
            val scale = maxSidePx.toFloat() / max(info.size.width, info.size.height)
            if (scale < 1f) {
                decoder.setTargetSize((info.size.width * scale).toInt(), (info.size.height * scale).toInt())
            }
        }
    } else {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSidePx) sample *= 2
        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it, null, options) }
    }
}.getOrNull()
