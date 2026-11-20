package com.mrbarber.cliente.features.recommendation.data.local

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import com.mrbarber.cliente.core.common.AppException
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream
import javax.inject.Inject
import kotlin.math.max

/**
 * Prepara la foto del rostro para subirla: la reduce a [MAX_SIDE_PX] en su lado más largo,
 * la endereza según su EXIF (las fotos de cámara suelen venir rotadas) y la codifica en JPEG.
 * La IA de todos modos reduce la imagen a 1024 px, así que no se pierde calidad útil.
 */
class PhotoCompressor @Inject constructor(
    @ApplicationContext private val context: Context
) {
    /** @param photoUri un `content://` o `file://`. Lanza [AppException.Validation] si no se puede leer. */
    suspend fun compress(photoUri: String): ByteArray = withContext(Dispatchers.IO) {
        try {
            val uri = Uri.parse(photoUri)

            // 1. Solo dimensiones, sin cargar la imagen en memoria.
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            open(uri).use { BitmapFactory.decodeStream(it, null, bounds) }
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw unreadable()

            // 2. Decodifica ya submuestreada (potencia de 2) para no reventar la memoria con fotos de 12+ MP.
            val options = BitmapFactory.Options().apply {
                inSampleSize = sampleSizeFor(bounds.outWidth, bounds.outHeight)
            }
            val decoded = open(uri).use { BitmapFactory.decodeStream(it, null, options) } ?: throw unreadable()

            // 3. Escala exacta + rotación EXIF en una sola transformación.
            val rotation = runCatching { open(uri).use(::readRotationDegrees) }.getOrDefault(0)
            val prepared = scaleAndRotate(decoded, rotation)

            // 4. JPEG.
            val bytes = ByteArrayOutputStream().use { out ->
                prepared.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, out)
                out.toByteArray()
            }
            prepared.recycle()

            if (bytes.size > MAX_UPLOAD_BYTES) {
                throw AppException.Validation("La foto es demasiado grande")
            }
            bytes
        } catch (e: CancellationException) {
            throw e
        } catch (e: AppException) {
            throw e
        } catch (e: Exception) {
            // FileNotFoundException, SecurityException (permiso del Uri revocado), etc.
            throw unreadable()
        }
    }

    private fun open(uri: Uri): InputStream =
        context.contentResolver.openInputStream(uri) ?: throw unreadable()

    private fun sampleSizeFor(width: Int, height: Int): Int {
        var sample = 1
        // Se detiene en el último tamaño que sigue siendo >= MAX_SIDE_PX; el resto lo ajusta scaleAndRotate.
        while (max(width, height) / (sample * 2) >= MAX_SIDE_PX) {
            sample *= 2
        }
        return sample
    }

    private fun readRotationDegrees(stream: InputStream): Int =
        when (ExifInterface(stream).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
            ExifInterface.ORIENTATION_ROTATE_90 -> 90
            ExifInterface.ORIENTATION_ROTATE_180 -> 180
            ExifInterface.ORIENTATION_ROTATE_270 -> 270
            else -> 0
        }

    private fun scaleAndRotate(source: Bitmap, rotationDegrees: Int): Bitmap {
        val scale = (MAX_SIDE_PX.toFloat() / max(source.width, source.height)).coerceAtMost(1f)
        if (scale == 1f && rotationDegrees == 0) return source

        val matrix = Matrix().apply {
            postScale(scale, scale)
            if (rotationDegrees != 0) postRotate(rotationDegrees.toFloat())
        }
        val result = Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
        if (result !== source) source.recycle()
        return result
    }

    private fun unreadable() = AppException.Validation("No se pudo leer la foto. Elige otra imagen.")

    private companion object {
        const val MAX_SIDE_PX = 1024
        const val JPEG_QUALITY = 85
        /** Límite de la política del formulario firmado de S3. */
        const val MAX_UPLOAD_BYTES = 5 * 1024 * 1024
    }
}
