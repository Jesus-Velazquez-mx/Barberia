package com.mrbarber.cliente.core.network

import com.mrbarber.cliente.core.common.AppException
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException

/**
 * Ejecuta una llamada a la API y traduce cualquier fallo a [AppException].
 */
suspend fun <T> safeApiCall(json: Json, call: suspend () -> ApiResponse<T>): Result<T> =
    runApiCall(json) {
        val response = call()
        response.data ?: throw AppException.Http(200, response.message ?: "Respuesta sin datos")
    }

/** Para endpoints que responden sin `data` (ej. DELETE). */
suspend fun safeApiCallNoData(json: Json, call: suspend () -> ApiResponse<*>): Result<Unit> =
    runApiCall(json) { call() }

private suspend fun <T> runApiCall(json: Json, block: suspend () -> T): Result<T> =
    try {
        Result.success(block())
    } catch (e: CancellationException) {
        throw e
    } catch (e: AppException) {
        Result.failure(e)
    } catch (e: HttpException) {
        val body = e.response()?.errorBody()?.string()
        val parsed = body?.let { runCatching { json.decodeFromString<ApiErrorBody>(it) }.getOrNull() }
        Result.failure(
            AppException.Http(
                code = e.code(),
                message = parsed?.message ?: e.message(),
                details = parsed?.error.orEmpty()
            )
        )
    } catch (e: IOException) {
        Result.failure(AppException.Network(e))
    } catch (e: Exception) {
        Result.failure(AppException.Unknown(e))
    }
