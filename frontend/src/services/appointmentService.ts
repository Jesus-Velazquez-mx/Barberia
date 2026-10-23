import type { AppointmentRecord } from '../types/appointmentType';
import { mockListAppointments } from '../mocks/appointmentsMock';

/*
 * Servicio de citas para el personal (manager y recepcionista).
 * Hoy responde con datos mock. Para integrar con el backend solo cambia el cuerpo de esta función
 * (usando apiClient y el token); el contenedor y los componentes no se tocan:
 *
 *   getAppointments -> GET /appointments   (ya existe, PR #196)
 *
 * Lo que hay que resolver al integrar (el GET actual no lo cubre):
 *  - Rango de fechas: sin `from`/`to` el backend devuelve solo los próximos 30 días y el rango máximo
 *    es de 366 días. Para "últimos 60 días en adelante" hay que mandar `from` (hoy - 60 días) y `to`
 *    explícitos. Si el usuario filtra fuera de ese rango, volver a consultar con el rango nuevo.
 *  - Nombres: la respuesta trae solo ids (shopId, barberId, clientId, serviceId). Faltan el nombre y
 *    el correo del cliente, el nombre del barbero y de la sucursal y el nombre de cada servicio, que
 *    esta vista muestra y usa para buscar. Lo ideal es que el backend los incluya en la respuesta.
 *  - Estados: el enum del backend es scheduled | checked_in | completed | cancelled | no_show.
 *    No existe "reagendada" (ni los datos para mostrar la fecha original ni el motivo de cancelación).
 *  - Fecha de creación: viene como `createdAt`, pero no hay parámetro para filtrar por ella; hoy se
 *    filtra en el frontend. Lo mismo la búsqueda por nombre o correo del cliente.
 *  - Alcance por rol: lo resuelve el backend (recepción ve solo su sucursal; el manager, las que administra).
 *    Por eso el filtro de sucursal solo se muestra al manager.
 */

/* `role` solo lo usa el mock para simular el alcance; con el backend lo resuelve el token y se elimina. */
export const getAppointments = async (_token: string, role?: string): Promise<AppointmentRecord[]> =>
    mockListAppointments(role);
