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
| **Programa de lealtad** | Servicio gratis | Al completar 6 citas, se otorga un servicio gratis al agendar la próxima cita. El conteo es global (válido en cualquier sucursal) y solo aplica a clientes registrados. |
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

Este apartado resume, de un vistazo, **qué funcionalidades ofrece la plataforma, quién puede usarlas y en qué estado se encuentran**. Cada funcionalidad se explica con detalle en los apartados 4.2 a 4.7.

**Estados de las funcionalidades**

| Estado | Significado |
|---|---|
| **Disponible** | Funciona actualmente en la plataforma. |
| **En implementación** | Está parcialmente disponible; sus alcances pueden ampliarse en próximas versiones. |
| **No disponible aún** | Está contemplada, pero todavía no puede utilizarse. Se describe en el apartado [4.7](#47-funcionalidades-en-desarrollo). |

**Funcionalidades por perfil**

| Funcionalidad | Cliente | Recepcionista | Gerente / Asistente | Estado | Detalle |
|---|---|---|---|---|---|
| Acceso al sistema (registro, inicio y cierre de sesión, recuperación de contraseña) | ✔ | ✔ | ✔ | Disponible | [Sección 3](#3-acceso-al-sistema) |
| Programación de citas | ✔ Propias | ✔ A nombre de un cliente, de su sucursal | ✔ A nombre de un cliente, de sus sucursales | Disponible | [4.2.1](#421-programación-de-citas) |
| Consulta, edición, reprogramación y cancelación de citas | ✔ Propias, con 8 horas o más de anticipación | ✔ De su sucursal | ✔ De todas sus sucursales | Disponible | [4.2.2](#422-consulta-edición-reprogramación-y-cancelación) |
| Estado y progreso de la cita | ✔ Solo consulta | ✔ | ✔ | Disponible | [4.2.3](#423-estado-y-progreso-de-la-cita) |
| Recordatorios automáticos | ✔ Los recibe | — | — | Disponible | [4.3](#43-recordatorios-automáticos) |
| Historial del cliente | ✔ El propio | ✔ Parcial (ver nota 1) | ✔ Parcial (ver nota 1) | Disponible para el cliente; página dedicada para el personal no disponible aún | [4.4](#44-historial-del-cliente) |
| Recomendación personalizada de cortes | ✔ | — | — | Disponible | [4.5](#45-recomendación-personalizada-de-cortes) |
| Programa de fidelidad: conteo de citas completadas y consulta de avance | ✔ Consulta su avance | ✔ Consulta el conteo del cliente | ✔ Consulta el conteo del cliente | En implementación | [4.6](#46-programa-de-fidelidad) |
| Programa de fidelidad: recompensa automática | ✔ | ✔ | ✔ | En implementación | [4.6](#46-programa-de-fidelidad) |
| Gestión de niveles de stock mínimo | — | ✔ | ✔ | No disponible aún | [4.7](#47-funcionalidades-en-desarrollo) |
| Control de movimientos de inventario | — | ✔ | ✔ | No disponible aún | [4.7](#47-funcionalidades-en-desarrollo) |
| Generación de reportes administrativos | — | — | ✔ | No disponible aún | [4.7](#47-funcionalidades-en-desarrollo) |

> **Nota:** el símbolo ✔ indica que el perfil puede usar la funcionalidad; el guion (—) indica que no forma parte de su perfil. Para las funcionalidades aún no disponibles, la columna muestra el perfil al que está destinada.
>
> **Nota 1 — Historial del cliente:** actualmente el cliente puede consultar su propio historial. El personal (recepcionista y gerente/asistente) no cuenta con una página dedicada para ello; en su lugar, puede consultar el historial de un cliente **filtrando las citas por nombre y fecha**. Una página dedicada al historial del cliente para el personal se desarrollará en el futuro (no disponible aún).

**Catálogos por perfil**

Además de las funcionalidades anteriores, el personal administra la información base de la barbería mediante catálogos. Su operación se describe en la sección [6. Administración de catálogos](#6-administración-de-catálogos).

| Catálogo | Cliente | Recepcionista | Gerente / Asistente | Detalle |
|---|---|---|---|---|
| Sucursales | — | Solo informativo, dentro de las citas | ✔ Administra | [6.2](#62-sucursales) |
| Turnos | — | Solo informativo, dentro de las citas | ✔ Administra | [6.3](#63-turnos) |
| Categorías de servicios | — | Solo consulta | ✔ Administra | [6.4](#64-categorías-de-servicios) |
| Servicios | — | Solo consulta | ✔ Administra | [6.5](#65-servicios) |
| Barberos | — | — | ✔ Administra | [6.6](#66-barberos) |
| Clientes | — | ✔ Crea, consulta, actualiza y elimina | ✔ Administra | [6.7](#67-clientes) |
| Categorías de insumos | — | ✔ Crea, consulta, actualiza y elimina | ✔ Administra | [6.8](#68-categorías-de-insumos) |
| Insumos | — | ✔ Crea, consulta, actualiza y elimina | ✔ Administra | [6.9](#69-insumos) |
| Estilos y cortes | — | — | — | [6.10](#610-estilos-y-cortes) |

> **Nota:** el catálogo de *Estilos y cortes* no tiene una pantalla de administración para ningún perfil; su información alimenta las recomendaciones de corte (apartado 4.5).

**Alcance de cada perfil en las citas**

- El **cliente** solo ve y gestiona sus propias citas.
- El **recepcionista** gestiona las citas de **su sucursal**.
- El **gerente o asistente** gestiona las citas de **todas las sucursales a su cargo**.

Los barberos no son usuarios del sistema; por ello no aparecen en las tablas anteriores.

### 4.2 Gestión de citas

#### 4.2.1 Programación de citas

**Disponible para:** Cliente · Recepcionista · Gerente/Asistente

La programación de citas permite **reservar un horario con un barbero** para recibir uno o más servicios. El sistema calcula en tiempo real los horarios libres de cada barbero, de modo que solo se puede reservar un horario realmente disponible. Cada perfil accede a esta función desde la opción **Agendar Cita** de su menú.

**Qué se elige al programar una cita**

| Dato | Descripción |
|---|---|
| **Sucursal** | Local donde se realizará el servicio. |
| **Servicios** | Uno o más servicios del catálogo. Cada opción muestra su nombre, duración y precio. Un mismo servicio no puede elegirse dos veces en la misma cita. |
| **Fecha** | Día de la cita, que se elige en un calendario que indica qué días tienen horarios disponibles. |
| **Horario y barbero** | Hora de inicio y barbero que atenderá. Se elige entre los horarios libres del día; cada horario se muestra junto al nombre del barbero que lo ofrece. |
| **Cliente** | Persona a nombre de quien se agenda la cita. Solo lo indica el personal; cuando el cliente agenda por sí mismo, la cita queda a su nombre. |

Antes de confirmar, la pantalla muestra un resumen con la sucursal, la fecha, el horario, el barbero, los servicios elegidos, el **precio total** y la **duración total** de la cita.

**Cómo se calcula la disponibilidad**

- La **duración de la cita es la suma de las duraciones** de los servicios elegidos. Por ello, los horarios disponibles cambian si se agregan o se quitan servicios.
- Los horarios se ofrecen en **intervalos de 15 minutos**, dentro del turno de cada barbero. Después de una cita, el siguiente horario libre comienza justo cuando esta termina.
- Un barbero atiende **una sola cita a la vez**: no se ofrecen horarios que se empalmen con otra cita del mismo barbero.
- Solo se ofrecen barberos **activos** de la sucursal elegida y servicios **activos** del catálogo.
- La barbería abre **de lunes a sábado**. Los domingos aparecen como días cerrados y no pueden seleccionarse.
- Se puede agendar **desde el día de hoy y hasta con 30 días de anticipación**. No es posible reservar fechas pasadas ni, en el día de hoy, horas que ya transcurrieron.
- Si ya no hay horarios libres en un día, el calendario lo indica como lleno.

**Programación según el perfil**

| Perfil | Alcance |
|---|---|
| **Cliente** | Agenda únicamente **a su propio nombre**. Puede elegir cualquier sucursal activa. |
| **Recepcionista** | Agenda a nombre de un cliente, solo en **su sucursal**. |
| **Gerente / Asistente** | Agenda a nombre de un cliente en **cualquiera de las sucursales a su cargo**. |

El personal debe indicar para quién es la cita. Hay dos opciones:

- **Cliente registrado:** se busca por nombre, apellido o correo electrónico y se selecciona de la lista de resultados. La cita queda ligada a su cuenta: aparece en su historial y en su sección *Mis Citas*, suma al programa de fidelidad y genera recordatorios.
- **Visitante:** persona sin cuenta en la plataforma. Solo se captura su nombre (hasta 100 caracteres), sin teléfono ni correo. La cita de un visitante **no suma al programa de fidelidad ni genera recordatorios**, porque no hay una cuenta ni datos de contacto asociados.

> **Importante:** una cita de visitante nunca puede convertirse en la cita de un cliente registrado, ni al revés. Si el visitante después se registra, sus citas anteriores permanecen como citas de visitante.

**Resultado de la programación**

- Al confirmar, la cita se crea con estado **Agendada** y el sistema muestra el aviso *«Cita agendada correctamente»*; después lleva al usuario a su listado de citas (*Mis Citas* para el cliente, *Citas* para el personal). Los estados de la cita se describen en el apartado [4.2.3](#423-estado-y-progreso-de-la-cita).
- Si otra persona reserva el mismo horario mientras se completa el formulario, el sistema avisa que **el horario ya no está disponible**, actualiza los horarios y permite elegir otro; los datos capturados no se pierden.
- La cita **no admite capturar notas** al momento de agendarla. Las notas pueden agregarse después, al editar la cita (apartado [4.2.2](#422-consulta-edición-reprogramación-y-cancelación)).

**Aspectos a considerar**

- El sistema **no procesa pagos**: el precio mostrado es informativo y el pago se realiza de forma presencial en la barbería.
- Para cambiar la **sucursal** de una cita ya agendada es necesario cancelarla y programar una nueva; tampoco puede cambiarse el cliente de una cita.
- Los clientes que llegan sin cita se registran como *servicio sin cita*, función exclusiva del personal que se describe en el apartado [4.2.3](#423-estado-y-progreso-de-la-cita).
- Si el cliente tiene una recompensa disponible por el programa de fidelidad, esta se aplica automáticamente a la cita que agende; consulte el apartado [4.6](#46-programa-de-fidelidad).

Los pasos detallados se encuentran en los apartados [5.2.1 Agendar una cita (cliente)](#521-agendar-una-cita-cliente) y [5.2.2 Agendar una cita (personal)](#522-agendar-una-cita-personal).

#### 4.2.2 Consulta, edición, reprogramación y cancelación

**Disponible para:** Cliente · Recepcionista · Gerente/Asistente

Una vez programada, la cita puede **consultarse, modificarse y cancelarse**. Esta función se encuentra en la opción **Mis Citas** del menú del cliente y en la opción **Citas** del menú del personal. Los pasos detallados están en los apartados [5.2.3](#523-consultar-y-filtrar-citas), [5.2.4](#524-editar-o-reprogramar-una-cita) y [5.2.5](#525-cancelar-una-cita).

**Consulta de citas**

| Perfil | Qué se muestra |
|---|---|
| **Cliente** | Únicamente **sus propias citas**, organizadas en tres pestañas: **Próximas citas**, **Citas pasadas** y **Citas canceladas**. Una cita pasa a *pasadas* cuando termina su horario o cuando se completó o se registró como ausencia. Se incluyen las citas de aproximadamente los últimos 11 meses (ver [4.4](#44-historial-del-cliente)). |
| **Recepcionista** | Las citas **de su sucursal**, en un solo listado. |
| **Gerente / Asistente** | Las citas de **todas las sucursales a su cargo**, en un solo listado, con la posibilidad de filtrar por sucursal cuando tiene más de una. |

Cada cita del listado muestra su identificador, la fecha de servicio, el cliente (solo en la vista del personal), los servicios, el barbero, la fecha en que fue creada y su estado. El listado se puede ordenar por **fecha de servicio** y se divide en páginas.

Para ubicar una cita, el personal cuenta con una **búsqueda por nombre o correo del cliente** y con filtros por fecha de servicio, fecha de creación, servicio y estado (además de sucursal para el gerente). El cliente puede filtrar por fecha de creación y servicio. Los filtros se aplican de inmediato. Cuando el personal no indica fechas de servicio, el listado muestra las citas **de hoy a los próximos 30 días**; el rango de fechas que se consulta no puede exceder **un año**.

> **Nota:** el personal no cuenta con una página dedicada al historial de un cliente; puede consultarlo buscando por su nombre o correo en el listado de citas (ver apartado [4.1](#41-panorama-y-matriz-de-funcionalidades-por-perfil), nota 1).

**Detalle de la cita**

Al seleccionar una cita se muestra su detalle: fecha, horario y duración, sucursal, barbero, cliente (en la vista del personal; las citas de visitantes se identifican con la etiqueta *Visitante*), servicios con su duración y precio, **total**, notas y el **seguimiento** de la cita. También se indican, cuando corresponde, si la cita es de un servicio sin cita (*walk-in*) y si incluye una recompensa del programa de fidelidad. El cliente ve el detalle en una página; el personal, en una ventana emergente.

El **precio y la duración** de cada servicio corresponden a los vigentes **al momento de agendar**: si el catálogo cambia después, las citas ya agendadas conservan sus valores originales.

**Qué se puede modificar en una cita**

| Dato | ¿Editable? | Observaciones |
|---|---|---|
| Fecha y hora | Sí | Dentro del periodo de reprogramación (ver más adelante). |
| Barbero | Sí | Solo entre los barberos **de la misma sucursal** de la cita. |
| Servicios | Sí | Se pueden agregar o quitar, siempre con al menos uno. La duración total se recalcula. |
| Notas | Sí | Hasta 500 caracteres. |
| Sucursal | No | Para cambiarla, cancele la cita y programe una nueva. |
| Cliente | No | Para cambiarlo, cancele la cita y programe una nueva. |

**Edición y reprogramación**

- **Editar** una cita incluye *reprogramarla* (cambiar fecha, hora o barbero) y cambiar sus servicios o notas.
- Solo pueden editarse las citas **futuras** con estado **Agendada** o **Reagendada**. Una vez que se registra la llegada del cliente (*Iniciada*), o cuando la cita ya comenzó, terminó o fue cancelada, **ya no puede editarse**.
- La nueva fecha debe estar dentro del periodo que va **desde el día en que se agendó la cita hasta 30 días después de ese día**. La cita puede moverse a un día anterior, a uno posterior o al mismo día en otro horario, siempre que sea una fecha futura.
- El nuevo horario debe estar **disponible**: respetar el turno del barbero, el horario de la sucursal (lunes a sábado) y la regla de una sola cita a la vez por barbero. El horario actual de la propia cita no bloquea su reprogramación.
- Si se **cambian los servicios** y la duración total aumenta, el sistema valida que el barbero tenga tiempo libre suficiente para la nueva duración; si no lo tiene, es necesario elegir otro horario u otro barbero.
- Si se cambia la **fecha, la hora o el barbero**, la cita pasa al estado **Reagendada**. Si solo se modifican los servicios o las notas, conserva su estado.
- No existe un límite de veces que una cita puede reprogramarse ni se lleva un registro de los cambios realizados.

**Cancelación**

- Solo pueden cancelarse las citas **futuras** con estado **Agendada** o **Reagendada**.
- Al cancelar se puede indicar, de forma **opcional**, el **motivo** de la cancelación (hasta 255 caracteres). La acción **no se puede deshacer**.
- La cita cancelada cambia a estado **Cancelada**: ya no ocupa el horario del barbero, que vuelve a quedar disponible, y permanece en el historial (para el cliente, en la pestaña *Citas canceladas*).
- Si la cita incluía una **recompensa del programa de fidelidad**, el cliente **la conserva** y se le aplicará automáticamente en la siguiente cita que agende, ya sea que cancele el cliente o el personal. La recompensa solo se pierde si el cliente no se presenta y la cita se registra como *Ausencia* (ver apartado [4.6](#46-programa-de-fidelidad)).
- Como el sistema no procesa pagos, cancelar o reprogramar **no genera cargos ni reembolsos**.

**Reglas según el perfil**

| Perfil | Citas sobre las que puede actuar | Restricción de anticipación |
|---|---|---|
| **Cliente** | Únicamente las suyas. | Solo si faltan **8 horas o más** para la hora de la cita. Con menos tiempo no puede editarla ni cancelarla por sí mismo; el personal sí puede hacerlo. |
| **Recepcionista** | Las de su sucursal. | No aplica el límite de 8 horas; basta con que la cita siga siendo futura y esté Agendada o Reagendada. |
| **Gerente / Asistente** | Las de las sucursales a su cargo. | No aplica el límite de 8 horas; basta con que la cita siga siendo futura y esté Agendada o Reagendada. |

**Aspectos a considerar**

- Las citas de un **visitante** pueden editarse y cancelarse solo por el personal, ya que no tienen una cuenta asociada.
- Los **barberos no son usuarios** del sistema: no pueden consultar ni modificar citas. Quien reasigna o reprograma las citas de un barbero es el personal.
- Por ahora el sistema **no envía notificaciones** al cliente cuando el personal edita o cancela su cita; se recomienda avisarle directamente.

#### 4.2.3 Estado y progreso de la cita

**Disponible para:** Cliente (consulta) · Recepcionista · Gerente/Asistente

Toda cita tiene un **estado** que indica en qué punto se encuentra: desde que se agenda hasta que se atiende, se cancela o el cliente no se presenta. El estado se muestra en el listado de citas y en el detalle de cada cita, y cambia por acciones del personal o de forma **automática** según la hora de la cita.

**Estados de una cita**

| Estado | Significado | ¿Ocupa el horario del barbero? |
|---|---|---|
| **Agendada** | La cita fue programada y está pendiente de atenderse. | Sí |
| **Reagendada** | La cita fue agendada y luego se cambió su fecha, hora o barbero (ver [4.2.2](#422-consulta-edición-reprogramación-y-cancelación)). Se comporta igual que una cita agendada. | Sí |
| **Iniciada** | El cliente llegó y el personal registró su llegada (*check-in*). La cita está en curso. | Sí |
| **Completada** | La cita ya se atendió y terminó. | No |
| **Cancelada** | La cita se canceló antes de iniciar. | No |
| **Ausencia** | El cliente no se presentó. | No |

Las citas **Completada**, **Cancelada** y **Ausencia** son estados **finales**: una vez alcanzados, la cita ya no cambia de estado.

**Ciclo de vida de la cita**

| De | A | Cómo ocurre |
|---|---|---|
| Agendada / Reagendada | Reagendada | El cliente o el personal cambian la fecha, hora o barbero. |
| Agendada / Reagendada | Iniciada | El personal registra la llegada del cliente (*check-in*). |
| Agendada / Reagendada | Cancelada | El cliente o el personal cancelan la cita. |
| Agendada / Reagendada | Ausencia | **Automático**, 10 minutos después de la hora de inicio si no hubo check-in; o manual por la recepción. |
| Iniciada | Completada | **Automático**, al llegar la hora de término de la cita. |

**Registro de llegada (check-in)**

El check-in lo realiza **únicamente el personal**: la recepción en las citas de su sucursal y el gerente en las de sus sucursales. El cliente no lo registra por sí mismo.

- Solo puede registrarse en citas **Agendadas o Reagendadas**.
- Está disponible **desde 15 minutos antes de la hora de inicio** y **hasta antes de los 10 minutos posteriores** a la hora de inicio. Fuera de esa ventana, el sistema lo rechaza.
- En el **check-in anticipado** (los 15 minutos previos al inicio), el sistema solo lo permite si el **mismo barbero** no tiene otra cita pendiente en ese periodo. Si el barbero sigue ocupado con otra cita, deberá esperarse a la hora de inicio.
- Desde la hora de inicio y hasta los 10 minutos posteriores, el check-in se permite sin esa condición.
- El check-in **no mueve la cita**: la hora de inicio y de término agendadas no cambian aunque el cliente llegue antes o después.
- Una vez registrado el check-in, la cita **ya no puede editarse ni cancelarse**.

**Transiciones automáticas**

El sistema revisa las citas **cada minuto** y las actualiza sin intervención del personal:

- **Completada:** una cita *Iniciada* pasa a *Completada* cuando llega su **hora de término**. La hora de cierre registrada es la hora de término agendada, aunque el cliente haya llegado tarde; los minutos de tolerancia de llegada no extienden la cita.
- **Ausencia:** una cita *Agendada* o *Reagendada* sin check-in pasa a *Ausencia* **10 minutos después de su hora de inicio**. Al hacerlo, el horario del barbero queda libre.
- **Check-in de servicios sin cita:** ver el siguiente apartado.

**Ausencia registrada manualmente**

La **recepción** puede marcar una cita como *Ausencia* sin esperar a la transición automática, a partir de la hora de inicio programada, mediante la opción **Marcar inasistencia** del detalle de la cita. Solo aplica a citas Agendadas o Reagendadas que no sean servicios sin cita. Una vez confirmada, la acción no puede revertirse.

**Servicios sin cita**

Es el caso del cliente que **llega sin haber agendado**. El personal lo registra el mismo día como una cita normal, con barbero, servicios y horario disponibles, y puede ser a nombre de un cliente registrado o de un visitante.

- Se registra desde la página **Agendar Cita** del personal, con el botón **Registrar servicio sin cita**. Para volver al agendado normal se usa el botón **Agendar cita con fecha**.
- En este modo no se elige un día en el calendario: el sistema muestra el **próximo horario disponible de hoy de cada barbero** de la sucursal para los servicios elegidos, y deja **preseleccionado el más próximo**. El personal comunica las opciones al cliente y selecciona la que este prefiera.
- Solo pueden registrarse servicios **del día en curso**. Si ya no queda disponibilidad hoy para los servicios elegidos, el sistema indica que no es posible registrarlo y se debe ofrecer al cliente agendar otro día.
- Los clientes no pueden crear servicios sin cita.
- Se crean como una cita *Agendada*; mientras no llegue su hora de inicio pueden editarse o cancelarse como cualquier otra cita.
- Al llegar la hora de inicio, el sistema **registra el check-in automáticamente** y la cita pasa a *Iniciada*; al llegar la hora de término, pasa a *Completada*.
- **Nunca pasan a *Ausencia***, porque el cliente ya se encuentra en la barbería. No requieren que el personal registre su llegada.
- En los listados se identifican con la etiqueta **Walk-in**, y en su seguimiento aparece como *Walk-in registrado*.

El procedimiento paso a paso se encuentra en el apartado [5.2.7](#527-registrar-un-servicio-sin-cita).

**Seguimiento de la cita**

El detalle de cada cita incluye una **línea de tiempo** con los hechos relevantes y su fecha y hora, en orden cronológico:

| Evento | Cuándo aparece |
|---|---|
| **Cita agendada** (o **Walk-in registrado**) | Siempre; corresponde a la creación de la cita. |
| **Cita reagendada** | Cuando se cambió fecha, hora o barbero; indica la fecha original. |
| **Check-in registrado** | Cuando el cliente llegó (para servicios sin cita se indica *Check-in automático*). |
| **Cliente ausente** | Cuando la cita pasó a *Ausencia*. |
| **Cita cancelada** | Cuando se canceló, junto con el motivo si se indicó. |
| **Cita completada** | Cuando la cita terminó. |

El **cliente** consulta el estado y el seguimiento de sus citas en el detalle de cada una (*Mis Citas*); el **personal**, en el listado y en el detalle de **Citas**. El personal puede filtrar el listado por estado.

**Efecto en el programa de fidelidad**

El estado final de la cita determina cómo avanza el conteo de servicios del cliente registrado (ver [4.6](#46-programa-de-fidelidad)):

| Estado final | Cita sin recompensa | Cita con recompensa |
|---|---|---|
| **Completada** | Suma 1 cita al conteo. | Se **restan 6** al conteo (el cliente ya usó su servicio gratuito); si tenía más de 6, conserva el excedente. Por ejemplo, un conteo de 8 queda en 2. |
| **Ausencia** | Sin cambio. | El cliente **pierde la recompensa** y su conteo se reinicia a cero, incluido el excedente. |
| **Cancelada** | Sin cambio. | Sin cambio: el cliente **conserva** la recompensa y se le aplicará automáticamente en la siguiente cita que agende. |

Las citas de visitantes nunca modifican ningún conteo.

> **Nota:** el programa de fidelidad se encuentra en implementación (ver apartado [4.1](#41-panorama-y-matriz-de-funcionalidades-por-perfil)). La tabla describe las reglas definidas por el negocio; el detalle de cómo se otorga la recompensa se explica en el apartado [4.6](#46-programa-de-fidelidad).

**Reglas según el perfil**

| Acción | Cliente | Recepcionista | Gerente / Asistente |
|---|---|---|---|
| Consultar estado y seguimiento | ✔ Sus citas | ✔ De su sucursal | ✔ De sus sucursales |
| Registrar check-in | — | ✔ De su sucursal | ✔ De sus sucursales |
| Marcar inasistencia | — | ✔ De su sucursal | — |
| Registrar servicio sin cita | — | ✔ De su sucursal | ✔ De sus sucursales |
| Transiciones automáticas | Las reciben sus citas | Las reciben las citas de su sucursal | Las reciben las citas de sus sucursales |

### 4.3 Recordatorios automáticos

**Disponible para:** Cliente

El sistema envía a los clientes un aviso automático antes de cada cita para reducir las inasistencias. Los recordatorios llegan por **Telegram**, por lo que el cliente debe vincular antes su cuenta de la plataforma con la aplicación. El personal no interviene en el envío ni necesita configurar nada.

**Cuándo se envían**

Cada cita genera hasta **dos recordatorios**:

| Recordatorio | Se envía aproximadamente | Contenido |
|---|---|---|
| Primer aviso | **24 horas** antes de la cita | Saludo con el nombre del cliente, la anticipación (24 horas) y la fecha y hora de la cita |
| Segundo aviso | **4 horas** antes de la cita | Igual que el anterior, indicando 4 horas de anticipación |

El mensaje también recuerda que, si necesita reprogramar o cancelar, debe hacerlo desde la plataforma con anticipación (recuerde que el cliente solo puede modificar su cita con **8 horas o más** de aviso; ver [4.2.2](#422-consulta-edición-reprogramación-y-cancelación)).

El sistema revisa las citas próximas **cada 15 minutos**, por lo que el mensaje puede llegar con una diferencia de algunos minutos respecto a la hora exacta: el primer aviso llega entre unas 24 horas y 15 minutos y 23 horas y 30 minutos antes de la cita, y el segundo entre unas 4 horas y 15 minutos y 3 horas y 30 minutos antes.

**Qué citas generan recordatorio**

| Situación de la cita | ¿Genera recordatorio? |
|---|---|
| Cita **Agendada** o **Reagendada** de un cliente registrado | Sí |
| Cita **Reagendada** | Sí, con la **nueva** fecha y hora: los avisos se calculan sobre el horario vigente |
| Cita de un **visitante** (sin cuenta) | No: no hay datos de contacto asociados |
| **Servicio sin cita** (walk-in) | No: se atiende en el momento |
| Cita **Cancelada**, **Iniciada**, **Completada** o **Ausencia** | No |
| Cita agendada con **menos de 24 horas** de anticipación | No recibe el primer aviso, solo el segundo si todavía faltan unas 4 horas o más |
| Cita agendada con **menos de 4 horas** de anticipación | No recibe recordatorios |
| Cliente que **no ha vinculado** Telegram | No recibe el aviso; el sistema deja constancia de que no pudo enviarse |

**Cómo vincular Telegram (cliente)**

La vinculación se hace una sola vez desde la opción **Recordatorios** del menú del cliente:

1. Ingrese a **Recordatorios**. Si su cuenta aún no está vinculada, la pantalla muestra el título **Vincula tu cuenta** y un **código QR**.
2. Escanee el código con la cámara de su teléfono. Se abrirá la conversación con el bot de Mr. Barber en Telegram.
3. En Telegram, presione **Iniciar**. El bot responderá con un mensaje de confirmación que indica que la cuenta quedó vinculada y que recibirá avisos 24 y 4 horas antes de cada cita.
4. Regrese a la plataforma. La pantalla se actualiza al volver a la pestaña; si no lo hace, presione **Ya escaneé el código**.
5. Cuando la vinculación se completó, la pantalla muestra la etiqueta **Notificaciones Activas** y el mensaje **Telegram vinculado**.

📷 **[Apoyo visual pendiente — Figura 4.3-1: pantalla Recordatorios con el código QR para vincular]**

📷 **[Apoyo visual pendiente — Figura 4.3-2: pantalla Recordatorios con la cuenta vinculada]**

📷 **[Apoyo visual pendiente — Figura 4.3-3: mensaje de confirmación del bot y ejemplo de recordatorio recibido en Telegram]**

**Qué hace el personal**

- El personal **no** puede ver ni editar los recordatorios de un cliente, ni vincular Telegram a su nombre: la vinculación solo la hace el propio cliente, desde su cuenta.
- Si el cliente pregunta por qué no recibe avisos, el personal puede orientarlo con las tablas de esta sección y con los errores frecuentes que se muestran a continuación.
- Al agendar una cita para un cliente registrado, conviene recordarle que active **Recordatorios** en su cuenta (ver [5.2.2](#522-agendar-una-cita-personal)).

**Errores frecuentes y cómo resolverlos**

| Situación | Causa probable | Qué hacer |
|---|---|---|
| El QR no se muestra y queda en **Generando QR…** | La conexión es lenta o la aplicación no pudo generar el enlace | Recargue la página. Si persiste, informe a la gerencia |
| El bot responde **«El enlace de vinculación no es válido. Genera un nuevo código QR desde tu cuenta.»** | El enlace que se abrió está incompleto o se modificó | Vuelva a **Recordatorios** y escanee de nuevo el código QR de la pantalla |
| El bot responde **«No encontramos tu cuenta de cliente en el sistema.»** | La cuenta que inició sesión no es de un cliente registrado | Verifique que haya iniciado sesión con su cuenta de cliente y repita el escaneo |
| El bot responde **«Ocurrió un error al vincular tu cuenta. Intenta escanear el código nuevamente.»** | Falla temporal del sistema | Escanee el código otra vez en unos minutos |
| Al abrir el bot sin el código, este solo da la bienvenida y pide escanear el QR | Se entró al bot directamente, sin pasar por el QR | Entre a **Recordatorios** en la plataforma y escanee el código |
| La pantalla sigue mostrando el QR después de presionar **Iniciar** en Telegram | La pantalla aún no se actualiza | Presione **Ya escaneé el código** |
| La cuenta aparece vinculada, pero no llegó el recordatorio | La cita es de un visitante, un servicio sin cita o ya no está Agendada/Reagendada; o se agendó con muy poca anticipación (ver tabla anterior); o el cliente bloqueó el bot en Telegram | Revise el estado y la anticipación de la cita; pida al cliente verificar que no haya bloqueado el bot de Mr. Barber |

**Recomendaciones de uso**

- **Para el cliente:** vincule Telegram **antes** de agendar su primera cita; así recibirá desde el principio ambos avisos. Si la vincula con una cita ya agendada, solo recibirá los avisos cuyo horario todavía no haya pasado.
- Conserve la conversación con el bot de Mr. Barber y **no lo bloquee**; de lo contrario no podrá recibir los mensajes.
- Si recibe el recordatorio y ya **no podrá asistir**, cancele o reprograme su cita desde **Mis Citas** lo antes posible, recordando la regla de 8 horas.
- Al reprogramar, los avisos se calculan de nuevo con el nuevo horario; no es necesario hacer nada adicional.
- Los recordatorios son **informativos**: no confirman la cita ni sustituyen el registro de llegada del cliente (ver [4.2.3](#423-estado-y-progreso-de-la-cita)).

> **Nota:** el único canal de recordatorios es **Telegram**. El sistema **no envía** confirmación al agendar una cita ni avisos cuando una cita se edita o se cancela. Tampoco existe una opción para **desvincular** Telegram desde la plataforma.

### 4.4 Historial del cliente

**Disponible para:** Cliente

> **Perfil de personal (recepcionista y gerente/asistente):** la consulta del historial de un cliente mediante una **página dedicada** es una **funcionalidad en desarrollo** (ver [4.7](#47-funcionalidades-en-desarrollo)). Mientras tanto, el personal puede localizar las citas de un cliente buscándolo por nombre o correo y filtrando por fecha en el listado de **Citas** (ver [4.2.2](#422-consulta-edición-reprogramación-y-cancelación) y la nota 1 de [4.1](#41-panorama-y-matriz-de-funcionalidades-por-perfil)). Esta sección describe únicamente el historial que consulta el **cliente**.

El historial del cliente es el registro de **todas las citas ligadas a su cuenta**: las que ya se atendieron, las que no se concretaron y las que canceló. Se consulta en la opción **Mis Citas** del menú, que reúne en una sola pantalla las citas próximas y el historial. Las citas agendadas a nombre del cliente por la recepción o la gerencia también aparecen aquí, siempre que se hayan registrado como **cliente registrado** (las citas de visitantes no pertenecen a ninguna cuenta).

**Qué incluye el historial**

El historial se organiza en tres pestañas. Cada una muestra, junto a su nombre, el **número de citas** que contiene:

| Pestaña | Qué contiene |
|---|---|
| **Próximas citas** | Citas Agendadas, Reagendadas o Iniciadas cuyo horario aún no termina. No es parte del historial propiamente dicho, pero es la vista inicial de *Mis Citas*. |
| **Citas pasadas** | Citas **Completadas**, citas con estado **Ausencia** (no se presentó) y citas cuyo horario ya terminó. Es el historial de servicios recibidos. |
| **Citas canceladas** | Citas con estado **Cancelada**, ya sea que las haya cancelado el cliente o el personal. |

- **Periodo consultable:** *Mis Citas* muestra las citas de aproximadamente los **últimos 11 meses** y de los **próximos 30 días**. Las citas más antiguas no aparecen en el listado.
- **Orden:** en *Próximas citas*, la más cercana primero; en *Citas pasadas* y *Citas canceladas*, la más reciente primero. Puede invertirse el orden presionando el encabezado **Fecha de servicio**.
- **Páginas:** el listado muestra 8 citas por página y, al pie, el rango de citas visibles con los controles para cambiar de página.

**Datos que muestra cada cita en el listado**

| Columna | Contenido |
|---|---|
| **#** | Número de la cita dentro del listado (no es un identificador permanente). |
| **Fecha de servicio** | Fecha y horario de inicio y fin. |
| **Servicios** | Servicios de la cita. Una estrella indica que la cita **incluyó una recompensa** del programa de fidelidad (ver [4.6](#46-programa-de-fidelidad)). |
| **Barbero** | Barbero que atendió o atenderá la cita y su sucursal. |
| **Creada** | Fecha en que se agendó la cita. |
| **Estado** | Estado de la cita (ver [4.2.3](#423-estado-y-progreso-de-la-cita)). Si la cita fue un servicio sin cita, se acompaña de la etiqueta *Walk-in*. |

**Detalle de una cita del historial**

Al seleccionar una cita se abre su página de detalle, con su fecha, horario y duración, sucursal, barbero, servicios con su duración y precio vigentes al agendar, **total**, notas y el **seguimiento** (los eventos por los que pasó la cita, por ejemplo agendada, reagendada, check-in, completada o cancelada). Las citas pasadas y canceladas son de **solo consulta**: no ofrecen las opciones *Editar cita* ni *Cancelar cita*. Para regresar al listado se usa la opción **Mis Citas** del menú.

**Cómo encontrar una cita en el historial**

Presione el botón **Filtros** para abrir el panel. El cliente puede combinar:

- **Fecha de creación (desde / hasta):** cuándo se agendó la cita, en formato *dd/mm/aaaa*.
- **Servicio:** muestra solo las citas que incluyeron ese servicio. La lista contiene únicamente los servicios que el cliente ha agendado.

Los filtros se aplican de inmediato y el botón **Filtros** indica cuántos hay activos. **Restablecer filtros** los limpia. No hay filtros por fecha de servicio ni por estado, porque las pestañas ya separan las citas por situación.

📷 **[Apoyo visual pendiente — Figura 4.4-1: pantalla Mis Citas con las pestañas Próximas, Pasadas y Canceladas]**

📷 **[Apoyo visual pendiente — Figura 4.4-2: panel de filtros del historial]**

📷 **[Apoyo visual pendiente — Figura 4.4-3: detalle de una cita completada, con su seguimiento]**

**Aspectos a considerar**

- El historial muestra **solo las citas del cliente que inició sesión**; no puede consultar las de otras personas.
- Las citas de un servicio **sin cita** (*walk-in*) agendadas por el personal a nombre del cliente aparecen también en su historial.
- Si el cliente **elimina su cuenta**, **se pierde su historial de citas** y sus puntos de lealtad (así lo advierte la plataforma antes de confirmar). Elimine la cuenta solo si no necesita conservar esa información.
- El historial de **recomendaciones de corte** es independiente y se consulta en la opción **Recomendación de corte** (ver [4.5](#45-recomendación-personalizada-de-cortes)).

**Errores frecuentes y cómo resolverlos**

| Mensaje o situación | Causa probable | Qué hacer |
|---|---|---|
| **«No se pudieron cargar tus citas.»** | Falla temporal de conexión o del sistema | Presione **Reintentar**. Si persiste, recargue la página o intente más tarde |
| **«Aún no tienes citas pasadas.»** / **«No tienes citas canceladas.»** / **«No tienes citas próximas.»** | La pestaña no tiene citas | No es un error: indica que aún no hay citas en esa categoría |
| **«No hay citas que coincidan con los filtros.»** | Los filtros aplicados excluyen todas las citas | Presione **Restablecer filtros** o amplíe el rango de fechas |
| **«Usa el formato dd/mm/aaaa»** | La fecha de los filtros está incompleta o mal escrita | Escriba la fecha con día, mes y año (por ejemplo, 05/03/2026) |
| **«Debe ser posterior a la fecha inicial»** | La fecha *hasta* es anterior a la fecha *desde* | Corrija el rango |
| No aparece una cita antigua | Quedó fuera del periodo consultable (más de 11 meses) | No es posible consultarla desde *Mis Citas* |
| Falta una cita que el cliente recuerda | Se agendó como **visitante** o a nombre de otra cuenta | Verifique con la recepción a nombre de quién se registró |

**Recomendaciones de uso**

- Revise **Citas pasadas** para recordar qué servicios y con qué barbero se atendió; puede usarlo para repetir un servicio al agendar de nuevo.
- Consulte **Citas canceladas** si necesita confirmar que una cita quedó cancelada.
- Use el filtro por **Servicio** para ver cuántas veces ha agendado un servicio en particular.
- Si una cita no aparece donde espera, revise las **otras pestañas** y los **filtros activos** (el contador del botón *Filtros* lo indica).
- Para el procedimiento paso a paso, consulte [5.2.3](#523-consultar-y-filtrar-citas) y [5.5](#55-mi-perfil-e-historial-del-cliente).

### 4.5 Recomendación personalizada de cortes

**Disponible para:** Cliente

La plataforma sugiere al cliente cortes de cabello adecuados a su **estructura facial** y a sus **preferencias**, a partir de una fotografía de su rostro. Se utiliza desde la opción **Recomendación de corte** del menú del cliente. Es una **guía de apoyo**: la sugerencia no limita lo que el cliente puede reservar ni se vincula con la cita; el cliente decide qué servicio agendar, y puede comentarlo con su barbero.

**Cómo funciona**

1. **El cliente aporta una foto.** Puede **subir** una imagen de su dispositivo (también arrastrándola a la zona indicada) o **tomarla con la cámara**. Si ya generó una recomendación antes, puede **reutilizar la última foto** que subió.
2. **Opcionalmente describe lo que busca.** El campo **Preferencias** admite hasta **500 caracteres** (largo, estilo, mantenimiento, ocasión, etc.).
3. **El sistema analiza la foto.** La primera vez, identifica la **estructura facial** del cliente (por ejemplo, ovalada, redonda o cuadrada) y la guarda en su cuenta, de modo que no se vuelve a calcular en las siguientes solicitudes mientras no se cambie la foto.
4. **El sistema selecciona cortes del catálogo.** Solo se pueden recomendar **cortes registrados en el catálogo de la barbería** (ver [6.10](#610-estilos-y-cortes)); se consideran los que corresponden a la estructura facial del cliente y, si no hay ninguno, el resto de los cortes activos.
5. **Se muestra el resultado** en una ventana llamada **Tu recomendación** y se guarda en el historial del cliente.

**Qué incluye una recomendación**

| Elemento | Descripción |
|---|---|
| **Cortes sugeridos** | Uno o varios cortes del catálogo, mostrados como etiquetas. Los que tienen fotografía de referencia muestran un **ícono de ojo**; al presionarlos se despliega la imagen del corte. |
| **Sugerencia** | Texto que resume la recomendación. |
| **Por qué** | Explicación del motivo por el que se sugieren esos cortes. |
| **Confianza** | Porcentaje que indica qué tan seguro está el sistema de la sugerencia. Es un indicador orientativo. |

**Cuando ningún corte se ajusta**

Si ninguno de los cortes del catálogo se ajusta a las preferencias del cliente, el sistema no inventa uno: muestra el mensaje *«Ninguno de los cortes existentes parece ajustarse a tus preferencias, te sugerimos hablar directamente con tu barbero»* junto con el **Motivo**. En el historial, este resultado aparece como **Sin corte adecuado**. Esto no es un error: el cliente puede ajustar sus preferencias y volver a intentarlo, o comentar directamente su idea con el barbero.

**Historial de recomendaciones**

En la misma pantalla, el apartado **Recomendaciones anteriores** lista las recomendaciones del cliente, de la más reciente a la más antigua. Cada una muestra su **fecha** y los **cortes sugeridos** (o *Sin corte adecuado*). Al presionarla se expande para ver los cortes, la sugerencia, el **por qué** (o el **motivo**) y la **confianza**; desde ahí también pueden verse las fotos de referencia de los cortes. Solo se guardan las solicitudes que obtuvieron un resultado; las que fallan no aparecen. Si un corte fue retirado del catálogo con posterioridad, puede dejar de aparecer en recomendaciones anteriores.

**Requisitos de la foto**

- Debe ser una **imagen** (cualquier formato de imagen común) de **máximo 5 MB**.
- Se recomienda una foto **de frente, con buena iluminación y sin gorra ni lentes**, como indica la propia pantalla.
- La foto nueva **reemplaza** a la anterior: la plataforma conserva únicamente la última foto subida para poder reutilizarla.
- Al subir una foto nueva se vuelve a identificar la estructura facial.

**Quién puede usarla**

| Perfil | Acceso |
|---|---|
| **Cliente** | Puede generar recomendaciones y consultar las suyas. |
| **Recepcionista** y **Gerente / Asistente** | No cuentan con esta función; no aparece en su menú. |

📷 **[Apoyo visual pendiente — Figura 4.5-1: pantalla Recomendación de corte con el formulario y el historial]**

📷 **[Apoyo visual pendiente — Figura 4.5-2: ventana «Tu recomendación» con los cortes sugeridos]**

📷 **[Apoyo visual pendiente — Figura 4.5-3: resultado «Sin corte adecuado»]**

**Errores frecuentes y cómo resolverlos**

| Mensaje o situación | Causa probable | Qué hacer |
|---|---|---|
| **«Sube o toma una foto para continuar.»** | Se presionó *Obtener recomendación* sin foto | Presione **Subir foto** o **Usar cámara**, o marque **Usar la última foto subida** si está disponible |
| **«El archivo debe ser una imagen.»** | El archivo seleccionado no es una imagen | Elija un archivo de imagen |
| **«La imagen no debe pesar más de 5 MB.»** | La foto es demasiado grande | Use una foto de menor tamaño o reduzca su resolución |
| **«Permiso de cámara denegado. Habilítalo en tu navegador o sube una foto.»** | El navegador no tiene permiso para usar la cámara | Permita el acceso a la cámara en el navegador o suba una foto desde el dispositivo |
| **«No se encontró ninguna cámara en este dispositivo.»** | El dispositivo no tiene cámara | Suba una foto desde el dispositivo |
| **«La cámara está siendo usada por otra aplicación.»** | Otro programa ocupa la cámara | Cierre la otra aplicación e intente de nuevo |
| **«Tu navegador no permite usar la cámara. Sube una foto en su lugar.»** | Navegador sin soporte de cámara | Suba una foto desde el dispositivo |
| **«No pudimos usar tu última foto. Sube o toma una nueva para continuar.»** | La foto guardada ya no puede utilizarse | Suba o tome una foto nueva |
| **«No se pudo generar la recomendación. Intenta de nuevo.»** | Falla temporal del servicio de recomendación, de la conexión, o la foto no pudo procesarse | Intente de nuevo en unos minutos; si persiste, use otra foto con mejor iluminación y de frente |
| **«No se pudo cargar el historial. Intenta de nuevo.»** | Falla temporal al consultar el historial | Recargue la página |
| **«Aún no has generado ninguna recomendación. Sube una foto para obtener la primera.»** | El cliente no tiene recomendaciones | No es un error: genere la primera |

**Recomendaciones de uso**

- Use una foto **de frente, con el rostro despejado, buena luz** y sin gorra ni lentes: de ello depende que el sistema identifique correctamente su estructura facial.
- Si ya subió una foto que le parece adecuada, use **Usar la última foto subida** para agilizar nuevas consultas. Si cambió mucho su aspecto (por ejemplo, el largo del cabello o la barba), suba una foto nueva.
- Escriba **preferencias concretas** (largo deseado, tiempo que desea dedicarle al peinado, ocasión) para obtener sugerencias más útiles; puede dejarlas en blanco.
- Considere la recomendación como una **orientación**, no como una indicación obligatoria: confírmela con su barbero antes o durante la cita.
- Revise **Recomendaciones anteriores** para volver a ver un corte que le interesó y mencionárselo al barbero.
- Para ver el procedimiento paso a paso, consulte [5.3](#53-obtener-una-recomendación-de-corte).

### 4.6 Programa de fidelidad

**Disponible para:** Cliente (consulta de avance) · Recepcionista y Gerente/Asistente (consulta del conteo y aplicación en la cita)

El programa de fidelidad premia la constancia de los **clientes registrados**: al completar **6 citas**, la **siguiente cita que agenden incluye un servicio gratis**. El cliente no solicita, elige ni confirma nada: la recompensa se aplica **automáticamente**.

> **Estado de la funcionalidad:** el programa de fidelidad se encuentra **en implementación** (ver [4.1](#41-panorama-y-matriz-de-funcionalidades-por-perfil)). Este apartado describe las reglas definidas por el negocio. Hoy la plataforma ya distingue las citas con recompensa mediante la etiqueta **Recompensa otorgada** y muestra al personal el número de servicios completados de cada cliente. La consulta del avance por parte del cliente, la aplicación automática al agendar y la visualización de cuál servicio es gratuito y cuánto queda por pagar se están incorporando.

**Cómo funciona**

1. **Se acumulan citas completadas.** Cada cita que llega al estado **Completada** suma **1** al conteo del cliente, sin importar cuántos servicios incluyó ni cuánto costaron.
2. **Se alcanza la meta.** Cuando el conteo llega a **6**, el cliente tiene una recompensa disponible.
3. **Se aplica al agendar.** La **siguiente cita que se agende** para ese cliente nace como cita con recompensa y el sistema la marca con la etiqueta **Recompensa otorgada**. Da igual quién la agende: el propio cliente, o la recepción o la gerencia a su nombre, incluido un servicio sin cita.
4. **Se usa la recompensa.** Al completarse esa cita, se **restan 6** al conteo y se conserva cualquier avance adicional.

**Qué cubre la recompensa**

- La recompensa cubre **un solo servicio: el más barato de la cita**.
- Si la cita tiene **un solo servicio**, ese servicio es gratis y, por tanto, **toda la cita es gratis**.
- Si la cita tiene **varios servicios**, el cliente paga todos menos el más barato. Si dos servicios empatan en el precio más bajo, el descuento es el mismo sin importar cuál se considere gratuito.
- Los precios del catálogo no se modifican: la cita conserva los precios reales y solo se identifica cuál servicio es gratuito.
- Si se **modifican los servicios** de una cita con recompensa, el servicio gratuito se **recalcula**: siempre es el más barato de los servicios con que la cita termine.
- La plataforma **no cobra ni gestiona pagos**: el pago se realiza en persona en la barbería, por lo que el personal debe cobrar considerando el servicio gratuito.

**Reglas importantes**

| Regla | Detalle |
|---|---|
| **Solo clientes registrados** | Las citas de visitantes (clientes sin cuenta) **no suman** al conteo ni reciben recompensa. |
| **Automática y obligatoria** | No se puede elegir ni rechazar. Se aplica a la primera cita que se agenda una vez alcanzada la meta. |
| **Una recompensa abierta a la vez** | Mientras el cliente tenga una cita con recompensa **Agendada, Reagendada o Iniciada**, cualquier otra cita que agende es una cita normal. |
| **Se evalúa al agendar** | La recompensa se decide en el momento de crear la cita y **no es retroactiva**: las citas agendadas antes de llegar a 6 se mantienen como citas normales, aunque se completen después. Editar una cita nunca agrega ni quita la recompensa. |
| **No caduca** | La recompensa no tiene fecha de vencimiento. |
| **Válida en cualquier sucursal** | El conteo es global: se acumula y se usa en cualquier sucursal, con cualquier barbero. |
| **Sin promociones combinables** | No existen otras promociones con las que se pueda combinar. |
| **El personal no la activa** | La recepción y la gerencia no necesitan hacer nada para aplicarla ni pueden quitarla o asignarla manualmente. |

**Qué pasa según cómo termine la cita con recompensa**

| Resultado de la cita | Efecto en la recompensa y en el conteo |
|---|---|
| **Completada** | Se usa la recompensa y se **restan 6** al conteo. Si había avance adicional, se conserva. |
| **Cancelada** (por el cliente o por el personal) | La recompensa **no se pierde**: el cliente la conserva y se aplica automáticamente en la siguiente cita que agende. El conteo no cambia. |
| **Ausencia** (el cliente no se presentó) | El cliente **pierde la recompensa** y su conteo **vuelve a cero**, incluido el avance adicional. Es una regla intencional, para incentivar la asistencia. |

**Ejemplos**

| Situación | Resultado |
|---|---|
| El cliente tiene 5 citas completadas y agenda otra | Cita normal. Al completarla, el conteo pasa a 6. |
| El cliente tiene 6 y agenda | La cita lleva la etiqueta **Recompensa otorgada**. Al completarla, el conteo queda en **0**. |
| El cliente tiene 8 y agenda | Cita con recompensa. Al completarla, el conteo queda en **2** (8 − 6). |
| El cliente tiene 12 y completa su cita con recompensa | El conteo queda en **6**, por lo que su siguiente cita vuelve a incluir la recompensa. |
| El cliente tiene 6, agenda y luego cancela | Conserva la recompensa; la siguiente cita que agende la incluirá. |
| El cliente tiene 8, agenda con recompensa y no se presenta | Pierde la recompensa y el conteo queda en **0**. |
| Una cita de un visitante se completa | No cambia ningún conteo. |

**Qué ve cada perfil**

| Perfil | Qué puede hacer |
|---|---|
| **Cliente** | Agendar con normalidad; la recompensa se aplica sola cuando corresponde. Reconoce una cita con recompensa por la etiqueta **Recompensa otorgada** en su detalle. Su consulta de avance (cuántas citas lleva y cuántas le faltan) se encuentra en implementación. |
| **Recepcionista** | Ve el número de servicios completados de cada cliente en la columna **Servicios** de la lista de **Clientes**. Al agendar a nombre de un cliente registrado, la recompensa se aplica sola. Puede marcar *Ausencia* manualmente. |
| **Gerente / Asistente** | Igual que la recepción respecto a la consulta del conteo y la aplicación de la recompensa, en las sucursales a su cargo. |

📷 **[Apoyo visual pendiente — Figura 4.6-1: etiqueta «Recompensa otorgada» en el detalle de una cita]**

📷 **[Apoyo visual pendiente — Figura 4.6-2: columna «Servicios» en la lista de Clientes del personal]**

**Mensajes del sistema relacionados**

| Mensaje | Dónde aparece | Qué significa |
|---|---|---|
| **Recompensa otorgada** | Detalle y listado de citas | La cita incluye el servicio gratis del programa de fidelidad. |
| «El cliente conserva su recompensa y podrá usarla en otra cita.» | Al cancelar una cita con recompensa (personal) | La cancelación no hace perder la recompensa. |
| «Conservas tu recompensa y podrás usarla en otra cita.» | Al cancelar una cita con recompensa (cliente) | Igual que el anterior, visto por el cliente. |
| «Al confirmar, el cliente perderá la recompensa y su contador de lealtad se reiniciará.» | Al marcar inasistencia en una cita con recompensa | Advierte que la ausencia hace perder la recompensa y todo el avance. |

**Recomendaciones de uso**

- **Para el cliente:** si no podrá asistir a una cita con recompensa, **cancélela con anticipación** (8 horas o más) en lugar de faltar: al cancelar conserva la recompensa; al no presentarse la pierde junto con todo su avance.
- **Para el cliente:** si tiene una cita con recompensa abierta, las demás citas que agende serán normales hasta que esa se complete.
- **Para el personal:** antes de marcar *Ausencia* en una cita con recompensa, confirme que el cliente realmente no se presentó, porque la acción no puede revertirse y hace perder la recompensa y el avance.
- **Para el personal:** al agendar a nombre de un cliente, selecciónelo como **cliente registrado**; con un visitante no hay conteo ni recompensa (ver [4.2.1](#421-programación-de-citas)).
- **Para el personal:** si cambia los servicios de una cita con recompensa, recuerde que el servicio gratuito pasa a ser el más barato de la nueva selección; informe al cliente para que el cobro en la barbería sea el correcto.

Para ver cómo agendar una cita, consulte [5.2.1](#521-agendar-una-cita-cliente) y [5.2.2](#522-agendar-una-cita-personal); para la consulta del avance, el apartado [5.6](#56-programa-de-fidelidad).

### 4.7 Funcionalidades en desarrollo

Funcionalidades contempladas que aún no están disponibles en el sistema:

- Gestión de niveles de stock mínimo de insumos.
- Control de movimientos de inventario (entradas y salidas).
- Generación de reportes administrativos.
- Página dedicada al historial del cliente para el personal (recepcionista y gerente/asistente); ver [4.4](#44-historial-del-cliente).

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

**Perfil:** Cliente. Para conocer las reglas que rigen la programación (disponibilidad, anticipación, duración), consulte el apartado [4.2.1](#421-programación-de-citas).

> 📷 **[Apoyo visual pendiente — Figura 5.2.1-A]** Pantalla *Agendar Cita* del cliente al ingresar: formulario con los campos *Sucursal* y *Servicio*, y el mensaje *«Selecciona una sucursal y al menos un servicio para ver la disponibilidad»*.

**Procedimiento**

1. En el menú de navegación, presione **Agendar Cita**. En teléfonos y tabletas, abra primero el menú ☰.
2. En **Sucursal**, abra la lista y seleccione el local donde desea ser atendido.
3. En **Servicio**, seleccione el servicio que desea. Cada opción muestra su nombre, su duración y su precio (con el formato *nombre · duración · precio*).
4. Si desea más de un servicio, presione **Añadir otro servicio** y elija el siguiente. Repita para cada servicio adicional.
   - El botón *Añadir otro servicio* se habilita hasta que el servicio anterior haya sido elegido.
   - Un servicio ya elegido no se vuelve a ofrecer en las demás filas.
   - Para quitar un servicio adicional, presione la **X** que aparece a la derecha de su fila.
5. Al elegir la sucursal y al menos un servicio, aparece el **calendario de disponibilidad**. Los días se muestran con los siguientes colores:

   | Indicador | Significado |
   |---|---|
   | **Disponible** (turquesa) | El día tiene horarios libres; puede seleccionarlo. |
   | **No disponible** (rosa) | El día ya no tiene horarios libres para los servicios elegidos. |
   | **Día inhábil / pasado** (rayado) | Días anteriores a hoy, días con más de 30 días de anticipación y domingos. No se pueden seleccionar. |
   | **Seleccionado** (dorado) | El día que eligió. |

   Use las flechas **Mes anterior** y **Mes siguiente** para cambiar de mes.

6. Presione un día **disponible**. Se abrirá la ventana **Horarios disponibles** con la fecha elegida.
7. Los horarios aparecen agrupados por barbero. Presione el nombre de un barbero para **desplegar** sus horarios (junto a su nombre se indica cuántos tiene libres).
8. Presione la hora que prefiera; quedará resaltada.
9. Presione **Seleccionar horario**. La ventana se cierra y los datos se reflejan en el panel **Información de la cita**.
10. Revise el panel **Información de la cita**: sucursal, fecha, horario con el nombre del barbero, servicios elegidos, **precio total** y **duración total**.
11. Presione **Agendar Cita**. El botón se habilita solo cuando ya eligió sucursal, servicio y horario.
12. Si todo es correcto, el sistema muestra el aviso **«Cita agendada correctamente»** y lo lleva a **Mis Citas**, donde podrá ver la nueva cita con estado *Agendada*.

> 📷 **[Apoyo visual pendiente — Figura 5.2.1-B]** Calendario de disponibilidad con la leyenda de colores y el día seleccionado.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.1-C]** Ventana *Horarios disponibles* con un barbero desplegado y un horario seleccionado.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.1-D]** Panel *Información de la cita* completo y botón *Agendar Cita*; aviso de confirmación en *Mis Citas*.

**Cómo hacer cambios antes de confirmar**

- Si cambia la **sucursal** o modifica los **servicios**, la fecha y el horario elegidos se descartan, porque la disponibilidad depende de ambos datos. Vuelva a elegir el día y el horario.
- Para elegir otro horario, presione de nuevo el día en el calendario.
- El botón **Cancelar** deja el formulario como al entrar a la pantalla (sin sucursal, servicio, fecha ni horario). No cancela ninguna cita ya agendada.

**Errores frecuentes y cómo resolverlos**

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *Selecciona una sucursal y al menos un servicio para ver la disponibilidad.* | Aún no se elige sucursal o servicio, por lo que no se muestra el calendario. | Elija ambos datos. |
| El botón **Agendar Cita** aparece deshabilitado. | Falta sucursal, servicio u horario confirmado. | Complete los datos que falten. Recuerde presionar **Seleccionar horario** después de elegir la hora. |
| El día no se puede seleccionar. | Es un día pasado, domingo, está fuera de los 30 días de anticipación, o ya no tiene horarios libres (rosa). | Elija otro día disponible (turquesa). |
| *No hay horarios disponibles para esta fecha. Prueba con otro día.* | El día se llenó mientras revisaba el calendario. | Cierre la ventana y elija otro día. |
| *No se pudieron cargar los horarios disponibles. Intenta de nuevo.* | Falla de conexión o del servidor al consultar la disponibilidad. | Verifique su conexión a internet, cierre la ventana y vuelva a presionar el día. |
| *El horario seleccionado ya no está disponible. Elige otro.* | Otra persona reservó ese horario antes de que usted confirmara. | La ventana de horarios se reabre ya actualizada; elija otro horario y confirme de nuevo. |
| *La sucursal o el servicio seleccionado no existe.* | La sucursal o el servicio fue dado de baja mientras usted agendaba. | Recargue la página y vuelva a elegir. |
| *No se pudo agendar la cita. Intenta de nuevo.* | Error inesperado o falla de conexión. | Revise su conexión e intente de nuevo. Antes de repetir, consulte **Mis Citas** para confirmar que la cita no se haya creado. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)) y repita el procedimiento. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Elija primero los servicios y después el día.** Los horarios dependen de la duración total; un servicio adicional puede eliminar horarios que antes aparecían.
- **Revise la duración total** en el panel de resumen para planear su tiempo en la barbería.
- **Reserve con anticipación**: los horarios libres de un día disminuyen conforme otros clientes reservan. Puede agendar hasta con 30 días de anticipación.
- **Confirme en Mis Citas** que su cita aparece con estado *Agendada* antes de cerrar la sesión.
- Si no puede asistir, **cancele o reprograme con al menos 8 horas de anticipación**: después de ese plazo el cliente ya no puede modificar la cita por sí mismo (ver [5.2.4](#524-editar-o-reprogramar-una-cita) y [5.2.5](#525-cancelar-una-cita)).
- Recuerde que el **pago se realiza en la barbería**; el sistema no cobra al agendar.

#### 5.2.2 Agendar una cita (personal)

**Perfil:** Recepcionista · Gerente/Asistente. Para conocer las reglas que rigen la programación, consulte el apartado [4.2.1](#421-programación-de-citas). Este procedimiento es el mismo que el del cliente ([5.2.1](#521-agendar-una-cita-cliente)), con un paso adicional: **indicar a nombre de quién se agenda la cita**.

> 📷 **[Apoyo visual pendiente — Figura 5.2.2-A]** Pantalla *Agendar Cita* del personal, con los botones *Cliente registrado* y *Visitante* bajo la sección *Cliente*.

**Procedimiento**

1. En el menú de navegación, presione **Agendar Cita**.
2. En **Sucursal**, seleccione el local:
   - El **recepcionista** solo puede agendar en **su sucursal**, que aparece ya seleccionada.
   - El **gerente o asistente** puede elegir cualquiera de las **sucursales a su cargo**.
3. En **Servicio**, seleccione el servicio solicitado por el cliente. Si requiere más de uno, use **Añadir otro servicio** (y la **X** para quitar uno), igual que en el procedimiento del cliente.
4. En la sección **Cliente**, elija el tipo de cliente presionando uno de los dos botones:

   **Opción A — Cliente registrado**

   1. Presione **Cliente registrado**.
   2. En **Buscar cliente**, escriba el nombre, apellido o correo electrónico. Los resultados se actualizan mientras escribe.
   3. Presione el cliente correcto en la lista de resultados (se muestran su nombre completo y su correo). Quedará indicado en **Cliente seleccionado**.
   4. Si eligió a la persona equivocada, presione la **X** de *Cliente seleccionado* para deseleccionarla y volver a buscar.

   **Opción B — Visitante** (persona sin cuenta)

   1. Presione **Visitante**.
   2. En **Nombre del visitante**, escriba el nombre completo (máximo 100 caracteres).

   > Al cambiar de una opción a otra, lo escrito en la opción anterior se borra para no mezclar datos.

5. Con la sucursal y los servicios elegidos, aparece el **calendario de disponibilidad**. Presione un día **disponible** (turquesa).
6. En la ventana **Horarios disponibles**, despliegue al barbero que atenderá, presione la hora deseada y presione **Seleccionar horario**.
7. Revise el panel **Información de la cita**: ahora incluye el **cliente** (si es visitante se muestra con la leyenda *(visitante)*), la sucursal, la fecha, el horario con el barbero, los servicios, el precio total y la duración total.
8. Presione **Agendar Cita**. El botón se habilita únicamente cuando están completos el cliente, la sucursal, los servicios y el horario.
9. El sistema muestra **«Cita agendada correctamente»** y lo lleva al listado **Citas**, donde la nueva cita aparece con estado *Agendada*.

> 📷 **[Apoyo visual pendiente — Figura 5.2.2-B]** Búsqueda de un cliente registrado: campo *Buscar cliente*, lista de resultados y cliente seleccionado.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.2-C]** Opción *Visitante* con el campo *Nombre del visitante*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.2-D]** Panel *Información de la cita* con el cliente indicado y aviso de confirmación en *Citas*.

**Cómo hacer cambios antes de confirmar**

- Si cambia la **sucursal** o los **servicios**, se descartan la fecha y el horario elegidos; el cliente indicado se conserva.
- El botón **Cancelar** limpia todo el formulario, incluido el cliente. No cancela ninguna cita ya agendada.
- Una vez creada la cita, **no se puede cambiar el cliente ni la sucursal**. Si se equivocó, cancele la cita (ver [5.2.5](#525-cancelar-una-cita)) y agende una nueva.

**Errores frecuentes y cómo resolverlos**

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| El botón **Agendar Cita** aparece deshabilitado. | Falta indicar el cliente (o no se eligió un tipo de cliente), la sucursal, el servicio o el horario. | Elija *Cliente registrado* o *Visitante* y complete los datos que falten. Recuerde presionar **Seleccionar horario**. |
| *No se encontraron clientes.* | Ningún cliente coincide con lo escrito. | Revise la ortografía, pruebe solo con el apellido o con el correo. Si el cliente no tiene cuenta, use la opción **Visitante**. |
| *No se pudo buscar clientes. Intenta de nuevo.* | Falla de conexión o del servidor al buscar. | Verifique la conexión y vuelva a escribir la búsqueda. |
| No aparece la sucursal que se busca. | El recepcionista solo ve su propia sucursal; el gerente, solo las que tiene a su cargo. | Si la sucursal es correcta y no aparece, contacte al gerente o a soporte (sección [7](#7-soporte-técnico)). |
| *El horario seleccionado ya no está disponible. Elige otro.* | Otra persona reservó ese horario durante la captura. | La ventana de horarios se reabre actualizada; elija otro horario y confirme de nuevo. |
| *No hay horarios disponibles para esta fecha. Prueba con otro día.* | El día se llenó. | Elija otro día o ajuste los servicios solicitados. |
| *No se pudieron cargar los horarios disponibles. Intenta de nuevo.* | Falla de conexión o del servidor. | Verifique la conexión, cierre la ventana y vuelva a presionar el día. |
| *No se pudo agendar la cita. Intenta de nuevo.* | Error inesperado o falla de conexión. | Revise la conexión e intente de nuevo. Antes de repetir, consulte **Citas** para confirmar que no se haya creado. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)) y repita el procedimiento. |

**Recomendaciones de uso**

- **Prefiera «Cliente registrado»** siempre que el cliente tenga cuenta: solo así la cita suma al programa de fidelidad, aparece en su historial y genera recordatorios. Si el cliente aún no tiene cuenta, puede invitarlo a registrarse (ver [3.2](#32-registro-de-un-cliente-nuevo)) y **luego** agendar a su nombre.
- **Recuerde al cliente que active sus recordatorios:** para recibirlos debe vincular Telegram desde la opción **Recordatorios** de su cuenta (ver [4.3](#43-recordatorios-automáticos)).
- **Use «Visitante» solo para personas sin cuenta.** Registre el nombre completo, pues será el único dato de identificación de la cita; una cita de visitante no puede convertirse después en la de un cliente registrado.
- **Verifique al cliente correcto** antes de confirmar: dos personas pueden compartir nombre, así que apóyese en el correo que se muestra en la lista.
- **Confirme los servicios con el cliente** antes de elegir el horario: agregar o quitar servicios después descarta el horario ya seleccionado.
- **Revise la duración total** en el resumen y comuníquela al cliente.
- Si el cliente llega **sin cita**, no utilice este procedimiento; presione **Registrar servicio sin cita**, en la parte superior de esta misma pantalla, y siga el procedimiento del apartado [5.2.7](#527-registrar-un-servicio-sin-cita).
- Recuerde al cliente que el **pago se realiza en la barbería**.

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
