# Problemas detectados

Problemas encontrados al revisar el código durante la redacción del [manual de usuario](./manual_usuario.md). Se identificaron mediante **análisis del código**; no se han reproducido en la aplicación en ejecución.

## Resumen

| ID | Funcionalidad | Problema |
|---|---|---|
| [ISS-01](#iss-01-mensajes-de-error-del-servidor-en-inglés) | Edición, reprogramación, cancelación y registro de citas | Los mensajes de error del servidor se muestran en inglés. |
| [ISS-02](#iss-02-el-horario-actual-se-ofrece-aunque-la-nueva-duración-no-quepa) | Edición y reprogramación de citas | El horario actual se ofrece aunque la nueva duración no quepa. |
| [ISS-03](#iss-03-los-horarios-no-se-actualizan-tras-un-conflicto) | Edición y reprogramación de citas | Los horarios no se actualizan tras un conflicto al guardar. |
| [ISS-04](#iss-04-un-barbero-que-ya-no-acepta-citas-bloquea-cualquier-edición) | Edición y reprogramación de citas | Un barbero que ya no acepta citas bloquea cualquier edición, incluso de notas. |
| [ISS-05](#iss-05-un-servicio-inactivo-impide-consultar-horarios) | Edición y reprogramación de citas | Un servicio inactivo en la cita impide consultar horarios. |
| [ISS-06](#iss-06-la-disponibilidad-y-la-cita-usan-duraciones-distintas) | Edición y reprogramación de citas (disponibilidad) | La disponibilidad y la cita pueden usar duraciones distintas. |
| [ISS-07](#iss-07-no-se-muestra-confirmación-después-de-guardar) | Edición, reprogramación y cancelación de citas | No se muestra confirmación después de guardar o cancelar. |
| [ISS-08](#iss-08-el-motivo-de-cancelación-no-se-muestra) | Cancelación de citas (seguimiento) | **Resuelto.** El motivo de cancelación no se mostraba a ningún perfil. |
| [ISS-09](#iss-09-el-listado-del-personal-puede-mostrar-estados-desactualizados) | Check-in y consulta de citas (personal) | El listado puede mostrar estados desactualizados, incluso después de un error de check-in. |
| [ISS-10](#iss-10-un-servicio-sin-cita-puede-reprogramarse-a-otro-día) | Servicios sin cita (edición) | Un servicio sin cita puede reprogramarse a otro día y conserva el check-in automático. |
| [ISS-11](#iss-11-la-selección-de-barbero-se-reemplaza-al-recalcular-los-horarios) | Registro de servicios sin cita | Al recalcular los horarios, la selección de barbero puede cambiar. |

---

## ISS-01. Mensajes de error del servidor en inglés

**Funcionalidad:** Edición, reprogramación, cancelación y registro de citas (incluidos los servicios sin cita).

**Descripción:** Cuando falla el guardado, la ventana *Editar cita* muestra directamente el mensaje del servidor, que está en inglés (por ejemplo, *Selected time slot is no longer available*). El resto de la interfaz está en español. Si no hay conexión, se muestra *Network error — could not reach the API*. El mensaje en español previsto, *No se pudo guardar la cita.*, solo se usa cuando no hay un mensaje del servidor o de la API. La ventana *Cancelar cita* se comporta igual (por ejemplo, *Only future appointments can be cancelled*; su mensaje previsto es *No se pudo cancelar la cita.*).

En la página de agendado y de servicios sin cita ocurre lo mismo con las respuestas que no tienen una traducción específica (el conflicto de horario sí se muestra en español), incluida la falta de conexión.

**Código relacionado:** `frontend/src/utils/apiErrorUtils.ts` (`getApiErrorMessage`), `frontend/src/containers/AppointmentActionsContainer.tsx`, `frontend/src/containers/BookAppointmentContainer.tsx` (`formatApiError`), `frontend/src/services/apiClient.ts`.

## ISS-02. El horario actual se ofrece aunque la nueva duración no quepa

**Funcionalidad:** Edición y reprogramación de citas.

**Descripción:** Si se agregan servicios sin cambiar la fecha ni el barbero, la ventana conserva el horario actual como opción válida aunque la consulta de disponibilidad no lo incluya. El usuario ve **Horario actual** y solo al guardar se entera de que la nueva duración no cabe, ya sea porque se traslapa con otra cita o porque excede el turno del barbero.

Conservar el horario actual es intencional para los casos en que ya no coincide con los intervalos de 15 minutos, pero no se distingue de los casos en que la nueva duración no cabe.

**Código relacionado:** `frontend/src/components/appointments/EditAppointmentModalComponent.tsx` (`slotOptions`, `keepsOriginal`).

## ISS-03. Los horarios no se actualizan tras un conflicto

**Funcionalidad:** Edición y reprogramación de citas.

**Descripción:** Si al guardar el servidor responde que el horario ya no está disponible, la ventana muestra el error, pero no vuelve a consultar la disponibilidad. La lista sigue mostrando la información anterior. La consulta solo se repite al cambiar la fecha o los servicios, o al cerrar y abrir de nuevo la ventana. El flujo de agendado, en cambio, sí actualiza los horarios ante este conflicto.

**Código relacionado:** `frontend/src/components/appointments/EditAppointmentModalComponent.tsx` (efecto que llama a `loadSlots` y `handleSubmit`).

## ISS-04. Un barbero que ya no acepta citas bloquea cualquier edición

**Funcionalidad:** Edición y reprogramación de citas.

**Descripción:** Si el barbero asignado a una cita dejó de aceptar reservas, la ventana lo conserva como opción seleccionada, pero el servidor rechaza cualquier cambio que lo mantenga, incluso si solo se modifican las notas (*Barber not found or is not accepting bookings*). Para guardar, es necesario reasignar la cita a otro barbero con un horario disponible.

**Código relacionado:** `backend/src/repositories/appointmentRepository.ts` (`updateAppointmentWithServices`), `frontend/src/containers/AppointmentActionsContainer.tsx`.

## ISS-05. Un servicio inactivo impide consultar horarios

**Funcionalidad:** Edición y reprogramación de citas.

**Descripción:** Si una cita incluye un servicio que fue desactivado después de agendarla, la consulta de disponibilidad falla mientras ese servicio siga en la cita. La ventana muestra *No se pudieron cargar los horarios. Intenta con otra fecha.*, un mensaje que no indica la causa real y sugiere una solución que no funciona. Como consecuencia:

- No se puede cambiar la fecha, la hora ni el barbero sin quitar el servicio.
- Si se modifica la lista de servicios conservando el servicio inactivo, el servidor rechaza el guardado (*Service not found or is inactive*).
- Sí es posible modificar únicamente las notas.

Esto contrasta con la regla de que los servicios ya agendados conservan su precio y duración originales.

**Código relacionado:** `backend/src/services/availabilityService.ts` (`getBookableServices`, `getAvailableSlots`), `backend/src/services/appointmentService.ts` (`updateAppointment`).

## ISS-06. La disponibilidad y la cita usan duraciones distintas

**Funcionalidad:** Edición y reprogramación de citas (cálculo de disponibilidad).

**Descripción:** Al editar una cita, los horarios disponibles se calculan con la duración **actual** de los servicios en el catálogo. La hora de término de la cita se calcula con la duración **registrada al agendar** para los servicios que se conservan. Si el gerente cambia la duración de un servicio después de agendar la cita:

- Si la duración **aumentó**, pueden ocultarse horarios en los que la cita sí cabría.
- Si la duración **disminuyó**, pueden ofrecerse horarios en los que la cita no cabe. Al cambiar la fecha, la hora o el barbero, el servidor valida el inicio con la duración actual (más corta). La comprobación de traslapes sí rechaza un choque con otra cita, pero en este flujo no se comprueba por separado que la hora de término real quede dentro del turno del barbero.

**Código relacionado:** `backend/src/services/availabilityService.ts` (`getAvailableSlots`), `backend/src/services/appointmentService.ts` (`updateAppointment`).

## ISS-07. No se muestra confirmación después de guardar

**Funcionalidad:** Edición, reprogramación y cancelación de citas.

**Descripción:** Al guardar correctamente, la ventana *Editar cita* solo se cierra, sin ningún aviso. Lo mismo ocurre con la ventana *Cancelar cita* después de cancelar. En cambio, otras acciones como el agendado y el check-in sí muestran una confirmación. En la vista del personal, además, la cita puede desaparecer del listado si la nueva fecha queda fuera del periodo o de los filtros activos, lo que puede hacer pensar que el cambio falló o que la cita se eliminó.

**Código relacionado:** `frontend/src/containers/AppointmentActionsContainer.tsx`, `frontend/src/containers/StaffAppointmentsContainer.tsx`, `frontend/src/containers/ClientAppointmentDetailContainer.tsx`.

## ISS-08. El motivo de cancelación no se muestra

**Funcionalidad:** Cancelación de citas (seguimiento de la cita).

**Estado:** Resuelto en el código (ver *Corrección aplicada*).

**Descripción:** El servidor envía el motivo de cancelación en el campo `cancelationReason` (con una sola «l»), pero la interfaz web lee `cancellationReason`. Como la respuesta para el personal se construye a partir de la del cliente, afecta a todos los perfiles: el evento **Cita cancelada** del seguimiento aparece sin el motivo, aunque se haya capturado. El motivo se envía a la base de datos y se guarda en `appointments.cancellation_reason`; el fallo está en la respuesta de la API.

Esto contradecía el apartado 4.2.3 del manual de usuario, que indica que el seguimiento muestra el motivo.

**Corrección aplicada:** Se renombró el campo a `cancellationReason` en el DTO y en el mapeador del servidor. No se encontraron otras apariciones del nombre incorrecto en el código. Se agregó a `backend/tests/appointmentCancel.test.ts` una comprobación del campo en la respuesta, y las pruebas de cancelación pasan. No se ha verificado visualmente en la aplicación web.

**Código relacionado:** `backend/src/utils/appointmentMapper.ts`, `backend/src/types/dto/appointmentResponse.interface.ts`, `frontend/src/services/appointmentService.ts`, `frontend/src/components/appointments/AppointmentTimelineComponent.tsx`.

## ISS-09. El listado del personal puede mostrar estados desactualizados

**Funcionalidad:** Check-in y consulta de citas (personal).

**Descripción:** El listado no vuelve a consultar las citas de forma periódica. Cada 30 segundos solo se actualiza la hora local que decide qué acciones mostrar. Por ello, los cambios automáticos (*Ausencia*, *Completada* y check-in de walk-ins) y los realizados por otras personas no se ven hasta que se vuelve a consultar el listado, por ejemplo, al actualizar la página o cambiar un filtro que se resuelve en el servidor.

Además, cuando un check-in falla, el listado no se vuelve a consultar. Aunque el mensaje indique que el estado de la cita cambió, la fila o la ventana de detalle siguen mostrando el estado anterior.

**Código relacionado:** `frontend/src/containers/StaffAppointmentsContainer.tsx` (`loadAppointments`, `handleCheckIn`).

## ISS-10. Un servicio sin cita puede reprogramarse a otro día

**Funcionalidad:** Servicios sin cita (edición y reprogramación).

**Descripción:** Al crear un servicio sin cita, el servidor exige que sea del día actual. Al editarlo antes de su hora de inicio, no se aplica esa restricción: puede moverse a otra fecha dentro de la ventana de reprogramación. La cita conserva `is_walk_in = true`, por lo que:

- Al llegar la nueva hora, recibe el check-in automático aunque el cliente no se encuentre en la barbería.
- Nunca pasa a *Ausencia*.
- Pasa a *Completada* y, si es de un cliente registrado, cuenta para el programa de fidelidad.
- No genera recordatorios.

Las reglas de negocio indican que solo hay servicios sin cita del día actual, aunque también que pueden editarse con las reglas existentes mientras no comiencen.

> **Nota — comportamiento esperado:** al editar un servicio sin cita, la modificación de la **fecha y la hora** debería estar **bloqueada**.
>
> El manual de usuario (apartados 4.2.2, 4.2.3, 5.2.4 y 5.2.7) **ya describe el comportamiento esperado**, aunque todavía no está implementado.

**Código relacionado:** `backend/src/services/appointmentService.ts` (`registerAppointment`, `updateAppointment`), `frontend/src/components/appointments/EditAppointmentModalComponent.tsx`.

## ISS-11. La selección de barbero se reemplaza al recalcular los horarios

**Funcionalidad:** Registro de servicios sin cita.

**Descripción:** La lista de próximos horarios no se actualiza con el paso del tiempo. Si la hora seleccionada pasa mientras se capturan los datos, o alguien más ocupa el horario, el registro se rechaza con *El horario seleccionado se ocupó mientras tanto*, incluso si la causa fue solo que la hora pasó. Al recalcular, se preselecciona la primera opción de la lista, aunque el cliente hubiera elegido otro barbero. El botón queda habilitado, por lo que se puede registrar el servicio con un barbero distinto sin advertirlo. Lo mismo ocurre al cambiar los servicios.

**Código relacionado:** `frontend/src/containers/BookAppointmentContainer.tsx` (efecto de `getNextAvailability` y `handleBook`).
