# Epic: Gestión del estado de las citas — Reglas de negocio

Documento autocontenido con **todas** las reglas de negocio definidas para la epic. Sirve como fuente para redactar los issues: cada issue debe copiar las reglas que le aplican (con su ID) en lugar de remitir a otros documentos.

> Las reglas marcadas **[Aprobada]** fueron decididas por el negocio. Las marcadas **[Implementación]** son consecuencias técnicas necesarias para cumplir una regla de negocio.

## 1. Alcance

**Dentro de la epic**
1. Check-in de citas realizado por el staff.
2. Paso automático a `completed`.
3. Paso automático a `no_show`.
4. Registro de cada cita completada en el contador de citas completadas del cliente (programa de lealtad).
5. Walk-ins: botón "Registrar servicio sin cita" para el staff.

**Fuera de la epic**
- Cliente Android: la app móvil es **solo para clientes**. Check-in y walk-ins son exclusivos de la web.
- Notificaciones o recordatorios (incluido avisar al cliente de un `no_show`).
- Canje de recompensa desde una ruta (el flag `is_reward_redemption` aún no tiene endpoint que lo establezca).
- Penalizaciones por no-show distintas de perder la recompensa canjeada, listas de espera y auditoría de cambios.

## 2. Glosario

| Término | Significado |
|---|---|
| Cita | Fila de `appointments`. Pertenece a una sucursal y a un barbero, y ocupa el intervalo `[scheduled_start, scheduled_end)`. |
| Staff | Usuarios con rol `receptionist` o `manager`. |
| Cliente registrado | Cita con `client_id` (cuenta existente). Un cliente cuya cuenta se eliminó conserva la cita con `client_id = NULL` pero sigue siendo `is_registered_client = true`. |
| Invitado | Cita con `guest_client_name` y sin `client_id`. |
| Slot | Unidad de 15 minutos (`SLOT_STEP_MINUTES = 15`). Los inicios de cita caen en múltiplos de un slot. |
| Estados que ocupan agenda | `scheduled`, `rescheduled` y `checked_in`. Una cita en estos estados bloquea el tiempo del barbero. |
| Estados terminales | `completed`, `cancelled`, `no_show`. No ocupan agenda ni bloquean borrados. |
| Walk-in | Cita con `is_walk_in = true`: cliente que llega sin cita previa y es agendado por el staff el mismo día. |
| Hora del negocio | Zona horaria `BUSINESS_TIMEZONE`. Solo se usa para determinar "el día actual". Las demás comparaciones de tiempo son entre instantes absolutos. |
| `now` | Instante actual del servidor. En los jobs debe ser inyectable para poder probarlos. |

## 3. Máquina de estados

Estados: `scheduled`, `rescheduled`, `checked_in`, `completed`, `cancelled`, `no_show`.

| Desde | Hacia | Disparador | Regla |
|---|---|---|---|
| `scheduled` / `rescheduled` | `checked_in` | Staff, manual | R-CI-* |
| `scheduled` / `rescheduled` | `checked_in` | Job, solo walk-ins | R-WI-5 |
| `scheduled` / `rescheduled` | `no_show` | Job, solo citas que no son walk-in | R-NS-* |
| `scheduled` / `rescheduled` | `cancelled` | Ya existente (cliente con corte de 8 h, o staff) | Sin cambios |
| `checked_in` | `completed` | Job | R-CO-* |
| `completed`, `cancelled`, `no_show` | — | Terminales; ninguna transición sale de ellos | R-GEN-2 |

Comportamiento ya existente que se conserva: una cita `checked_in` (o terminal) **no se puede editar ni cancelar**; `checked_in` ocupa agenda; `scheduled`/`rescheduled`/`checked_in` bloquean el borrado de barberos y de clientes.

### Reglas generales

- **R-GEN-1** Toda transición automática o manual se ejecuta como un `UPDATE ... WHERE status IN (<estados origen>)` atómico. Si la cita ya cambió de estado, la segunda transición no hace nada (no falla el servidor). **[Implementación]**
- **R-GEN-2** Un estado terminal nunca cambia. Ninguna transición sale de `completed`, `cancelled` o `no_show`.
- **R-GEN-3** Los jobs son idempotentes: ejecutarlos varias veces, o en varias instancias a la vez, produce el mismo resultado y no duplica efectos (en particular, no incrementa dos veces el contador de un cliente). **[Implementación]**
- **R-GEN-4** Una cita reprogramada (`rescheduled`) usa siempre su `scheduled_start` y `scheduled_end` **vigentes**, nunca `original_scheduled_start`.
- **R-GEN-5** Pasar a `completed` o `no_show` no altera la disponibilidad calculada (esos estados no ocupaban agenda de forma distinta en el instante de la transición, ver R-CO-3).
- **R-GEN-6** Invariante de datos: toda cita en `checked_in` o `completed` debe tener `checked_in_at` no nulo (restricción `CHECK` en la base de datos).

## 4. Check-in manual

- **R-CI-1 [Aprobada]** Solo `receptionist` (de la sucursal donde trabaja) y `manager` (de las sucursales que administra) pueden hacer check-in. Un `client` recibe 403; staff de otra sucursal recibe 403.
- **R-CI-2** La cita debe estar en `scheduled` o `rescheduled`. Cualquier otro estado (`checked_in`, `completed`, `cancelled`, `no_show`) responde 409. Un segundo check-in sobre la misma cita responde 409.
- **R-CI-3 [Aprobada]** Ventana de check-in:
  - **Antes de `scheduled_start − 15 min`**: rechazado (409, "demasiado pronto").
  - **Entre `scheduled_start − 15 min` y `scheduled_start` (check-in anticipado)**: permitido **solo si** el mismo barbero no tiene otra cita en estado `scheduled`, `rescheduled` o `checked_in` que se traslape con el slot previo `[scheduled_start − 15 min, scheduled_start)`. Si la tiene, rechazado (409, "barbero ocupado").
  - **Desde `scheduled_start` hasta `scheduled_start + 10 min`**: permitido sin condición sobre el barbero.
  - **Desde `scheduled_start + 10 min`**: rechazado, la cita es (o está por ser marcada) `no_show`. **[Implementación]** Esta cota se valida en el endpoint aunque el job de no-show aún no haya corrido.
- **R-CI-4** En la comprobación del slot previo solo cuentan citas **del mismo barbero**; las citas `cancelled`, `no_show` y `completed`, y las de otros barberos, **no** bloquean.
- **R-CI-5** Una cita previa `scheduled`/`rescheduled` cuyo cliente aún no llegó **sí** bloquea el check-in anticipado de la siguiente, hasta que esa cita previa pase a `no_show` (10 min después de su inicio) o se cancele.
- **R-CI-6** Al hacer check-in manual, `checked_in_at = now`. `scheduled_start` y `scheduled_end` **no cambian** (un check-in anticipado o tardío no desplaza la cita ni la agenda).
- **R-CI-7 [Implementación]** La comprobación del slot previo y la transición se hacen bajo el mismo bloqueo de fila del barbero (`FOR UPDATE`, igual que la creación/edición de citas) para evitar carreras con otras altas o con el job de no-show.
- **R-CI-8** La respuesta devuelve la cita actualizada con el mismo formato que la cancelación, dentro del envelope `{ data, message, error }`.

## 5. Completado automático

- **R-CO-1 [Aprobada]** Una cita en `checked_in` pasa a `completed` cuando `now >= scheduled_end`.
- **R-CO-2 [Aprobada]** `completed_at = scheduled_end` (no la hora en que corrió el job). No se usan `checked_in_at` ni la suma de duraciones de servicios para decidir.
- **R-CO-3 [Aprobada]** Decisión de negocio: los hasta 10 minutos de check-in tardío no extienden la cita; 10 minutos menos bastan para que el barbero termine el servicio. La agenda ya bloquea `[scheduled_start, scheduled_end)`, por lo que completar **no altera la disponibilidad**.
- **R-CO-4** Aplica a toda cita `checked_in`: normales y walk-ins, de cliente registrado o invitado.
- **R-CO-5** Al completarse, se liberan los bloqueos de borrado del barbero y del cliente (ya no hay cita pendiente).

## 6. No-show automático

- **R-NS-1 [Aprobada]** Una cita en `scheduled` o `rescheduled` pasa a `no_show` cuando `now >= scheduled_start + 10 min` y no hubo check-in. Constante `NO_SHOW_GRACE_MINUTES = 10`.
- **R-NS-2 [Aprobada]** Los walk-ins **nunca** pasan a `no_show` (llegan solos a `checked_in`, ver sección 7).
- **R-NS-3** Una cita con check-in nunca se marca `no_show`. Si el check-in manual y el job compiten por la misma cita, gana la primera transición (R-GEN-1).
- **R-NS-4** Una cita `no_show` deja de ocupar agenda: libera el horario del barbero.
- **R-NS-5** Si la cita es de un cliente registrado con `is_reward_redemption = true`, el `no_show` hace perder la recompensa y reinicia el contador del cliente a 0 (ver sección 8).

## 7. Walk-ins ("Registrar servicio sin cita")

- **R-WI-1 [Aprobada]** El staff (`receptionist` de su sucursal, `manager` de sus sucursales) registra el walk-in desde el botón "Registrar servicio sin cita" de la interfaz web, que abre el formulario de agendar con el slot disponible más próximo preseleccionado. Los clientes no pueden crear walk-ins (403).
- **R-WI-2** Un walk-in es una cita normal con `is_walk_in = true`, con barbero, servicios y slot reales. Se valida igual que cualquier cita (el inicio debe ser uno de los slots de disponibilidad para ese barbero y servicios; mismo bloqueo del barbero para evitar doble reserva). Puede ser de cliente registrado (`clientId`) o de invitado (`guestClientName`).
- **R-WI-3 [Aprobada]** Solo se permiten walk-ins **del día actual** (según `BUSINESS_TIMEZONE`). Si ya no quedan slots hoy, no se puede registrar el servicio.
- **R-WI-4** Se crea en estado `scheduled`. Mientras no llegue su `scheduled_start` puede editarse o cancelarse con las reglas existentes.
- **R-WI-5 [Aprobada]** Cuando `now >= scheduled_start`, un job pasa el walk-in de `scheduled`/`rescheduled` a `checked_in`, con **`checked_in_at = scheduled_start`** (determinístico, independiente de cuándo corra el job). Un walk-in cancelado antes del inicio no se toca.
- **R-WI-6** A partir de ahí sigue el flujo normal: se completa al llegar `scheduled_end` (R-CO-1) y cuenta para el programa de lealtad si es de cliente registrado.
- **R-WI-7** Orden de los jobs en cada corrida: **1) auto check-in de walk-ins → 2) completar → 3) no-show**. Así, tras una caída del servidor, un walk-in cuyo `scheduled_end` ya pasó queda `checked_in` y luego `completed` en la misma corrida.

### Próximo slot disponible (apoyo al walk-in)

- **R-NX-1 [Aprobada]** Un endpoint devuelve, para una sucursal y un conjunto de servicios, el **próximo slot disponible de cada barbero** de la sucursal que pueda dar esos servicios, ordenado por hora de inicio ascendente. No hay desempate automático: el staff comunica las opciones al cliente y este elige barbero y hora.
- **R-NX-2** Solo se consideran slots del día actual; no se devuelven horas ya pasadas. Respeta turnos del barbero, `is_accepting_bookings`, días abiertos (lunes a sábado) y citas que ocupan agenda (reutiliza el cálculo de disponibilidad existente).
- **R-NX-3 [Implementada]** Un barbero sin slot restante hoy **se omite** de la lista (no se devuelve con `startTime: null`): así cada elemento es una opción que el staff puede ofrecer, y el front no tiene que filtrar nulos. Si ningún barbero tiene slot hoy (domingo, turnos terminados o agendas llenas), responde 200 con lista vacía. Endpoint: `GET /api/shops/:id/availability/next?serviceIds=...` → `[{ barberId, barberName, startTime }]`; los empates en `startTime` se ordenan por nombre solo para que la respuesta sea estable.
- **R-NX-4** Solo staff de la sucursal puede consultarlo; los clientes y el staff de otra sucursal reciben 403.
- **R-NX-5** Todo slot devuelto debe ser aceptado por la creación de citas con `isWalkIn = true`.

## 8. Programa de lealtad (contador de citas completadas)

Regla de producto: cada 6 servicios pagados, el séptimo es gratis. `clients.completed_services_count` es un contador de servicios pagados desde el último canje, no un historial. Solo participan clientes registrados.

- **R-LO-1** Cada cita que pasa a `completed` con cliente registrado y **sin** canje (`is_reward_redemption = false`) suma 1 al contador. Ya lo hace el trigger `update_client_loyalty_count()`; se dispara solo en la transición a `completed`, de modo que no hay doble conteo.
- **R-LO-2** Una cita `completed` con `is_reward_redemption = true` reinicia el contador a 0 (el cliente usó su servicio gratis).
- **R-LO-3 [Aprobada]** Una cita con `is_reward_redemption = true` que pasa a `no_show` reinicia el contador a 0 (el cliente pierde la recompensa). **Es lógica nueva:** requiere un trigger `AFTER UPDATE` al transicionar a `no_show`.
- **R-LO-4** Un `no_show` en una cita **sin** canje no modifica el contador.
- **R-LO-5** Cancelar una cita (incluso con canje) no modifica el contador: el cliente conserva la recompensa y puede canjearla en otra cita.
- **R-LO-6** Citas de invitados y de clientes cuya cuenta fue eliminada (`client_id IS NULL`) nunca modifican ningún contador.

Matriz resumen del efecto sobre `completed_services_count` (solo cliente registrado):

| Transición | Cita sin canje | Cita con canje |
|---|---|---|
| → `completed` | +1 | reinicia a 0 |
| → `no_show` | sin cambio | reinicia a 0 |
| → `cancelled` | sin cambio | sin cambio |

## 9. Tiempos de referencia (ejemplo)

Cita de 12:00 a 12:45, mismo barbero, slots de 15 min:

| Momento | Qué pasa |
|---|---|
| Antes de 11:45 | Check-in rechazado (demasiado pronto). |
| 11:45–11:59 | Check-in permitido solo si el barbero no tiene cita en `scheduled`/`rescheduled`/`checked_in` que se traslape con 11:45–12:00. |
| 12:00–12:09 | Check-in permitido sin condición sobre el barbero. |
| 12:10 | Sin check-in, el job la pasa a `no_show`; el check-in manual ya se rechaza. |
| 12:45 | Si estaba `checked_in`, el job la pasa a `completed` con `completed_at = 12:45`, sin importar si el check-in fue a las 11:50 o a las 12:08. |

Walk-in registrado a las 10:20 para el slot de las 10:30–11:15: queda `scheduled`; a las 10:30 el job lo pasa a `checked_in` con `checked_in_at = 10:30`; a las 11:15 pasa a `completed`. Nunca llega a `no_show`.

## 10. Permisos (resumen)

| Acción | `client` | `receptionist` | `manager` |
|---|---|---|---|
| Check-in manual | No (403) | Citas de su sucursal | Citas de las sucursales que administra |
| Crear walk-in (`isWalkIn = true`) | No (403) | En su sucursal | En las sucursales que administra |
| Consultar próximo slot por barbero | No (403) | De su sucursal | De las sucursales que administra |
| Transiciones automáticas (jobs) | — | — | — |

Los permisos se implementan en `services/userPermissions.ts`, no en middleware, siguiendo el patrón existente.

## 11. Requisitos técnicos derivados de las reglas

- No existe ningún mecanismo de tareas programadas en el backend: debe introducirse un runner periódico en proceso (cada 1 minuto, configurable) que no solape ejecuciones, registre errores sin detener el servidor, apague ordenadamente, esté deshabilitado por defecto en tests y sea seguro con varias instancias (advisory lock o `FOR UPDATE SKIP LOCKED`). Los jobs reciben `now` como parámetro.
- Esquema (`backend/database/init_database.sql`, sin herramienta de migraciones): trigger de reinicio por `no_show` con recompensa (R-LO-3), `CHECK` de R-GEN-6, e índices parciales para los jobs, p. ej. `(scheduled_start) WHERE status IN ('scheduled','rescheduled')` y `(scheduled_end) WHERE status = 'checked_in'`. Actualizar `mock_data.sql` si algún dato deja de ser válido.
- La creación de citas (`POST /api/appointments`) debe aceptar `isWalkIn` (opcional, `false` por defecto) y exponerlo en la respuesta.
- Respuestas de la API en el envelope `{ data, message, error }`; los errores de negocio se lanzan como `ApiError`. Actualizar la documentación Swagger de cada ruta nueva o modificada.

## 12. Decisiones registradas (historial)

| # | Decisión | Estado |
|---|---|---|
| D1 | Check-in solo por staff de su ámbito | Aprobada |
| D2 | Check-in desde `scheduled` y `rescheduled` | Aprobada |
| D3 | Check-in desde 15 min antes del inicio, condicionado al slot previo libre del barbero | Aprobada |
| D4 | Completado cuando `now >= scheduled_end`, `completed_at = scheduled_end` | Aprobada |
| D5 | Jobs periódicos en proceso; orden: auto check-in → completar → no-show | Propuesta (técnica) |
| D6 | Walk-ins como cita agendada por staff que pasa sola a `checked_in` en `scheduled_start` (`checked_in_at = scheduled_start`); nunca `no_show` | Aprobada |
| D6b | Walk-ins solo del día actual | Aprobada |
| D6c | Próximo slot por barbero; el cliente elige | Aprobada |
| D7 | Android solo para clientes; fuera de alcance | Aprobada |
