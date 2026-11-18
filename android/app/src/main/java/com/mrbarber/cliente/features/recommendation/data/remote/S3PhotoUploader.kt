package com.mrbarber.cliente.features.recommendation.data.remote

import com.mrbarber.cliente.core.common.AppException
import com.mrbarber.cliente.features.recommendation.data.remote.dto.PresignedPostDto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import javax.inject.Inject
import javax.inject.Qualifier

/**
 * OkHttpClient para S3. Debe ser uno SIN AuthInterceptor: el formulario firmado ya autoriza la subida
 * y S3 rechaza la petición si además lleva `Authorization: Bearer`.
 */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class S3HttpClient

/** Sube la foto directo a S3 con el formulario firmado de `GET api/presigned-url`. */
class S3PhotoUploader @Inject constructor(
    @S3HttpClient private val client: OkHttpClient
) {
    suspend fun upload(presigned: PresignedPostDto, photo: ByteArray): Unit = withContext(Dispatchers.IO) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .apply {
                // 1. Todos los campos firmados, sin modificar.
                presigned.fields.forEach { (name, value) -> addFormDataPart(name, value) }
                // 2. La política exige un Content-Type que empiece con image/.
                if (CONTENT_TYPE_FIELD !in presigned.fields) {
                    addFormDataPart(CONTENT_TYPE_FIELD, JPEG_MIME)
                }
                // 3. El archivo siempre al final: S3 ignora los campos que vengan después.
                addFormDataPart(FILE_FIELD, FILE_NAME, photo.toRequestBody(JPEG_MIME.toMediaType()))
            }
            .build()

        try {
            val request = Request.Builder().url(presigned.url).post(body).build()
            client.newCall(request).execute().use { response ->
                // S3 responde 204 sin cuerpo. 403 = formulario vencido (120 s) o foto fuera de la política.
                if (!response.isSuccessful) {
                    throw AppException.Http(response.code, "No se pudo subir la foto")
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: AppException) {
            throw e
        } catch (e: IOException) {
            throw AppException.Network(e)
        } catch (e: Exception) {
            throw AppException.Unknown(e)
        }
    }

    private companion object {
        const val CONTENT_TYPE_FIELD = "Content-Type"
        const val FILE_FIELD = "file"
        const val FILE_NAME = "photo.jpg"
        const val JPEG_MIME = "image/jpeg"
    }
}
