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
| [ISS-12](#iss-12-el-evento-cita-reagendada-desaparece-del-seguimiento) | Seguimiento de la cita (todos los perfiles) | El evento **Cita reagendada** desaparece cuando la cita pasa a otro estado. |
| [ISS-13](#iss-13-el-clasificador-de-rostros-siempre-arroja-un-resultado) | Recomendación de cortes (análisis de la foto) | El clasificador de rostros siempre arroja un resultado, aunque la foto no muestre un rostro. |
| [ISS-14](#iss-14-la-cuenta-puede-eliminarse-con-citas-pendientes-o-en-curso) | Mi perfil (eliminación de cuenta) | El cliente puede eliminar su cuenta aunque tenga citas pendientes o en curso. |
| [ISS-15](#iss-15-la-sesión-se-pierde-al-recargar-después-de-actualizar-los-datos) | Mi perfil (actualización de datos) | Después de actualizar los datos, recargar la página cierra la sesión. |
| [ISS-16](#iss-16-la-fotografía-del-cliente-no-se-elimina-al-borrar-su-cuenta) | Mi perfil (eliminación de cuenta) y recomendación de cortes | La fotografía del cliente no se elimina cuando este borra su cuenta. |

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

## ISS-12. El evento «Cita reagendada» desaparece del seguimiento

**Funcionalidad:** Seguimiento de la cita (cliente y personal).

**Descripción:** La línea de tiempo solo muestra el evento **Cita reagendada** mientras la cita está en estado *Reagendada*. Cuando pasa a *Iniciada*, *Completada*, *Cancelada* o *Ausencia*, el evento desaparece y el seguimiento ya no indica que la cita se reprogramó.

**Verificación:** A diferencia de los problemas anteriores revisados solo en el código, este se comprobó ejecutando de forma aislada el componente de la línea de tiempo con datos de prueba (sin backend ni base de datos). No se ha reproducido en la aplicación completa.

| Estado de la cita de prueba | Eventos mostrados |
|---|---|
| *Reagendada* | Cita agendada → Cita reagendada |
| *Iniciada* | Cita agendada → Check-in registrado |
| *Completada* | Cita agendada → Check-in registrado → Cita completada |
| *Cancelada* | Cita agendada → Cita cancelada |
| *Ausencia* | Cita agendada → Cliente ausente |

**Causa:** `buildTimeline` agrega el evento solo si `status === 'rescheduled'`.

**Consideraciones para la corrección:** Quitar esa condición en la interfaz web no es suficiente, porque no se guarda un dato específico de la reprogramación:

- **Cambio solo de barbero:** también deja la cita como *Reagendada*, pero la fecha original y la vigente coinciden. Cuando el estado cambia, comparar ambas fechas no permite detectar la reprogramación.
- **Fecha y hora del evento:** se toman de `updated_at`, que se sobrescribe con cada modificación de la cita. Después de un cambio de estado ya no corresponde a la reprogramación. Incluso mientras la cita está *Reagendada*, editar solo las notas cambia la fecha que muestra el evento.

**Corrección propuesta (no aplicada):**

1. Agregar a `appointments` una columna `rescheduled_at`, que se actualice solo cuando cambie la fecha, la hora o el barbero.
2. Incluirla en la respuesta de la API como `rescheduledAt`.
3. Mostrar el evento siempre que ese campo tenga valor y usarlo como su fecha y hora.

El proyecto no cuenta con una herramienta de migraciones. Además de modificar `init_database.sql`, habría que agregar la columna en las bases de datos existentes **antes** de desplegar el backend que la use. En las citas ya reprogramadas no se conserva la fecha en que se hizo el cambio, y las que solo cambiaron de barbero y ya no están *Reagendadas* no pueden identificarse con los datos de la cita.

> **Nota — comportamiento esperado:** el evento **Cita reagendada** debería mostrarse **siempre** que se haya cambiado la fecha, la hora o el barbero, aunque la cita pase a otro estado, con la fecha y hora del último de esos cambios.
>
> El manual de usuario (apartados 4.2.3 y 5.2.8) **ya describe el comportamiento esperado**, aunque todavía no está implementado.

**Código relacionado:** `frontend/src/components/appointments/AppointmentTimelineComponent.tsx` (`buildTimeline`), `backend/src/services/appointmentService.ts` (`updateAppointment`), `backend/src/repositories/appointmentRepository.ts` (`updateAppointmentWithServices`), `backend/database/init_database.sql` (tabla `appointments`).

## ISS-13. El clasificador de rostros siempre arroja un resultado

**Funcionalidad:** Recomendación de cortes (análisis de la foto).

**Descripción:** El clasificador de la estructura facial no comprueba que la foto muestre un rostro. Para cualquier imagen válida que reciba, elige una de las formas que reconoce el modelo: la de mayor puntuación, sin exigir un nivel mínimo de confianza ni contemplar una respuesta de «sin rostro». Por ejemplo, la foto de un objeto o de un paisaje también recibiría una forma de rostro.

**Consecuencias:**

- El resultado se guarda en la cuenta del cliente (`clients.facial_structure_type`) **antes** de solicitar la recomendación.
- La recomendación utiliza ese dato para seleccionar los cortes candidatos, y las instrucciones que recibe el modelo de recomendación indican que lo trate como un hecho.
- El segundo paso del análisis tiene instrucciones para rechazar fotos que no muestren el rostro y el cabello. Sin embargo, ese rechazo no borra la forma ya guardada.
- Si el cliente reutiliza la misma foto, no se vuelve a clasificar: se usa el dato guardado. Este se descarta cuando el cliente solicita una nueva subida de foto.

**Código relacionado:** `ai_service/app/services/face_classifier.py` (`classify_image_bytes`), `ai_service/app/api/face.py` (`detect_structure`), `backend/src/services/aiService.ts` (`requestRecommendation`), `ai_service/app/services/recommend_haircut.py` (`_build_haircut_prompt`), `backend/src/services/bucketService.ts` (`generatePresignedURL`).

## ISS-14. La cuenta puede eliminarse con citas pendientes o en curso

**Funcionalidad:** Mi perfil (eliminación de cuenta del cliente).

**Descripción:** Desde **Mi Perfil**, el cliente puede eliminar su cuenta aunque tenga citas pendientes (*Agendadas* o *Reagendadas*) o en curso (*Iniciadas*). La interfaz web usa `DELETE /api/users/:id`, que no comprueba las citas del cliente, por lo que no impide la operación ni explica ningún motivo. Esto incumple la regla documentada en `docs/epic-appointment-status-business-rules.md`: las citas en esos estados bloquean el borrado de clientes.

**Consecuencias:**

- La cuenta se elimina y las citas conservan su estado; solo pierden la liga con ella (`client_id` queda en `NULL`).
- Las que están *Agendadas* o *Reagendadas* siguen ocupando el horario del barbero mientras mantengan ese estado.
- En la vista del personal, la interfaz web las mostraría como de un **Visitante**, con el nombre **Cliente** y **Sin correo**, por lo que no se puede identificar ni contactar desde ahí a quien las agendó.

**Verificación:** El comportamiento del servidor se comprobó ejecutando ambas rutas contra una base de datos temporal; en cada caso, un cliente intentó eliminar su propia cuenta. No se probó en las pantallas de la aplicación; lo que muestra la vista del personal se identificó mediante análisis del código.

| Estado de la cita | `DELETE /api/users/:id` | `DELETE /api/clients/:id` |
|---|---|---|
| *Agendada*, *Reagendada* o *Iniciada* | Elimina la cuenta (200) | Rechaza la operación (409, *Cannot delete a client with pending appointments*) |
| *Completada* o *Cancelada* | Elimina la cuenta (200) | Elimina la cuenta (200) |

> **Nota — comportamiento esperado:** el cliente **no debe poder eliminar su cuenta** si tiene citas pendientes o en curso. Al intentarlo, debe mostrarse un mensaje que explique **por qué no se puede realizar la operación**. Las citas no se cancelan automáticamente.
>
> El apartado 5.5 del manual de usuario **ya describe el comportamiento esperado**, aunque todavía no está implementado.

**Solución:** La corrección comprende **únicamente la migración de los endpoints** de perfil a `/api/clients/:id`, tanto en la web como en Android. **No incluye la eliminación de `/api/users`.**

| Cliente | Operaciones a migrar |
|---|---|
| Web (dashboard de **Mi Perfil**) | Actualización de datos, cambio de contraseña y eliminación de la cuenta. |
| Android (perfil) | Actualización de datos y eliminación de la cuenta. La migración de Android es **necesaria**. |

- `PUT /api/users` se sustituye por `PUT /api/clients/:id`.
- `DELETE /api/users/:id` se sustituye por `DELETE /api/clients/:id`, que ya rechaza la eliminación en los tres estados indicados. La pantalla **Clientes** del personal ya utiliza esta ruta para eliminar.

**Consideraciones para la migración:**

- **Mensaje:** el servidor responde en inglés. La interfaz web y la aplicación de Android deben mostrar un mensaje en español que explique el motivo. Android no define un texto propio para la respuesta 409.
- **Formato de la actualización:** `PUT /api/clients/:id` admite los campos que se editan en el perfil. A diferencia de `PUT /api/users`, no usa el objeto `user` que envuelve los datos; la web y Android deben ajustar el cuerpo de la solicitud.
- **Respuesta de la actualización:** no incluye el campo `profile`, por lo que la web debe convertirla antes de guardar el usuario, como ya hace al consultar el perfil. De lo contrario, persistiría [ISS-15](#iss-15-la-sesión-se-pierde-al-recargar-después-de-actualizar-los-datos). Según el código, Android ignora los campos adicionales de la respuesta; la compatibilidad no se ha probado.
- **Limitación conocida:** mientras `DELETE /api/users/:id` conserve su comportamiento actual, seguirá permitiendo eliminar clientes sin la comprobación mediante solicitudes directas del propio cliente o de un gerente (según el código), y desde versiones de la aplicación de Android que no se hayan actualizado.

**Código relacionado:** `frontend/src/containers/DeleteAccountModalContainer.tsx`, `frontend/src/containers/EditUserModalContainer.tsx`, `frontend/src/containers/ChangePasswordModalContainer.tsx`, `frontend/src/services/userService.ts`, `frontend/src/services/clientService.ts`, `frontend/src/services/appointmentService.ts` (`resolveClient`), `backend/src/services/userService.ts` (`deleteUserById`), `backend/src/services/clientService.ts` (`updateClient`, `deleteClient`), `backend/src/repositories/appointmentRepository.ts` (`hasPendingAppointmentsByClientId`), `android/app/src/main/java/com/mrbarber/cliente/features/perfil/data/remote/UserApi.kt`, `android/app/src/main/java/com/mrbarber/cliente/features/perfil/data/remote/dto/UpdateUserRequestDto.kt`, `android/app/src/main/java/com/mrbarber/cliente/features/perfil/data/repository/ProfileRepositoryImpl.kt`, `android/app/src/main/java/com/mrbarber/cliente/core/common/ErrorMessages.kt`.

## ISS-15. La sesión se pierde al recargar después de actualizar los datos

**Funcionalidad:** Mi perfil (actualización de datos del cliente).

**Descripción:** Después de guardar cambios en la ventana *Editar usuario*, si el cliente recarga la página, la aplicación descarta la sesión y le pide iniciar sesión de nuevo, aunque la sesión no haya expirado.

**Causa:** La respuesta de `PUT /api/users` no incluye el campo `profile`. La interfaz web reemplaza con esa respuesta el usuario guardado en el navegador. Al recargar, la validación de la sesión exige `profile`; como falta, considera inválido el usuario guardado y borra la sesión.

El problema no se presenta si, antes de recargar, la pantalla **Mi perfil** vuelve a consultar los datos correctamente, lo que ocurre al salir de ella y entrar de nuevo. El cambio de contraseña no tiene este problema, porque no reemplaza el usuario guardado.

**Código relacionado:** `frontend/src/containers/EditUserModalContainer.tsx`, `frontend/src/pages/client/EditUserPage.tsx` (`handleUpdated`), `frontend/src/context/AuthContext.tsx` (`updateUser`, `restoreSession`), `frontend/src/utils/userValidation.ts` (`isStoredUserValid`), `backend/src/utils/userMapper.ts` (`toUserResponse`).

## ISS-16. La fotografía del cliente no se elimina al borrar su cuenta

**Funcionalidad:** Mi perfil (eliminación de cuenta) y recomendación de cortes (almacenamiento de la foto).

**Descripción:** Cuando el cliente elimina su cuenta, el sistema borra sus registros de la base de datos, pero no la fotografía que subió para las recomendaciones de corte. No se encontró en el backend ni en el servicio de IA ninguna operación que borre fotos del almacenamiento (S3). Por lo tanto, la foto del rostro permanece guardada con una clave que contiene el identificador de la cuenta eliminada.

La eliminación del cliente desde la pantalla **Clientes** del personal tampoco borra la foto.

`docs/architecture.md` confirma que no existe un procedimiento de borrado ni una política de retención de fotos. No se revisó la configuración del bucket, por lo que no se sabe si tiene reglas propias de expiración definidas fuera del repositorio.

> **Nota — comportamiento esperado:** al borrar su cuenta, también debería eliminarse la **fotografía del cliente**.

**Código relacionado:** `backend/src/services/userService.ts` (`deleteUserById`), `backend/src/repositories/userRepository.ts` (`hardDeleteClient`), `backend/src/services/clientService.ts` (`deleteClient`), `backend/src/services/bucketService.ts`, `backend/src/utils/photoKey.ts` (`getUserPhotoKey`).
