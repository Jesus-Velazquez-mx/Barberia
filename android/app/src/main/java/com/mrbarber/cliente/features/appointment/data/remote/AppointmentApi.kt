package com.mrbarber.cliente.features.appointment.data.remote

import com.mrbarber.cliente.core.network.ApiResponse
import com.mrbarber.cliente.features.appointment.data.remote.dto.AppointmentResponseDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.BarberAvailabilityDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.BarberDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.CreateAppointmentRequestDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.OfferedServiceDto
import com.mrbarber.cliente.features.appointment.data.remote.dto.ShopDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface AppointmentApi {
    @POST("api/appointments")
    suspend fun create(@Body body: CreateAppointmentRequestDto): ApiResponse<AppointmentResponseDto>

    @GET("api/shops")
    suspend fun getShops(): ApiResponse<List<ShopDto>>

    @GET("api/offeredServices")
    suspend fun getOfferedServices(): ApiResponse<List<OfferedServiceDto>>

    @GET("api/shops/{id}/barbers")
    suspend fun getBarbers(@Path("id") shopId: String): ApiResponse<List<BarberDto>>

    /** `date` en formato YYYY-MM-DD (fecha del negocio); `serviceIds` se envía repitiendo el parámetro. */
    @GET("api/shops/{id}/availability")
    suspend fun getAvailability(
        @Path("id") shopId: String,
        @Query("date") date: String,
        @Query("serviceIds") serviceIds: List<String>
    ): ApiResponse<List<BarberAvailabilityDto>>
}
