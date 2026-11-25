# Edición y cancelación de reservas - Reglas de negocio

Resumen de las reglas de negocio definidas para editar y cancelar citas. Para el contexto completo, consulta [`barbershop-app-overview.md`](./barbershop-app-overview.md).

## 1. Reglas generales

1. **Qué es editar**: editar incluye reprogramar la cita y reasignarla a otro barbero.
2. **Quién puede**: todos los roles que agendan (cliente, recepcionista y gerente) pueden crear, editar y cancelar citas.
3. **Ventana de reprogramación**: una cita puede reprogramarse dentro del periodo que va desde la fecha en que se agendó hasta 30 días después de esa fecha.
4. **Dirección del cambio**: se puede mover a un día anterior o posterior al original. También se puede reprogramar el mismo día a otra hora, más temprano o más tarde.
5. **Reasignación de barbero**: solo se permite reasignar a un barbero de la misma sucursal que el original. Quien hace el cambio decide si conserva el mismo barbero o elige otro.
6. **Solo citas futuras**: únicamente se pueden editar citas con estado `scheduled` (programada) o `rescheduled` (reprogramada). Una vez que la cita se marca como `checked_in` (el cliente llegó), ya no se puede editar.
7. **Campos editables**: fecha y hora, barbero, servicios y notas.
   - **El cliente no se puede editar.**
   - Para cambiar la **sucursal**, hay que cancelar la cita y crear una nueva.
8. **Duración y traslapes**: la duración de la cita es la suma de las duraciones de todos sus servicios. Un barbero nunca puede tener dos citas traslapadas. Si se cambian los servicios sin cambiar de barbero y la duración total resulta mayor que la original, el sistema debe validar que el barbero tenga tiempo libre suficiente para el cambio.
9. **Sin límite de reagendas**: no hay un número máximo de veces que una cita puede reagendarse (ni cancelarse).
10. **Sin bitácora**: por ahora no se lleva un registro de auditoría de los cambios en las citas.

## 2. Reglas por rol

### Cliente
- Puede editar y cancelar sus citas solo cuando faltan **8 horas o más** para la hora agendada. Con menos de 8 horas no puede editar ni cancelar.
- Si no se presenta a una cita y esta incluía un servicio gratis del programa de lealtad, **pierde ese servicio gratis** y su contador de visitas **vuelve a cero**, incluido cualquier progreso que excediera el umbral (es intencional, como incentivo para no faltar).

### Recepcionista
- Puede crear, editar y cancelar citas **solo de su sucursal asignada**.

### Gerente
- Puede crear, editar y cancelar citas de **cualquiera de las sucursales que administra**.

### Límite de 8 horas
- Aplica **únicamente a clientes**. Recepcionistas y gerentes no están sujetos a él; para ellos solo aplica la regla de que la cita no haya pasado a `checked_in`.

## 3. Cancelaciones y programa de lealtad

- Si una cita con **canje de recompensa** se cancela (ya sea por el cliente o por el personal), el cliente **conserva la recompensa** y se le aplica automáticamente en la siguiente cita que agende.
- La recompensa **solo se pierde cuando la cita se marca como no-show** (el cliente no se presentó).

## 4. Barberos y citas pendientes

- Los barberos **no son usuarios del sistema**: no pueden editar ni cancelar citas ni administrar su agenda. El gerente de la sucursal administra su horario.
- **No se puede eliminar a un barbero que tenga citas pendientes.** Primero el gerente o el recepcionista debe cancelar, reasignar y/o reprogramar todas sus citas.

## 5. Otras reglas relacionadas

- **Citas de invitados**: una cita de un cliente no registrado (invitado) **no puede convertirse** en una cita de cliente registrado, ni al revés.
- **Disponibilidad**: cualquier nuevo horario debe respetar el turno del barbero, el horario de la sucursal (lunes a sábado) y la regla de una sola cita a la vez por barbero.
- **Pagos**: el pago siempre se realiza en persona en la barbería; el sistema no gestiona pagos, por lo que cancelar o reprogramar no implica reembolsos ni cargos.
- **Notificaciones**: los **recordatorios** de citas ya están implementados y se envían únicamente por **Telegram** (unas 24 horas y 4 horas antes de la cita). Al reagendar, los recordatorios se calculan con el nuevo horario; al cancelar, dejan de enviarse. **No** se envía confirmación al agendar ni aviso al editar o cancelar una cita.
