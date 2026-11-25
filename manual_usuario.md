# Manual de Usuario — Plataforma Web Mr. Barber

> **Versión del documento:** 0.2 (borrador en desarrollo)
> **Última actualización:** 24 de noviembre de 2026
> **Dirigido a:** clientes, recepcionistas y gerentes/asistentes de la barbería

---

## Índice

1. [Descripción general del sistema](#1-descripción-general-del-sistema)
   - 1.1 [Objetivo del sistema](#11-objetivo-del-sistema)
   - 1.2 [Alcance y funcionalidades principales](#12-alcance-y-funcionalidades-principales)
   - 1.3 [Perfiles de usuario](#13-perfiles-de-usuario)
2. [Requisitos de acceso](#2-requisitos-de-acceso)
   - 2.1 [Navegador web compatible](#21-navegador-web-compatible)
   - 2.2 [Conexión a internet](#22-conexión-a-internet)
   - 2.3 [Credenciales de acceso](#23-credenciales-de-acceso)
3. [Acceso al sistema](#3-acceso-al-sistema)
   - 3.1 [Ingreso a la plataforma](#31-ingreso-a-la-plataforma)
   - 3.2 [Registro de un cliente nuevo](#32-registro-de-un-cliente-nuevo)
   - 3.3 [Proceso de inicio de sesión](#33-proceso-de-inicio-de-sesión)
   - 3.4 [Expiración de la sesión](#34-expiración-de-la-sesión)
   - 3.5 [Cierre de sesión](#35-cierre-de-sesión)
   - 3.6 [Recuperación de contraseña](#36-recuperación-de-contraseña)
4. [Descripción de funcionalidades](#4-descripción-de-funcionalidades)
   - 4.1 [Panorama y matriz de funcionalidades por perfil](#41-panorama-y-matriz-de-funcionalidades-por-perfil)
   - 4.2 [Gestión de citas](#42-gestión-de-citas)
     - 4.2.1 [Programación de citas](#421-programación-de-citas)
     - 4.2.2 [Consulta, edición, reprogramación y cancelación](#422-consulta-edición-reprogramación-y-cancelación)
     - 4.2.3 [Estado y progreso de la cita](#423-estado-y-progreso-de-la-cita)
   - 4.3 [Recordatorios automáticos](#43-recordatorios-automáticos)
   - 4.4 [Historial del cliente](#44-historial-del-cliente)
   - 4.5 [Recomendación personalizada de cortes](#45-recomendación-personalizada-de-cortes)
   - 4.6 [Programa de fidelidad](#46-programa-de-fidelidad)
   - 4.7 [Funcionalidades en desarrollo](#47-funcionalidades-en-desarrollo)
5. [Instrucciones de uso](#5-instrucciones-de-uso)
   - 5.1 [Navegación general](#51-navegación-general)
   - 5.2 [Citas](#52-citas)
     - 5.2.1 [Agendar una cita (cliente)](#521-agendar-una-cita-cliente)
     - 5.2.2 [Agendar una cita (personal)](#522-agendar-una-cita-personal)
     - 5.2.3 [Consultar y filtrar citas](#523-consultar-y-filtrar-citas)
     - 5.2.4 [Editar o reprogramar una cita](#524-editar-o-reprogramar-una-cita)
     - 5.2.5 [Cancelar una cita](#525-cancelar-una-cita)
     - 5.2.6 [Registrar la llegada del cliente (check-in)](#526-registrar-la-llegada-del-cliente-check-in)
     - 5.2.7 [Registrar un servicio sin cita](#527-registrar-un-servicio-sin-cita)
     - 5.2.8 [Seguimiento de estados](#528-seguimiento-de-estados)
   - 5.3 [Obtener una recomendación de corte](#53-obtener-una-recomendación-de-corte)
   - 5.4 [Recordatorios](#54-recordatorios)
   - 5.5 [Mi perfil e historial del cliente](#55-mi-perfil-e-historial-del-cliente)
   - 5.6 [Programa de fidelidad](#56-programa-de-fidelidad)
6. [Administración de catálogos](#6-administración-de-catálogos)
   - 6.1 [Conceptos generales](#61-conceptos-generales)
   - 6.2 [Sucursales](#62-sucursales)
   - 6.3 [Turnos](#63-turnos)
   - 6.4 [Categorías de servicios](#64-categorías-de-servicios)
   - 6.5 [Servicios](#65-servicios)
   - 6.6 [Barberos](#66-barberos)
   - 6.7 [Clientes](#67-clientes)
   - 6.8 [Categorías de insumos](#68-categorías-de-insumos)
   - 6.9 [Insumos](#69-insumos)
   - 6.10 [Estilos y cortes](#610-estilos-y-cortes)
7. [Soporte técnico](#7-soporte-técnico)
- [Anexo A. Glosario](#anexo-a-glosario)
- [Anexo B. Resumen de reglas de negocio](#anexo-b-resumen-de-reglas-de-negocio)

---

## 1. Descripción general del sistema

### 1.1 Objetivo del sistema

La plataforma web de Mr. Barber es una aplicación diseñada para **gestionar de forma digital las citas** de una barbería con varias sucursales. Su objetivo es que:

- Los **clientes** puedan reservar, consultar, modificar y cancelar sus citas sin necesidad de llamar o acudir al local, y reciban sugerencias de cortes de cabello acordes a su rostro.
- El **personal de la barbería** (recepcionistas y gerentes) administre las citas diarias, la agenda de los barberos, el catálogo de servicios y el inventario de insumos desde un solo lugar.
- La barbería **reduzca ausencias y empalmes de horario**, ya que el sistema calcula la disponibilidad de cada barbero y evita que dos citas se traslapen.

> **Nota:** el sistema no procesa pagos. El pago de los servicios se realiza siempre de forma presencial en la barbería.

### 1.2 Alcance y funcionalidades principales

La plataforma web atiende a todos los perfiles de usuario; cada uno ve únicamente las opciones que corresponden a su rol. Las funcionalidades principales son:

| Área | Funcionalidad | Descripción |
|---|---|---|
| **Citas** | Reservación de citas | Se elige sucursal, barbero, uno o más servicios y un horario disponible. La duración de la cita es la suma de la duración de los servicios elegidos. |
| | Consulta de citas | Listado y detalle de citas, según el alcance de cada rol. |
| | Edición y reprogramación | Cambio de fecha y hora, barbero, servicios y notas. |
| | Cancelación | Cancelación de citas futuras, con motivo opcional. |
| | Clientes no registrados | El personal puede agendar citas a nombre de un cliente sin cuenta (solo se registra su nombre). |
| **Recomendación de cortes** | Sugerencia por fotografía | El cliente sube una fotografía de su rostro y el sistema sugiere cortes de cabello adecuados a su estructura facial. Es una guía de apoyo: no limita lo que el cliente puede reservar. |
| **Programa de lealtad** | Corte gratis | Cada 6 servicios pagados, el 7.º es gratuito. El conteo es global (válido en cualquier sucursal) y solo aplica a clientes registrados. |
| **Catálogos** | Servicios y categorías | Catálogo de servicios compartido por todas las sucursales (alta, consulta, modificación y eliminación). |
| | Sucursales y turnos | Administración de sucursales y de los turnos de trabajo del personal. |
| | Personal | Alta y administración de barberos y recepcionistas. |
| | Clientes | Consulta y administración de clientes por parte del personal. |
| **Inventario** | Insumos por sucursal | Control de existencias de los insumos internos (tijeras, shampoo, etc.), con indicador automático de reabastecimiento cuando el stock llega al umbral definido. |
| **Cuenta** | Perfil | Consulta y edición de datos personales, y eliminación de la cuenta. |

**Reglas de operación que conviene conocer desde el inicio**

- La barbería opera de **lunes a sábado**; los domingos permanece cerrada.
- Los horarios de cita se ofrecen en intervalos de **15 minutos**, dentro del turno del barbero (por defecto, turno matutino de 8:00 a 16:00 o vespertino de 12:00 a 20:00).
- Un barbero atiende **una sola cita a la vez**.
- Las citas pueden agendarse con hasta **30 días de anticipación**.
- Los **clientes** solo pueden editar o cancelar una cita si faltan **8 horas o más** para la hora agendada. Esta restricción no aplica al personal.
- Solo las citas futuras con estado *programada* o *reprogramada* pueden editarse o cancelarse.
- Si una cita cancelada incluía un corte gratis del programa de lealtad, el cliente **conserva** el beneficio; este solo se pierde si la cita se marca como *no se presentó*.

**Fuera del alcance actual** (funciones aún no disponibles o en desarrollo): reportes y analíticas para gerentes, entrada y salida de insumos.

### 1.3 Perfiles de usuario

| Perfil | Qué puede hacer |
|---|---|
| **Cliente** | Reservar, consultar, editar y cancelar sus propias citas; obtener recomendaciones de cortes; consultar su avance en el programa de lealtad; administrar su perfil. |
| **Recepcionista** | Gestionar las citas **de su sucursal** (agendar, editar, cancelar, registrar la llegada del cliente); administrar clientes, insumos y categorías de insumos (crear, consultar, actualizar y eliminar); consultar servicios y categorías de servicios (sin modificarlos). Las sucursales y los turnos solo los ve de forma informativa en los registros de citas. |
| **Gerente / Asistente** | Gestionar las citas de **todas las sucursales a su cargo**; administrar el catálogo de servicios, sucursales, turnos, personal (barberos y recepcionistas) e inventario de insumos. Cada sucursal tiene un único gerente, pero un gerente puede supervisar varias sucursales. |

> **Los barberos no son usuarios del sistema.** No tienen cuenta ni acceso: su agenda la administra el gerente de su sucursal y sus citas las gestionan recepcionistas y gerentes.

---

## 2. Requisitos de acceso

### 2.1 Navegador web compatible

La plataforma es una aplicación web que se utiliza directamente desde el navegador; **no requiere instalar ningún programa**. Se recomienda usar la versión más reciente de alguno de los siguientes navegadores:

| Navegador | Versión mínima recomendada |
|---|---|
| Google Chrome | 111 o superior |
| Microsoft Edge | 111 o superior |
| Mozilla Firefox | 114 o superior |
| Safari (macOS / iOS) | 16.4 o superior |

Consideraciones adicionales:

- Debe estar habilitado **JavaScript**.
- Debe permitirse el **almacenamiento local** del navegador (`localStorage`): el sistema lo usa para conservar la sesión iniciada. En modo incógnito o con el almacenamiento bloqueado, la sesión se perderá al cerrar la ventana o podría no iniciarse correctamente.
- La plataforma tiene diseño adaptable, por lo que puede usarse en computadora, tableta o teléfono. Para tareas administrativas (gerentes y recepcionistas) se recomienda una **computadora de escritorio o portátil**.
- Para la función de recomendación de cortes, el navegador debe permitir **seleccionar un archivo de imagen** del dispositivo (formatos de imagen, hasta **5 MB**).
- No se admite Internet Explorer.

> **Aplicación móvil:** existe además una aplicación para Android dirigida únicamente a clientes (inicio de sesión, inicio y perfil). Las funciones de recepcionistas y gerentes **solo están disponibles en la plataforma web**. Este manual cubre exclusivamente la plataforma web.

### 2.2 Conexión a internet

- Se requiere una **conexión a internet activa y estable** durante todo el uso del sistema; no existe modo sin conexión.
- Una conexión de banda ancha o datos móviles 4G/5G es suficiente para la mayoría de las operaciones. Para subir la fotografía de la recomendación de cortes (hasta 5 MB) se sugiere una conexión estable, ya que el enlace de subida **expira a los 2 minutos**.
- Si la conexión se interrumpe durante una operación (por ejemplo, al confirmar una reserva), verifique en *Mis citas* si la operación se registró antes de intentarla de nuevo.

**Dirección de acceso**

La plataforma se encuentra disponible en: **https://barberia.erickdh.com**

### 2.3 Credenciales de acceso

Para iniciar sesión se necesitan un **correo electrónico** y una **contraseña**. La forma de obtenerlas depende del perfil:

| Perfil | Cómo se obtiene la cuenta |
|---|---|
| **Cliente** | Mediante **registro propio** en la pantalla *Registrarse* (disponible desde la página principal y desde la pantalla de inicio de sesión). Todo registro público crea una cuenta de cliente. |
| **Recepcionista** | La cuenta es **creada por un gerente** de la sucursal. No existe registro público para este perfil. |
| **Gerente / Asistente** | La cuenta es **provisionada por el personal administrador** del sistema. No existe registro público para este perfil. |

**Datos solicitados en el registro de un cliente**

| Campo | ¿Obligatorio? | Reglas |
|---|---|---|
| Nombres | Sí | Mínimo 2 caracteres. |
| Apellidos | Sí | Mínimo 2 caracteres. |
| Teléfono | No | Solo números (por ejemplo, `6671234567`). |
| Fecha de nacimiento | Sí | Fecha válida. |
| Correo electrónico | Sí | Formato válido (`correo@ejemplo.com`); debe ser único en el sistema. |
| Contraseña | Sí | Mínimo 6 caracteres. |
| Confirmar contraseña | Sí | Debe coincidir con la contraseña. |

**Reglas y cuidados sobre las credenciales**

- Cada correo electrónico y cada número de teléfono pueden estar asociados a **una sola cuenta**; si ya existe, el sistema rechazará el registro.
- La sesión iniciada tiene una **duración de 24 horas**. Transcurrido ese tiempo, el sistema solicitará iniciar sesión nuevamente.
- La contraseña es personal e intransferible. No la comparta ni la deje guardada en equipos de uso público.
- Si olvida sus credenciales o necesita una cuenta de personal, consulte la sección [7. Soporte técnico](#7-soporte-técnico) de este manual.

---

## 3. Acceso al sistema

### 3.1 Ingreso a la plataforma

1. Abra su navegador y escriba la dirección **https://barberia.erickdh.com**.
2. Se mostrará la **página principal** de Mr. Barber, con información del negocio y de sus servicios.
3. Presione el botón **Comenzar** (en la barra superior; en teléfonos y tabletas, primero abra el menú ☰). También encontrará accesos equivalentes en otras partes de la página principal.
4. El sistema lo llevará a la pantalla de **inicio de sesión**.

> Si ya había iniciado sesión anteriormente y la sesión sigue vigente, el sistema lo llevará directamente a su pantalla de inicio sin pedirle sus credenciales de nuevo.

### 3.2 Registro de un cliente nuevo

Solo los **clientes** pueden crear su cuenta por sí mismos. Las cuentas de recepcionistas y gerentes las crea el personal autorizado (ver sección 2.3).

1. En la pantalla de inicio de sesión, presione **Regístrate** (debajo del botón *Iniciar Sesión*).
2. Complete el formulario. Los campos marcados con asterisco (`*`) son obligatorios:

   | Campo | Ejemplo |
   |---|---|
   | Nombres * | Juan Diego |
   | Apellidos * | Perez Soto |
   | Teléfono *(opcional)* | 6671234567 |
   | Fecha de nacimiento * | Fecha en el formato indicado en el campo |
   | Correo electrónico * | correo@ejemplo.com |
   | Contraseña * | Mínimo 6 caracteres |
   | Confirmar contraseña * | Repita exactamente la contraseña |

3. Presione el botón de registro para enviar el formulario.
4. Si los datos son correctos, la cuenta se crea y **el sistema inicia sesión automáticamente**: no es necesario volver a escribir sus credenciales. Será dirigido a su pantalla de inicio de cliente.

Si algún dato no cumple las reglas, el sistema mostrará un mensaje en rojo debajo del campo correspondiente o sobre el botón (por ejemplo, *Este correo ya está registrado*). Corrija el dato señalado y vuelva a enviar el formulario.

### 3.3 Proceso de inicio de sesión

Este procedimiento es el mismo para clientes, recepcionistas y gerentes.

1. Ingrese a **https://barberia.erickdh.com/login** (o llegue a ella con el botón *Comenzar*). Verá el título **Bienvenido** y el texto *Inicia sesión para ver tu cuenta*.
2. En **Correo Electrónico**, escriba el correo con el que se registró o con el que se creó su cuenta (por ejemplo, `correo@ejemplo.com`).
3. En **Contraseña**, escriba su contraseña.
4. Presione **Iniciar Sesión**. Mientras el sistema valida los datos, el botón mostrará *Ingresando...*; espere sin presionarlo de nuevo.
5. Si las credenciales son correctas, el sistema lo dirige automáticamente a la pantalla de inicio que corresponde a su perfil:

   | Perfil | Pantalla de inicio |
   |---|---|
   | Cliente | `/client/home` |
   | Recepcionista | `/receptionist/home` |
   | Gerente / Asistente | `/manager/home` |

   En el costado izquierdo aparecerá el **menú de navegación** de su perfil con un saludo (*Bienvenido, nombre* / *Bienvenida, nombre*). La navegación por el menú se detalla en la sección [5.1](#51-navegación-general).

**Validaciones y mensajes en el inicio de sesión**

| Mensaje | Cuándo aparece | Qué hacer |
|---|---|---|
| *El correo es obligatorio.* | El campo de correo está vacío. | Escriba su correo electrónico. |
| *El correo no es válido.* | El texto no tiene formato de correo (falta `@` o el dominio). | Revise que esté escrito como `usuario@dominio.com`. |
| *La contraseña es obligatoria.* | El campo de contraseña está vacío. | Escriba su contraseña. |
| *Correo o contraseña incorrectos* | El correo no existe o la contraseña no coincide. | Verifique mayúsculas/minúsculas y que el teclado no tenga el bloqueo de mayúsculas activo; si persiste, contacte a soporte. |
| *No se pudo iniciar sesión* | Error inesperado (por ejemplo, sin conexión con el servidor). | Verifique su conexión a internet e intente de nuevo en unos minutos. |

**Control de acceso por perfil**

- Cada perfil solo puede entrar a las pantallas que le corresponden. Si, estando autenticado, intenta abrir una dirección que pertenece a otro perfil (por ejemplo, un cliente que escribe una dirección `/manager/...`), el sistema lo regresará automáticamente a **su** pantalla de inicio.
- Si intenta abrir una dirección que no existe, el sistema lo llevará a su pantalla de inicio (o a la de inicio de sesión si no ha ingresado).
- Si intenta abrir una pantalla protegida **sin haber iniciado sesión**, el sistema lo llevará a la pantalla de inicio de sesión.
- Mientras tenga una sesión activa, las pantallas públicas (página principal, inicio de sesión y registro) lo redirigen a su pantalla de inicio.

### 3.4 Expiración de la sesión

Por seguridad, cada sesión **dura 24 horas** desde que se inicia. Al cumplirse ese tiempo, o si el sistema detecta que la sesión ya no es válida, aparece una ventana con el título **Tu sesión expiró** y el mensaje *Por seguridad, debes iniciar sesión nuevamente para continuar usando tu cuenta*.

1. Presione **Continuar**.
2. El sistema cierra la sesión y lo lleva a la pantalla de inicio de sesión.
3. Ingrese de nuevo sus credenciales (sección 3.3).

> Esta ventana no puede cerrarse haciendo clic fuera de ella: es necesario presionar **Continuar**. Guarde o termine cualquier operación pendiente antes de que se cumplan las 24 horas, ya que los datos no enviados se perderán.

### 3.5 Cierre de sesión

Cierre siempre su sesión al terminar de usar el sistema, especialmente en equipos compartidos o públicos.

**Desde el menú de navegación (todos los perfiles)**

1. En el menú lateral, presione **Cerrar sesión** (al final del menú, bajo las demás opciones).
   - En **teléfonos y tabletas**, el menú permanece oculto: presione primero el botón redondo con el ícono ☰ en la esquina superior izquierda para abrirlo.
2. Aparecerá la ventana de confirmación **¿Cerrar sesión?** con el texto *Vas a salir de tu cuenta. Tendrás que iniciar sesión de nuevo para volver a acceder.*
3. Elija una opción:
   - **Sí, cerrar sesión:** termina la sesión y lo lleva a la pantalla de inicio de sesión.
   - **Cancelar:** cierra la ventana y permanece en el sistema.

**Desde el perfil (clientes)**

1. Entre a **Mi Perfil** en el menú.
2. Presione **Cerrar Sesión** en el apartado correspondiente del perfil.
3. Confirme con **Sí, cerrar sesión** en la ventana que aparece.

**Qué ocurre al cerrar sesión**

- Se eliminan del navegador los datos de la sesión (credenciales de acceso y datos del usuario). Para volver a entrar deberá escribir de nuevo su correo y contraseña.
- Cerrar solamente la pestaña o el navegador **no** cierra la sesión: al volver a abrir la dirección dentro de las 24 horas de vigencia, entrará directamente a su cuenta. Use siempre **Cerrar sesión** en equipos que no sean de su uso exclusivo.

### 3.6 Recuperación de contraseña

La pantalla de inicio de sesión muestra el enlace **¿Olvidaste tu contraseña?**; sin embargo, **la recuperación de contraseña por cuenta propia aún no está disponible** en la plataforma: al presionar el enlace el sistema lo regresa a la pantalla de inicio de sesión.

Si olvidó su contraseña, contacte a soporte técnico (sección [7](#7-soporte-técnico)) indicando el correo con el que está registrado. Si conoce su contraseña actual y solo desea cambiarla, un cliente puede hacerlo desde **Mi Perfil** (opción de cambio de contraseña).

---

## 4. Descripción de funcionalidades

Esta sección explica **qué hace** cada funcionalidad del sistema, quién puede usarla y qué reglas la gobiernan. Los pasos detallados para utilizarlas se encuentran en la sección [5. Instrucciones de uso](#5-instrucciones-de-uso); la administración de catálogos, en la sección [6](#6-administración-de-catálogos).

### 4.1 Panorama y matriz de funcionalidades por perfil

*(por desarrollar: tabla funcionalidad × perfil —Cliente, Recepcionista, Gerente/Asistente—, indicando el estado de cada funcionalidad: disponible, en implementación o no disponible aún.)*

### 4.2 Gestión de citas

#### 4.2.1 Programación de citas

**Disponible para:** Cliente · Recepcionista · Gerente/Asistente

*(por desarrollar)*

#### 4.2.2 Consulta, edición, reprogramación y cancelación

**Disponible para:** Cliente · Recepcionista · Gerente/Asistente

*(por desarrollar)*

#### 4.2.3 Estado y progreso de la cita

**Disponible para:** Cliente (consulta) · Recepcionista · Gerente/Asistente

*(por desarrollar: ciclo de vida de la cita —Agendada, Reagendada, Iniciada, Completada, Cancelada, Ausencia—, registro de llegada, transiciones automáticas y servicios sin cita.)*

### 4.3 Recordatorios automáticos

**Disponible para:** Cliente

*(por desarrollar)*

### 4.4 Historial del cliente

**Disponible para:** Cliente · Recepcionista · Gerente/Asistente

*(por desarrollar: citas pasadas y canceladas, historial de recomendaciones y datos del perfil.)*

### 4.5 Recomendación personalizada de cortes

**Disponible para:** Cliente

*(por desarrollar)*

### 4.6 Programa de fidelidad

**Disponible para:** Cliente (consulta de avance) · Recepcionista y Gerente/Asistente (aplicación en la cita)

*(por desarrollar: conteo de servicios y canje de la recompensa; el canje se encuentra en proceso de implementación.)*

### 4.7 Funcionalidades en desarrollo

Funcionalidades contempladas que aún no están disponibles en el sistema:

- Gestión de niveles de stock mínimo de insumos.
- Control de movimientos de inventario (entradas y salidas).
- Generación de reportes administrativos.

*(por desarrollar: descripción de cada una según sus casos de uso.)*

---

## 5. Instrucciones de uso

Esta sección presenta los procedimientos paso a paso para cada funcionalidad descrita en la sección 4.

<!--
Cada procedimiento (5.2.x a 5.6) incluye, dentro de su propia subsección y sin encabezados dedicados:
  - Apoyo visual (capturas de pantalla, diagramas)
  - Errores frecuentes y cómo resolverlos
  - Recomendaciones de uso
-->

### 5.1 Navegación general

*(por desarrollar: opciones del menú de navegación de cada perfil y uso del menú ☰ en teléfonos y tabletas.)*

### 5.2 Citas

#### 5.2.1 Agendar una cita (cliente)

*(por desarrollar)*

#### 5.2.2 Agendar una cita (personal)

*(por desarrollar: incluye agendar a nombre de un cliente registrado o de un visitante sin cuenta.)*

#### 5.2.3 Consultar y filtrar citas

*(por desarrollar)*

#### 5.2.4 Editar o reprogramar una cita

*(por desarrollar)*

#### 5.2.5 Cancelar una cita

*(por desarrollar)*

#### 5.2.6 Registrar la llegada del cliente (check-in)

*(por desarrollar)*

#### 5.2.7 Registrar un servicio sin cita

*(por desarrollar)*

#### 5.2.8 Seguimiento de estados

*(por desarrollar)*

### 5.3 Obtener una recomendación de corte

*(por desarrollar: subir la fotografía, interpretar el resultado y consultar el historial de recomendaciones.)*

### 5.4 Recordatorios

*(por desarrollar)*

### 5.5 Mi perfil e historial del cliente

*(por desarrollar)*

### 5.6 Programa de fidelidad

*(por desarrollar)*

---

## 6. Administración de catálogos

<!--
Plantilla de cada catálogo (6.2 a 6.10):
  - Para qué sirve
  - Quién accede
  - Campos y reglas
  - Procedimientos (consultar, crear, editar, eliminar), con capturas de pantalla
  - Errores frecuentes y cómo resolverlos
  - Recomendaciones de uso
-->

### 6.1 Conceptos generales

*(por desarrollar: patrón común de las pantallas de catálogo, permisos por perfil, orden recomendado de configuración inicial —sucursales, turnos, categorías y servicios, barberos, insumos— y reglas de eliminación.)*

### 6.2 Sucursales

**Disponible para:** Gerente/Asistente (página dedicada de administración). El recepcionista no cuenta con esta página; solo ve la sucursal de forma informativa en los registros de citas.

*(por desarrollar)*

### 6.3 Turnos

**Disponible para:** Gerente/Asistente (página dedicada de administración). El recepcionista no cuenta con esta página; solo ve los turnos de forma informativa en los registros de citas.

*(por desarrollar)*

### 6.4 Categorías de servicios

**Disponible para:** Gerente/Asistente (administración) · Recepcionista (solo consulta)

*(por desarrollar)*

### 6.5 Servicios

**Disponible para:** Gerente/Asistente (administración) · Recepcionista (solo consulta)

*(por desarrollar)*

### 6.6 Barberos

**Disponible para:** Gerente/Asistente

*(por desarrollar: los barberos se administran desde la opción *Personal* del menú del gerente, que también administra a los recepcionistas.)*

### 6.7 Clientes

**Disponible para:** Gerente/Asistente · Recepcionista (crear, consultar, actualizar y eliminar)

*(por desarrollar)*

### 6.8 Categorías de insumos

**Disponible para:** Gerente/Asistente · Recepcionista (crear, consultar, actualizar y eliminar)

*(por desarrollar)*

### 6.9 Insumos

**Disponible para:** Gerente/Asistente · Recepcionista (crear, consultar, actualizar y eliminar)

*(por desarrollar)*

### 6.10 Estilos y cortes

**Disponible para:** *(por definir según los casos de uso)*

*(por desarrollar: se describirá a partir de los casos de uso definidos para este catálogo.)*

---

## 7. Soporte técnico

*(por desarrollar: incluye recuperación de contraseña y solicitud de cuentas de personal.)*

---

## Anexo A. Glosario

*(por desarrollar)*

## Anexo B. Resumen de reglas de negocio

*(por desarrollar)*

---

*Las secciones marcadas como «por desarrollar» se completarán en las siguientes entregas de este manual.*
