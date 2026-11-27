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
   - 5.5 [Mi perfil](#55-mi-perfil)
   - 5.6 [Historial del cliente](#56-historial-del-cliente)
   - 5.7 [Programa de fidelidad](#57-programa-de-fidelidad)
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
- Para la función de recomendación de cortes, el navegador debe permitir **seleccionar un archivo de imagen** del dispositivo (formato JPG, PNG o WEBP, hasta **5 MB**).
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

Si olvidó su contraseña, contacte a soporte técnico (sección [7](#7-soporte-técnico)) indicando el correo con el que está registrado. Si tiene una sesión abierta y solo desea cambiarla, un cliente puede hacerlo desde **Mi Perfil** (opción de cambio de contraseña), **sin necesidad de ingresar su contraseña actual** (ver [5.5](#55-mi-perfil)).

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
| Fecha y hora | Sí, excepto en servicios sin cita | Dentro del periodo de reprogramación (ver más adelante). |
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
- En los **servicios sin cita** (*walk-in*), la **fecha y la hora no pueden modificarse**. Antes de la hora de inicio solo pueden cambiarse el barbero, los servicios y las notas, siempre que haya disponibilidad en el mismo horario.
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
- Se crean como una cita *Agendada*. Mientras no llegue su hora de inicio pueden cancelarse y se pueden editar el barbero, los servicios y las notas; la **fecha y la hora no pueden modificarse**.
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
| Cita agendada o reprogramada con **menos de 23 horas y 30 minutos** de anticipación | No recibe el primer aviso; solo puede recibir el segundo, si todavía faltan al menos 3 horas y 30 minutos |
| Cita agendada o reprogramada con **menos de 3 horas y 30 minutos** de anticipación | No recibe recordatorios |
| Cliente que **no ha vinculado** Telegram | No recibe el aviso; el sistema deja constancia de que no pudo enviarse |

> **Avisos no garantizados:** hay un margen de **15 minutos por encima de cada límite** en el que el aviso puede llegar o no, según el momento en que el sistema realice su siguiente revisión:
>
> - **Aviso de 24 horas:** si al agendar o reprogramar faltan entre **23 horas y 30 minutos** y **23 horas y 45 minutos**.
> - **Aviso de 4 horas:** si al agendar o reprogramar faltan entre **3 horas y 30 minutos** y **3 horas y 45 minutos**.

**Cómo vincular Telegram (cliente)**

La vinculación se hace una sola vez desde la opción **Recordatorios** del menú del cliente:

1. Ingrese a **Recordatorios**. Si su cuenta aún no está vinculada, la pantalla muestra el título **Vincula tu cuenta** y un **código QR**.
2. Escanee el código con la cámara de su teléfono. Se abrirá la conversación con el bot de Mr. Barber en Telegram.
3. En Telegram, presione **Iniciar**. El bot responderá con un mensaje de confirmación que indica que la cuenta quedó vinculada y que recibirá avisos 24 y 4 horas antes de cada cita.
4. Regrese a la plataforma. La pantalla se actualiza al volver a la pestaña; si no lo hace, presione **Ya escanee el código**.
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
| El QR no se muestra y queda en **Generando QR…** | La plataforma no pudo generar el código | Recargue la página. Si persiste, informe a la gerencia |
| El bot responde **«El enlace de vinculación no es válido. Genera un nuevo código QR desde tu cuenta.»** | El enlace que se abrió está incompleto o se modificó | Vuelva a **Recordatorios** y escanee de nuevo el código QR de la pantalla |
| El bot responde **«No encontramos tu cuenta de cliente en el sistema.»** | La cuenta que inició sesión no es de un cliente registrado | Verifique que haya iniciado sesión con su cuenta de cliente y repita el escaneo |
| El bot responde **«Ocurrió un error al vincular tu cuenta. Intenta escanear el código nuevamente.»** | Falla temporal del sistema | Escanee el código otra vez en unos minutos |
| Al abrir el bot sin el código, este solo da la bienvenida y pide escanear el QR | Se entró al bot directamente, sin pasar por el QR | Entre a **Recordatorios** en la plataforma y escanee el código |
| La pantalla sigue mostrando el QR después de presionar **Iniciar** en Telegram | La pantalla aún no se actualiza | Presione **Ya escanee el código** |
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
- Para el procedimiento paso a paso, consulte [5.2.3](#523-consultar-y-filtrar-citas) y [5.6](#56-historial-del-cliente).

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
| **Recomendación** | Texto que resume la sugerencia. |
| **Por qué** | Explicación del motivo por el que se sugieren esos cortes. |
| **Confianza** | Porcentaje que indica qué tan seguro está el sistema de la sugerencia. Es un indicador orientativo. |

**Cuando ningún corte se ajusta**

Si ninguno de los cortes del catálogo se ajusta a las preferencias del cliente, el sistema no inventa uno: muestra el mensaje *«Ninguno de los cortes existentes parece ajustarse a tus preferencias, te sugerimos hablar directamente con tu barbero»* junto con el **Motivo**. En el historial, este resultado aparece como **Sin corte adecuado**. Esto no es un error: el cliente puede ajustar sus preferencias y volver a intentarlo, o comentar directamente su idea con el barbero.

**Historial de recomendaciones**

En la misma pantalla, el apartado **Recomendaciones anteriores** lista las recomendaciones del cliente, de la más reciente a la más antigua. Cada una muestra su **fecha** y los **cortes sugeridos** (o *Sin corte adecuado*). Al presionarla se expande para ver los cortes, la sugerencia, el **por qué** (o el **motivo**) y la **confianza**; desde ahí también pueden verse las fotos de referencia de los cortes. Solo se guardan las solicitudes que obtuvieron un resultado; las que fallan no aparecen. Si un corte fue retirado del catálogo con posterioridad, puede dejar de aparecer en recomendaciones anteriores.

**Requisitos de la foto**

- Debe ser una imagen en formato **JPG (JPEG), PNG o WEBP**, de **máximo 5 MB**.
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
| **«El archivo debe ser una imagen.»** | El archivo seleccionado no es una imagen | Elija una imagen JPG (JPEG), PNG o WEBP |
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

Para ver cómo agendar una cita, consulte [5.2.1](#521-agendar-una-cita-cliente) y [5.2.2](#522-agendar-una-cita-personal); para la consulta del avance, el apartado [5.7](#57-programa-de-fidelidad).

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
Cada procedimiento (5.2.x a 5.7) incluye, dentro de su propia subsección y sin encabezados dedicados:
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

**Perfil:** Cliente · Recepcionista · Gerente/Asistente. Para conocer qué citas ve cada perfil y las reglas de consulta, consulte los apartados [4.2.2](#422-consulta-edición-reprogramación-y-cancelación) y [4.4](#44-historial-del-cliente). El procedimiento del **cliente** (*Mis Citas*) y el del **personal** (*Citas*) son distintos, por lo que se explican por separado.

---

**A. Cliente: consultar mis citas**

> 📷 **[Apoyo visual pendiente — Figura 5.2.3-A]** Pantalla *Mis citas* con las pestañas *Próximas citas*, *Citas pasadas* y *Citas canceladas*, el botón *Filtros* y la tabla de citas.

**Procedimiento**

1. En el menú de navegación, presione **Mis Citas**. En teléfonos y tabletas, abra primero el menú ☰.
2. Se muestra la pestaña **Próximas citas**. Elija la pestaña que desea consultar:
   - **Próximas citas:** citas Agendadas, Reagendadas o Iniciadas que aún no terminan.
   - **Citas pasadas:** citas Completadas, con *Ausencia* o cuyo horario ya terminó.
   - **Citas canceladas:** citas con estado *Cancelada*.

   Junto al nombre de cada pestaña se muestra cuántas citas contiene.
3. Revise la tabla. Cada fila muestra el número de la cita (**#**), la **fecha de servicio** con su horario, los **servicios**, el **barbero** con su sucursal, la fecha en que se **creó** la cita y su **estado**. Una **estrella** junto a los servicios indica que la cita incluyó una recompensa del programa de fidelidad.
4. Para cambiar el orden, presione el encabezado **Fecha de servicio**: alterna entre la más antigua primero y la más reciente primero.
5. Si hay más de 8 citas en la pestaña, use los controles de **Página anterior**, los números de página y **Página siguiente**, al pie de la tabla. El texto *«Mostrando 1 - 8 de N citas.»* indica qué parte del listado está viendo.
6. Para ver el detalle de una cita, **presione su fila**. Se abre la página **Detalle de la cita** con el estado, la fecha, el horario y la duración, la sucursal, el barbero, los servicios con su precio, el total, las notas y el **seguimiento** de la cita.
7. Para regresar al listado, presione **Volver a mis citas**.

**Cómo filtrar las citas**

1. Presione el botón **Filtros**, a la derecha de las pestañas. Se despliega el panel de filtros.
2. Use uno o más de los filtros disponibles:
   - **Fecha de creación (desde)** y **(hasta):** escriba la fecha en formato **dd/mm/aaaa** (por ejemplo, 05/03/2026). Se muestran las citas que se agendaron dentro de ese rango.
   - **Servicio:** elija un servicio de la lista para ver solo las citas que lo incluyeron.
3. Los filtros se aplican **de inmediato**, sin botón de confirmación. El número en el botón **Filtros** indica cuántos filtros están activos, y los contadores de las pestañas se actualizan.
4. Para quitar todos los filtros, presione **Restablecer filtros**.

> 📷 **[Apoyo visual pendiente — Figura 5.2.3-B]** Panel *Filtros* del cliente con los campos *Fecha de creación* y *Servicio*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.3-C]** Página *Detalle de la cita* del cliente, con el seguimiento de la cita.

---

**B. Personal: consultar y filtrar las citas**

> 📷 **[Apoyo visual pendiente — Figura 5.2.3-D]** Pantalla *Citas* del personal con la barra de búsqueda, el botón *Filtros* y la tabla de citas.

**Procedimiento**

1. En el menú de navegación, presione **Citas**.
2. Se muestra el listado de citas con su **fecha de servicio**, **cliente** (con su correo; los visitantes se identifican con la etiqueta *Visitante*), **servicios**, **barbero** con su sucursal, fecha de **creación** y **estado**. Las citas de servicios sin cita incluyen la etiqueta *Walk-in*. Si el cliente tiene una recompensa, aparece una estrella junto a los servicios.
   - El **recepcionista** ve solo las citas de **su sucursal**.
   - El **gerente o asistente** ve las citas de **todas las sucursales a su cargo**.
3. Mientras no indique fechas, el listado muestra las citas **de hoy a los próximos 30 días**. Para consultar otro periodo, use los filtros de **fecha de servicio** (ver más abajo).
4. Para ubicar a un cliente, escriba su **nombre o correo electrónico** en la barra **Buscar por nombre o correo del cliente…**. La búsqueda se aplica de inmediato y no distingue mayúsculas ni acentos (escribir «jose» encuentra «José»).
5. Para ordenar el listado, presione el encabezado **Fecha de servicio**. Por defecto aparece primero la cita más cercana.
6. El listado se divide en páginas de **10 citas**. Use **Página anterior**, los números de página y **Página siguiente**. El texto *«Mostrando 1 - 10 de N citas.»* indica qué parte está viendo.
7. Para ver el detalle de una cita, **presione su fila**. Se abre la ventana **Detalle de la cita** con la fecha, el horario y la duración, la sucursal, el barbero, el cliente, el total, los servicios con su precio y duración, el **seguimiento** y las notas. Desde ahí, según el estado y la hora de la cita, el personal puede usar las acciones **Check-in**, **Marcar inasistencia** (solo la recepción), **Editar cita** y **Cancelar cita** (ver [5.2.4](#524-editar-o-reprogramar-una-cita), [5.2.5](#525-cancelar-una-cita) y [5.2.6](#526-registrar-la-llegada-del-cliente-check-in)). Para cerrar la ventana, presione la **X**, haga clic fuera de ella o presione la tecla **Esc**.
8. En la columna **Acciones** del listado aparece el botón **Check-in** de las citas que están dentro de su ventana de registro (de 15 minutos antes a 10 minutos después de la hora de inicio), sin necesidad de abrir el detalle. Los servicios sin cita muestran **Automático**, porque pasan solos al estado *Iniciada* al llegar su hora; las demás citas muestran un guion (—).

**Cómo filtrar las citas**

1. Presione el botón **Filtros**, junto a la barra de búsqueda. Se despliega el panel de filtros.
2. Combine los filtros que necesite; todos se aplican **de inmediato**:

   | Filtro | Qué hace |
   |---|---|
   | **Fecha de servicio (desde) / (hasta)** | Define el periodo de las citas que se consultan, en formato **dd/mm/aaaa**. El periodo no puede exceder **1 año**. Si indica solo una de las dos fechas, el sistema completa la otra con el máximo permitido. |
   | **Fecha de creación (desde) / (hasta)** | Muestra las citas que se agendaron dentro de ese rango. |
   | **Sucursal** | Solo para el gerente o asistente con **más de una sucursal**. Limita el listado a la sucursal elegida. |
   | **Servicio** | Muestra las citas que incluyen el servicio elegido. Las opciones corresponden a los servicios presentes en las citas cargadas. |
   | **Estado** | Muestra solo las citas con el estado elegido: *Agendada*, *Reagendada*, *Iniciada*, *Completada*, *Cancelada* o *Ausencia*. |

3. El número en el botón **Filtros** indica cuántos filtros del panel están activos (la búsqueda por nombre no se cuenta, porque está fuera del panel).
4. Para limpiar la búsqueda y todos los filtros, presione **Restablecer filtros**.

**Cómo consultar el historial de un cliente**

El personal no cuenta con una página dedicada al historial de un cliente (ver [4.4](#44-historial-del-cliente)). Para consultarlo: escriba el nombre o correo del cliente en la búsqueda y defina en **Fecha de servicio** un periodo amplio (por ejemplo, desde hace un año hasta hoy). Después, ordene por fecha o filtre por estado.

> 📷 **[Apoyo visual pendiente — Figura 5.2.3-E]** Panel *Filtros* del personal con todos los campos.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.3-F]** Ventana *Detalle de la cita* del personal con las acciones disponibles.

**Errores frecuentes y cómo resolverlos**

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *No se pudieron cargar tus citas.* (cliente) / *No se pudieron cargar las citas. Intenta de nuevo.* (personal) | Falla de conexión o del servidor. | Presione **Reintentar** o recargue la página. |
| *No tienes citas próximas.* / *Aún no tienes citas pasadas.* / *No tienes citas canceladas.* | La pestaña no tiene citas. | No es un error: significa que aún no hay citas en esa categoría. |
| *No hay citas que coincidan con los filtros.* (cliente) / *No se encontraron citas con los filtros aplicados.* (personal) | Los filtros o la búsqueda excluyen todas las citas. | Presione **Restablecer filtros** o amplíe los criterios. |
| *No hay citas en este periodo.* (personal) | No hay citas en el periodo consultado y no hay filtros activos. | Cambie el periodo en **Fecha de servicio**. |
| *Usa el formato dd/mm/aaaa* (cliente) / *Fecha no válida (dd/mm/aaaa).* (personal) | La fecha está incompleta o mal escrita. | Escriba día, mes y año completos (por ejemplo, 05/03/2026). |
| *Debe ser posterior a la fecha inicial* (cliente) / *No puede ser anterior a la fecha inicial.* (personal) | La fecha «hasta» es anterior a la fecha «desde». | Corrija el rango. |
| *El rango de fechas no puede exceder 1 año.* (personal) | El periodo de **Fecha de servicio** es mayor a un año. | Reduzca el rango. Consulte por periodos más cortos. |
| La lista no cambia al escribir una fecha. | La fecha aún está incompleta; el sistema conserva la última consulta válida hasta que se completa. | Termine de escribir la fecha en formato dd/mm/aaaa. |
| No se encuentra una cita antigua (cliente). | El cliente consulta aproximadamente los últimos 11 meses. | Las citas más antiguas no se muestran en *Mis Citas*. |
| No se encuentra una cita futura lejana (personal). | Sin fechas, el listado solo muestra de hoy a 30 días. | Defina **Fecha de servicio** para ampliar el periodo. |
| El filtro **Sucursal** no aparece. | Solo se muestra al gerente con más de una sucursal. | No es un error: el recepcionista solo ve su sucursal. |
| El filtro **Servicio** no ofrece un servicio. | La lista contiene solo los servicios de las citas ya cargadas. | Amplíe primero el periodo en **Fecha de servicio**. |

**Recomendaciones de uso**

- **Personal:** para buscar a un cliente, escriba solo una parte del nombre o el correo; la búsqueda encuentra coincidencias parciales y no distingue acentos.
- **Personal:** si busca una cita que no aparece, revise primero el **periodo de fecha de servicio**: por defecto solo se muestran las próximas citas (de hoy a 30 días).
- **Personal:** para ver las citas de la jornada, filtre **Fecha de servicio** con el día de hoy en ambas fechas.
- **Personal:** combine **Estado** con **Fecha de servicio** para tareas concretas, por ejemplo revisar las citas con *Ausencia* de la semana.
- **Personal:** el botón **Check-in** del listado agiliza el registro de llegada; para otras acciones, abra el detalle.
- **Cliente:** use la pestaña **Citas pasadas** para recordar qué servicios recibió y con qué barbero, y **Citas canceladas** para confirmar una cancelación.
- Si el listado no muestra lo esperado, revise los **filtros activos** (el número del botón *Filtros*) y presione **Restablecer filtros**.

#### 5.2.4 Editar o reprogramar una cita

**Perfil:** Cliente · Recepcionista · Gerente/Asistente. Para conocer qué datos pueden modificarse y las reglas que rigen la edición, consulte el apartado [4.2.2](#422-consulta-edición-reprogramación-y-cancelación). La forma de **abrir** la edición cambia según el perfil; la ventana **Editar cita** funciona igual para todos.

**Antes de comenzar**, verifique que la cita cumpla con lo siguiente:

- Su estado es **Agendada** o **Reagendada**.
- Su hora de inicio **aún no ha llegado**.
- **Solo clientes:** faltan **8 horas o más** para la hora de inicio.
- La **sucursal** y el **cliente** no se pueden cambiar. Si necesita modificar alguno, cancele la cita (ver [5.2.5](#525-cancelar-una-cita)) y agende una nueva.
- En los **servicios sin cita** (etiqueta **Walk-in**), tampoco se pueden cambiar la **fecha ni la hora** (ver [5.2.7](#527-registrar-un-servicio-sin-cita)).

---

**A. Cómo abrir la edición (cliente)**

1. En el menú de navegación, presione **Mis Citas**. En teléfonos y tabletas, abra primero el menú ☰.
2. En la pestaña **Próximas citas**, presione la fila de la cita que desea modificar.
3. En la página **Detalle de la cita**, presione **Editar cita**, al final de la página. Se abre la ventana **Editar cita**.

> El botón **Editar cita** solo aparece en citas Agendadas o Reagendadas que aún no empiezan. Si faltan menos de 8 horas, el botón sigue visible, pero la ventana se abre con los campos bloqueados y el mensaje *«No puedes modificar la cita con menos de 8 horas de anticipación.»*

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-A]** Página *Detalle de la cita* del cliente con los botones *Editar cita* y *Cancelar cita*.

**B. Cómo abrir la edición (personal)**

1. En el menú de navegación, presione **Citas**.
2. Ubique la cita con la búsqueda o los filtros (ver [5.2.3](#523-consultar-y-filtrar-citas)). Recuerde que, sin fechas indicadas, el listado muestra de hoy a los próximos 30 días.
3. Presione la fila de la cita. Se abre la ventana **Detalle de la cita**.
4. Presione **Editar cita**. La ventana de detalle se cierra y se abre la ventana **Editar cita**.

> El personal no tiene el límite de 8 horas. Si el botón **Editar cita** no aparece, la cita ya comenzó o su estado no permite cambios.

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-B]** Ventana *Detalle de la cita* del personal con el botón *Editar cita*.

---

**C. La ventana *Editar cita***

La ventana se abre con los datos actuales de la cita. En la parte superior muestra el identificador y el estado.

| Elemento | ¿Se puede modificar? | Descripción |
|---|---|---|
| **Cliente** | No | Solo lo ve el personal. Muestra nombre, correo y, si corresponde, la etiqueta *Visitante*. |
| **Fecha** | Sí | Nueva fecha de la cita. Debajo se indica la fecha límite (*Hasta el …*). |
| **Barbero** | Sí | Barberos de la misma sucursal que aceptan citas. El barbero actual siempre aparece en la lista. |
| **Sucursal** | No | Se muestra con un ícono de candado. |
| **Horarios disponibles** | Sí | Horario actual o nuevo horario, con la duración total en minutos. La lista de horas aparece plegada. |
| **Servicios** | Sí | Servicios de la cita, con su duración y precio, y el total. |
| **Notas** | Sí | Comentarios de la cita, de hasta 500 caracteres. |

Modifique **solo los datos que necesite**; los demás se conservan. Los procedimientos siguientes pueden combinarse y guardarse en una sola operación.

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-C]** Ventana *Editar cita* con los datos actuales y la lista de horarios plegada.

**D. Reprogramar la cita (cambiar fecha, hora o barbero)**

> **Servicios sin cita:** la fecha y la hora no pueden modificarse, por lo que los pasos 1, 3 y 4 no aplican. Solo puede cambiar el barbero (paso 2), siempre que la otra persona esté disponible en el mismo horario.

1. Si desea otro día, presione el recuadro **Fecha** y elija el día en el calendario. Solo puede elegir **desde hoy hasta 30 días después del día en que se agendó la cita**. Recuerde que la barbería no abre los domingos.
2. Si desea que atienda otra persona, abra la lista **Barbero** y selecciónela.
3. En **Horarios disponibles**, presione la **flecha** del lado derecho para desplegar las horas libres.
4. Presione la hora que prefiera; quedará resaltada. El resumen mostrará **Nuevo horario** con la hora de inicio y de término.
   - La hora que ya tiene la cita se identifica con la leyenda **· actual**.
   - Al cambiar de fecha, el resumen indica **Elige un horario**: debe seleccionar una hora del nuevo día.
   - Al cambiar de barbero, la hora seleccionada se conserva si esa persona la tiene libre; de lo contrario, deberá elegir otra.
5. Verifique que aparezca el aviso **«Al guardar, la cita pasará a Reagendada.»**
6. Continúe con otros cambios o presione **Guardar cambios** (ver apartado G).

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-D]** Lista de horarios desplegada con la hora actual, un nuevo horario seleccionado y el aviso de reagendado.

**E. Cambiar los servicios**

1. **Para agregar un servicio:** en la sección **Servicios**, presione **Añadir otro servicio** y elija uno de la lista. Cada opción muestra su duración y precio.
2. **Para quitar un servicio:** presione la **X** que aparece a la derecha del servicio. La cita debe conservar al menos uno, por lo que la X no se muestra cuando solo queda un servicio.
3. **Para reemplazar un servicio** cuando la cita tiene solo uno: agregue primero el nuevo y después quite el anterior.
4. Revise el **Total** y la duración. Si el precio total cambió, debajo se muestra el anterior (*Antes …*).
5. Verifique el horario en **Horarios disponibles**. Al cambiar los servicios, el sistema vuelve a consultar las horas libres según la nueva duración. Si la nueva selección dura **más** que la anterior, despliegue la lista y compruebe la disponibilidad.

> **Importante:** al agregar servicios, la ventana puede seguir mostrando el **Horario actual** aunque la nueva duración ya no quepa en él. El sistema lo comprueba al guardar y, si no hay tiempo suficiente, rechaza el cambio. En ese caso, elija otro horario u otro barbero.

Los servicios que ya estaban en la cita conservan el **precio y la duración con que se agendaron**; los servicios nuevos usan los del catálogo vigente. Si solo cambia los servicios, sin mover el horario ni el barbero, la cita **conserva su estado**.

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-E]** Sección *Servicios* con la lista de *Añadir otro servicio* desplegada y el total actualizado.

**F. Agregar o modificar las notas**

1. En la sección **Notas**, escriba o corrija el texto (máximo **500 caracteres**; el contador muestra cuántos lleva).
2. Para eliminar las notas, borre todo el texto.

Si solo modifica las notas, la cita conserva su horario y su estado.

**G. Guardar o descartar los cambios**

1. Revise la fecha, el barbero, el horario, los servicios y el total.
2. Presione **Guardar cambios**. Mientras se procesa, el botón muestra **Guardando...**; espere sin cerrar la página.
3. Si los cambios se guardan, la ventana se cierra **sin mostrar un mensaje de confirmación** y la información se actualiza:
   - El **cliente** permanece en la página **Detalle de la cita**, ya actualizada.
   - El **personal** regresa al listado **Citas**. Si la nueva fecha queda fuera del periodo o de los filtros activos, la cita dejará de verse en el listado.
4. Compruebe los datos nuevos. Si cambió la fecha, la hora o el barbero, el estado será **Reagendada** y el seguimiento del detalle mostrará **Cita reagendada** con la fecha original.

Para **salir sin guardar**, presione **Cancelar** o la **X** de la ventana. También se cierra al hacer clic fuera de ella o al presionar la tecla **Esc**. Los cambios se descartan **sin pedir confirmación**.

> El botón **Cancelar** de esta ventana **no cancela la cita**; solo cierra la edición. Para cancelar la cita, consulte [5.2.5](#525-cancelar-una-cita).

> 📷 **[Apoyo visual pendiente — Figura 5.2.4-F]** Detalle de una cita *Reagendada* con el evento *Cita reagendada* en el seguimiento.

**Errores frecuentes y cómo resolverlos**

*Mensajes y situaciones dentro de la ventana de edición:*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| No aparece el botón **Editar cita**. | La cita ya comenzó o su estado es *Iniciada*, *Completada*, *Cancelada* o *Ausencia*. | Esa cita ya no puede editarse. Si necesita otro horario, agende una cita nueva. |
| *No puedes modificar la cita con menos de 8 horas de anticipación.* | El cliente intenta editar fuera del plazo permitido. | Comuníquese con la barbería: el personal puede hacer el cambio mientras la cita no haya comenzado. |
| *Esta cita ya comenzó, no se puede editar.* / *Solo se pueden editar citas agendadas o reagendadas.* | La cita dejó de cumplir las condiciones de edición. | Cierre la ventana y actualice la página para ver su estado actual. |
| *Elige un horario disponible.* | Se presionó *Guardar cambios* sin una hora válida; suele ocurrir al cambiar de fecha, barbero o servicios. La lista de horarios se despliega automáticamente. | Elija una hora. Si la lista está vacía, cambie la fecha, el barbero o los servicios. |
| *No hay cambios que guardar.* | Los datos son iguales a los de la cita. | Modifique algún dato o cierre la ventana. |
| *Elige al menos un servicio.* | La cita no tiene servicios seleccionados. | Agregue al menos uno. |
| *No hay horarios disponibles ese día.* | El barbero no tiene un hueco suficiente para la duración total, ya terminó su turno o el día es domingo. | Pruebe con otra fecha u otro barbero, o revise los servicios. |
| *No se pudieron cargar los horarios. Intenta con otra fecha.* | Falla de conexión o del servidor; fecha escrita fuera del periodo permitido; o uno de los servicios de la cita ya no está activo en el catálogo. | Revise la conexión y la fecha. Si un servicio fue dado de baja, quítelo de la cita (agregando otro si era el único) o pida apoyo al gerente. |
| *No se pudieron cargar los datos de la cita.* (u otro mensaje al abrir la ventana) | No se pudieron obtener los barberos o los servicios. | Cierre la ventana, verifique su conexión y vuelva a presionar **Editar cita**. |
| Una fecha no puede elegirse en el calendario. | Es anterior a hoy o posterior a la fecha límite indicada en *Hasta el …*. | Elija una fecha dentro del periodo. Si necesita una fecha posterior, cancele la cita y agende otra (recuerde el límite de 30 días a partir de hoy). |

*Mensajes que pueden aparecer al guardar.* Actualmente el sistema muestra en **inglés** las respuestas del servidor:

| Mensaje | Significado | Qué hacer |
|---|---|---|
| *Selected time slot is no longer available* / *Selected time slot is not available* | El horario ya no está libre: otra cita lo ocupó o la nueva duración no cabe en él. | Cierre y vuelva a abrir **Editar cita** para actualizar los horarios; después elija otra hora, fecha o barbero. |
| *Selected services do not fit in the barber shift* | Con los nuevos servicios, la cita terminaría después del turno del barbero. | Elija una hora más temprana, otro barbero u otros servicios. |
| *Barber not found or is not accepting bookings* / *Barber is not accepting bookings* | La persona seleccionada ya no está recibiendo citas. Esto impide guardar incluso un cambio de notas. | Seleccione otro barbero y un horario disponible, y guarde de nuevo. |
| *Service not found or is inactive* | Uno de los servicios fue dado de baja del catálogo. | Cierre y vuelva a abrir la ventana, y elija servicios vigentes. |
| *Appointments can only be rescheduled up to 30 days after the booking date* | La nueva fecha excede el periodo de reprogramación. | Elija una fecha anterior al límite indicado en *Hasta el …*. |
| *Clients cannot edit an appointment less than 8 hours before it starts* | El plazo de 8 horas venció mientras la ventana estaba abierta. | Comuníquese con la barbería. |
| *Only future appointments can be edited* | La cita comenzó mientras se editaba. | Ya no puede modificarse. |
| *Only scheduled or rescheduled appointments can be edited* | El estado cambió mientras se editaba (por ejemplo, se canceló o se registró la llegada). | Cierre la ventana y actualice la página. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. Antes de repetir el cambio, actualice la página y compruebe si se guardó. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)), compruebe los datos de la cita y repita los cambios. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Edite la cita en lugar de cancelarla** cuando solo necesite cambiar la fecha, la hora, el barbero, los servicios o las notas.
- **Cambie primero los servicios y después el horario:** la disponibilidad depende de la duración total.
- **Revise el resumen del horario antes de guardar**, para confirmar la hora de inicio y de término.
- **Cliente:** haga sus cambios con anticipación; con menos de 8 horas ya no podrá hacerlos por su cuenta.
- **Cliente:** si no encuentra un horario conveniente, cierre la ventana sin guardar: su cita original se mantiene.
- **Personal:** confirme el cambio con el cliente antes de guardarlo y **avísele después**, ya que el sistema no envía notificaciones por ediciones.
- **Recordatorios:** al reprogramar, los recordatorios de los clientes registrados se calculan con el nuevo horario (ver [4.3](#43-recordatorios-automáticos)).
- **Recompensa de fidelidad:** si la cita tiene la etiqueta **Recompensa otorgada**, la edición no la quita. Al cambiar los servicios, la recompensa corresponde al más barato de la nueva selección (ver [4.6](#46-programa-de-fidelidad)).
- Utilice las **notas** para indicaciones sobre el servicio y evite incluir en ellas información personal delicada.

#### 5.2.5 Cancelar una cita

**Perfil:** Cliente · Recepcionista · Gerente/Asistente. Para conocer las reglas que rigen la cancelación, consulte el apartado [4.2.2](#422-consulta-edición-reprogramación-y-cancelación). La forma de **abrir** la cancelación cambia según el perfil; la ventana **Cancelar cita** es prácticamente igual para todos.

> **Importante:** la cancelación **no se puede deshacer**. Si solo necesita cambiar la fecha, la hora, el barbero, los servicios o las notas, **edite la cita** (ver [5.2.4](#524-editar-o-reprogramar-una-cita)).

**Antes de comenzar**, verifique que la cita cumpla con lo siguiente:

- Su estado es **Agendada** o **Reagendada**.
- Su hora de inicio **aún no ha llegado**.
- **Solo clientes:** faltan **8 horas o más** para la hora de inicio.

---

**A. Cómo abrir la cancelación (cliente)**

1. En el menú de navegación, presione **Mis Citas**. En teléfonos y tabletas, abra primero el menú ☰.
2. En la pestaña **Próximas citas**, presione la fila de la cita que desea cancelar.
3. En la página **Detalle de la cita**, presione **Cancelar cita**, al final de la página. Se abre la ventana **Cancelar cita**.

> El botón **Cancelar cita** solo aparece en citas Agendadas o Reagendadas que aún no empiezan. Si faltan menos de 8 horas, el botón sigue visible, pero la ventana muestra el mensaje *«No puedes cancelar la cita con menos de 8 horas de anticipación.»* y solo permite cerrarla.

> 📷 **[Apoyo visual pendiente — Figura 5.2.5-A]** Página *Detalle de la cita* del cliente con el botón *Cancelar cita*.

**B. Cómo abrir la cancelación (personal)**

1. En el menú de navegación, presione **Citas**.
2. Ubique la cita con la búsqueda o los filtros (ver [5.2.3](#523-consultar-y-filtrar-citas)). Recuerde que, sin fechas indicadas, el listado muestra de hoy a los próximos 30 días.
3. Presione la fila de la cita. Se abre la ventana **Detalle de la cita**.
4. Presione **Cancelar cita**. La ventana de detalle se cierra y se abre la ventana **Cancelar cita**.

> El **recepcionista** puede cancelar citas de su sucursal; el **gerente o asistente**, las de las sucursales a su cargo. El personal no tiene el límite de 8 horas. Si el botón **Cancelar cita** no aparece, la cita ya comenzó o su estado no permite cancelarla.

> 📷 **[Apoyo visual pendiente — Figura 5.2.5-B]** Ventana *Detalle de la cita* del personal con el botón *Cancelar cita*.

---

**C. Confirmar la cancelación**

1. Revise el resumen de la ventana para comprobar que sea **la cita correcta**: identificador, fecha, horario, barbero, servicios y total. El personal ve además el nombre del **cliente**.
2. Si lo desea, escriba la razón en **Motivo de la cancelación**. Es **opcional** y admite hasta **255 caracteres**; el contador muestra cuántos lleva.
3. Si la cita incluye una recompensa del programa de fidelidad, la ventana lo informa:
   - Cliente: *«Conservas tu recompensa y podrás usarla en otra cita.»*
   - Personal: *«El cliente conserva su recompensa y podrá usarla en otra cita.»*
4. Presione **Cancelar cita**. **Este botón ejecuta la cancelación de inmediato**, sin otra confirmación. Mientras se procesa, muestra **Cancelando...**; espere sin cerrar la página.

> 📷 **[Apoyo visual pendiente — Figura 5.2.5-C]** Ventana *Cancelar cita* con el resumen, el campo de motivo y los botones *Volver* y *Cancelar cita*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.5-D]** Ventana *Cancelar cita* con el aviso de conservación de la recompensa.

**Cómo salir sin cancelar la cita**

Antes de confirmar, presione **Volver** o la **X** de la ventana. También se cierra al hacer clic fuera de ella o al presionar la tecla **Esc**. La cita se mantiene sin cambios y el motivo escrito se descarta.

**D. Verificar la cancelación**

Si la operación es correcta, la ventana se cierra **sin mostrar un mensaje de confirmación**. Compruebe el resultado:

- **Cliente:** permanece en la página **Detalle de la cita**. El estado cambia a **Cancelada** y desaparecen los botones *Editar cita* y *Cancelar cita*. En **Mis Citas**, la cita se encuentra ahora en la pestaña **Citas canceladas**.
- **Personal:** regresa al listado **Citas**, donde la cita aparece como **Cancelada**. Si tenía un filtro de **Estado** distinto de *Cancelada*, dejará de verse.

El seguimiento de la cita muestra el evento **Cita cancelada** con su fecha y hora y, si se capturó, el **motivo de la cancelación**. Tanto el cliente como el personal pueden verlo. El horario del barbero **queda disponible** para nuevas citas.

> 📷 **[Apoyo visual pendiente — Figura 5.2.5-E]** Detalle de una cita *Cancelada* con el evento *Cita cancelada* y su motivo en el seguimiento.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.5-F]** Pestaña *Citas canceladas* del cliente.

**Errores frecuentes y cómo resolverlos**

*Mensajes y situaciones antes de confirmar:*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| No aparece el botón **Cancelar cita**. | La cita ya comenzó o su estado es *Iniciada*, *Completada*, *Cancelada* o *Ausencia*. | Esa cita ya no puede cancelarse. |
| *No puedes cancelar la cita con menos de 8 horas de anticipación.* | El cliente intenta cancelar fuera del plazo permitido. | Comuníquese con la barbería: el personal puede cancelarla mientras no haya comenzado. |
| *Esta cita ya comenzó, no se puede cancelar.* | La hora de inicio ya llegó. | Cierre la ventana. Si el cliente no se presentó, la cita pasará a *Ausencia* (ver [4.2.3](#423-estado-y-progreso-de-la-cita)). |
| *Solo se pueden cancelar citas agendadas o reagendadas.* | El estado de la cita no permite cancelarla. | Cierre la ventana y actualice la página para ver el estado actual. |
| No se encuentra la cita que se desea cancelar. | Está en otro periodo o hay filtros activos. | Presione **Restablecer filtros** y ajuste el periodo en **Fecha de servicio** (personal), o revise la pestaña **Próximas citas** (cliente). |

*Mensajes que pueden aparecer al confirmar.* Actualmente el sistema muestra en **inglés** las respuestas del servidor:

| Mensaje | Significado | Qué hacer |
|---|---|---|
| *Clients cannot cancel an appointment less than 8 hours before it starts* | El plazo de 8 horas venció mientras la ventana estaba abierta. | Comuníquese con la barbería. |
| *Only future appointments can be cancelled* | La cita comenzó antes de que se confirmara la cancelación. | Ya no puede cancelarse. |
| *Only scheduled or rescheduled appointments can be cancelled* | El estado cambió antes de confirmar (por ejemplo, ya se canceló o se registró la llegada). | Cierre la ventana y actualice la página. |
| *Not authorized to cancel this appointment* | La cita no corresponde a su cuenta o a sus sucursales. | Verifique que haya iniciado sesión con la cuenta correcta. Si el problema continúa, contacte al gerente o a soporte. |
| *Appointment not found* | La cita ya no existe en el sistema. | Cierre la ventana y actualice el listado. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. Antes de repetir, actualice la página y compruebe si la cita ya aparece como *Cancelada*. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)) y compruebe el estado de la cita antes de repetir la cancelación. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Revise el resumen antes de confirmar**, sobre todo si hay varias citas del mismo cliente o en fechas cercanas.
- **Reprograme en lugar de cancelar** si la cita solo necesita otro horario. Una cita cancelada no puede recuperarse: habría que agendar otra, y el horario original podría ya no estar disponible.
- **Cancele en cuanto sepa que no se asistirá**, para liberar el horario para otras personas.
- **Cliente:** recuerde el plazo de **8 horas**. Después de ese plazo, comuníquese con la barbería.
- **Personal:** confirme la cancelación con el cliente y, si usted la realiza, **avísele**, ya que el sistema no envía notificaciones por cancelaciones.
- **Personal:** las citas de **visitantes** solo puede cancelarlas el personal, porque no tienen una cuenta asociada.
- **Recordatorios:** una cita cancelada deja de generar recordatorios (ver [4.3](#43-recordatorios-automáticos)). Un mensaje enviado antes de la cancelación permanece en Telegram.
- **Recompensa de fidelidad:** cancelar no hace perder la recompensa; no presentarse sí. Si no se va a asistir, es preferible cancelar a tiempo (ver [4.6](#46-programa-de-fidelidad)).
- Como el sistema **no procesa pagos**, cancelar no genera cargos ni reembolsos.
- Si escribe un motivo, sea breve y evite incluir información personal delicada. El motivo se muestra en el seguimiento de la cita, por lo que **el cliente también puede ver el que escriba el personal**.

#### 5.2.6 Registrar la llegada del cliente (check-in)

**Perfil:** Recepcionista · Gerente/Asistente. El cliente no registra su propia llegada. Para conocer las reglas que rigen el check-in, consulte el apartado [4.2.3](#423-estado-y-progreso-de-la-cita). El check-in cambia el estado de la cita a **Iniciada** y puede registrarse desde el **listado** de citas o desde el **detalle** de una cita.

> **Importante:** el check-in se registra **de inmediato**, sin ventana de confirmación, y **no se puede deshacer**. Después de registrarlo, la cita ya no puede editarse ni cancelarse, y pasa automáticamente a **Completada** al llegar su hora de término. Regístrelo solo cuando el cliente **ya se encuentre en la barbería**.

**Antes de comenzar**, verifique que la cita cumpla con lo siguiente:

- Su estado es **Agendada** o **Reagendada**.
- **No** es un servicio sin cita (etiqueta **Walk-in**), ya que estos registran su llegada automáticamente.
- La hora actual está dentro de la **ventana de check-in**: desde **15 minutos antes** de la hora de inicio y **hasta antes de que se cumplan 10 minutos** después de ella.
- Si es un **check-in anticipado** (antes de la hora de inicio), el mismo barbero no tiene otra cita Agendada, Reagendada o Iniciada en los 15 minutos previos.

Por ejemplo, para una cita que inicia a las **12:00**:

| Hora actual | ¿Se puede registrar el check-in? |
|---|---|
| Antes de las 11:45 | No. Es demasiado pronto. |
| De las 11:45 a antes de las 12:00 | Sí, **si el barbero no tiene otra cita pendiente** en ese periodo. |
| De las 12:00 a antes de las 12:10 | Sí, aunque el barbero tenga otra cita en el periodo previo. |
| A partir de las 12:10 | No. La ventana venció y la cita pasa a **Ausencia**. |

---

**A. Ubicar la cita**

1. En el menú de navegación, presione **Citas**. En teléfonos y tabletas, abra primero el menú ☰.
2. Ubique la cita del cliente. Sin fechas indicadas, el listado muestra de hoy a los próximos 30 días, ordenado de la fecha más próxima a la más lejana.
3. Si hay muchas citas, escriba el **nombre o correo del cliente** en el buscador o use los filtros (ver [5.2.3](#523-consultar-y-filtrar-citas)). Los **visitantes** no tienen correo; búsquelos por nombre.
4. Compruebe con el cliente la **hora**, el **barbero** y los **servicios**.

Una vez ubicada la cita, registre la llegada con el método **B** o el **C**.

---

**B. Registrar el check-in desde el listado**

Es la forma más rápida.

1. En la columna **Acciones** de la cita, presione **Check-in**. En pantallas pequeñas, es posible que deba desplazar la tabla hacia un lado para ver la columna.
2. Mientras se procesa, el botón muestra **Registrando...** y los demás botones de check-in quedan deshabilitados. Espere sin cerrar la página.

La columna **Acciones** puede mostrar lo siguiente:

| Contenido | Significado |
|---|---|
| Botón **Check-in** | La cita está dentro de la ventana de check-in. |
| **Automático** | Es un servicio sin cita pendiente de iniciar; no requiere ninguna acción. |
| **—** | El check-in no está disponible en este momento o para el estado de la cita. |

> 📷 **[Apoyo visual pendiente — Figura 5.2.6-A]** Listado *Citas* del personal con el botón *Check-in* en la columna *Acciones*, junto con filas que muestren *Automático* y *—*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.6-B]** Botón de la columna *Acciones* con el indicador *Registrando...*.

---

**C. Registrar el check-in desde el detalle de la cita**

Use este método si desea revisar todos los datos antes de registrar la llegada.

1. En el listado, presione la fila de la cita (fuera del botón **Check-in**). Se abre la ventana **Detalle de la cita**.
2. Revise el cliente, la fecha, el horario, el barbero, los servicios y las notas.
3. Presione **Check-in**, en la parte inferior de la ventana.
4. Mientras se procesa, el botón muestra **Registrando check-in...** y la ventana no puede cerrarse.

> El botón **Check-in** del detalle solo aparece cuando la cita está dentro de la ventana de check-in.

> 📷 **[Apoyo visual pendiente — Figura 5.2.6-C]** Ventana *Detalle de la cita* del personal con el botón *Check-in*.

---

**D. Verificar el registro**

Si la operación es correcta:

1. Aparece durante unos segundos el aviso **Check-in registrado para {nombre del cliente}.** en la parte superior derecha. Si usó el detalle, la ventana se cierra.
2. El listado se actualiza y la cita aparece como **Iniciada**. Si tenía un filtro de **Estado** distinto de *Iniciada*, dejará de verse.
3. Al abrir el detalle, el seguimiento muestra el evento **Check-in registrado** con la fecha y hora en que se realizó, y ya no aparecen los botones **Editar cita** ni **Cancelar cita**.

El check-in **no cambia el horario** de la cita: la hora de inicio y la de término se conservan, aunque el cliente haya llegado antes o después. La cita pasa a **Completada** automáticamente al llegar su hora de término.

> 📷 **[Apoyo visual pendiente — Figura 5.2.6-D]** Aviso *Check-in registrado* y cita con estado *Iniciada* en el listado.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.6-E]** Detalle de una cita *Iniciada* con el evento *Check-in registrado* en el seguimiento.

**Servicios sin cita (Walk-in)**

Los servicios sin cita **no requieren check-in manual**: el sistema lo registra automáticamente al llegar su hora de inicio. Mientras estén pendientes, el detalle muestra un aviso que lo indica. Consulte el apartado [5.2.7](#527-registrar-un-servicio-sin-cita).

> 📷 **[Apoyo visual pendiente — Figura 5.2.6-F]** Detalle de un servicio sin cita pendiente con el aviso de check-in automático.

**Errores frecuentes y cómo resolverlos**

*Situaciones en las que no se puede iniciar el registro:*

| Situación | Causa | Qué hacer |
|---|---|---|
| No aparece el botón **Check-in** y faltan más de 15 minutos para la cita. | La ventana de check-in aún no se abre. | Espere hasta 15 minutos antes de la hora de inicio. |
| Ya es hora, pero el botón **Check-in** no aparece. | La pantalla revisa la hora aproximadamente cada 30 segundos. También puede deberse a que la hora del dispositivo es incorrecta. | Espere unos segundos. Si no aparece, compruebe la fecha y la hora del dispositivo y actualice la página. |
| No aparece el botón y ya pasaron 10 minutos o más desde la hora de inicio. | La ventana de check-in venció. | No es posible registrar la llegada en esa cita (vea la nota *Si el cliente llega después de la ventana*, más adelante). |
| No aparece el botón en una cita con etiqueta **Walk-in**. | El check-in de los servicios sin cita es automático. | No se requiere ninguna acción. |
| No aparece el botón y la cita está *Iniciada*, *Completada*, *Cancelada* o *Ausencia*. | El estado de la cita no admite check-in. | Abra el detalle y revise el seguimiento para saber qué ocurrió. |
| No se encuentra la cita del cliente. | Hay filtros activos, la cita es de otra fecha o sucursal, o no fue agendada. | Presione **Restablecer filtros** y busque de nuevo. Confirme la fecha y la sucursal con el cliente. Si no tiene cita, puede registrar un servicio sin cita (ver [5.2.7](#527-registrar-un-servicio-sin-cita)). |

*Mensajes que pueden aparecer al registrar el check-in.* Si usó el listado, el mensaje aparece **arriba de la tabla** y puede cerrarse con la **X**; si usó el detalle, aparece **dentro de la ventana**.

| Mensaje | Causa | Qué hacer |
|---|---|---|
| *No se puede hacer check-in anticipado: el barbero tiene otra cita en el horario previo.* | El mismo barbero tiene una cita pendiente o en curso en los 15 minutos previos. Esto incluye la cita de un cliente que aún no llega. | Pida al cliente que espere y registre el check-in **a partir de la hora de inicio** de su cita, antes de que se cumplan 10 minutos. |
| *Es demasiado pronto para hacer check-in. Se habilita 15 minutos antes de la hora de inicio.* | Faltan más de 15 minutos, por ejemplo, porque la cita se reagendó o la hora del dispositivo está adelantada. | Actualice la página, revise el horario de la cita y espere a que se abra la ventana. |
| *La ventana de check-in venció (10 minutos después de la hora de inicio).* | Pasaron 10 minutos o más desde la hora de inicio. | No es posible registrar la llegada en esa cita. |
| *Esta cita ya no admite check-in porque su estado cambió.* | Otra persona registró la llegada o canceló la cita, o el sistema la marcó como *Ausencia*. | Actualice la página y revise el estado actual. |
| *No se pudo registrar el check-in porque el estado o el horario de la cita ya no lo permite.* | La cita cambió antes de completar el registro. | Actualice la página y revise la cita. |
| *No tienes permiso para registrar el check-in de esta cita.* | La cita no pertenece a su sucursal o a las sucursales a su cargo. | Verifique que haya iniciado sesión con la cuenta correcta. Si el problema continúa, contacte al gerente o a soporte. |
| *No se encontró la cita solicitada.* | La cita ya no existe en el sistema. | Actualice la página y vuelva a buscarla. |
| *No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.* | No hubo conexión con el servidor. | Revise su conexión. Antes de repetir, actualice la página y compruebe si la cita ya aparece como *Iniciada*. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)) y compruebe el estado de la cita antes de repetir el registro. |

> **Si el cliente llega después de la ventana:** la cita pasa a **Ausencia** y no puede reactivarse. Si desea atenderlo, puede registrar un **servicio sin cita**, siempre que quede disponibilidad ese día (ver [5.2.7](#527-registrar-un-servicio-sin-cita)). Si la cita incluía una recompensa del programa de fidelidad, la *Ausencia* hace que el cliente la pierda (ver [4.6](#46-programa-de-fidelidad)).

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Registre la llegada en cuanto el cliente se presente.** Si pasan 10 minutos desde la hora de inicio sin check-in, la cita se marca como *Ausencia*, aunque el cliente esté en la barbería.
- **Confirme que sea la cita correcta antes de presionar el botón**, sobre todo si hay clientes con nombres parecidos o un cliente con varias citas. No hay confirmación previa ni forma de revertir el registro.
- **No registre llegadas por adelantado** para clientes que aún no están presentes: la cita pasaría a *Completada* y contaría como servicio atendido en el programa de fidelidad.
- **Haga los cambios necesarios antes del check-in.** Los servicios, el barbero y las notas solo pueden modificarse antes de la hora de inicio y mientras la cita no esté *Iniciada* (ver [5.2.4](#524-editar-o-reprogramar-una-cita)).
- **Actualice la página periódicamente** si mantiene abierto el listado. Los cambios automáticos de estado y los registros de otras personas no se reflejan por sí solos.
- Para registrar que un cliente **no se presentó**, consulte el apartado [5.2.8](#528-seguimiento-de-estados).

#### 5.2.7 Registrar un servicio sin cita

**Perfil:** Recepcionista · Gerente/Asistente. Los clientes no pueden registrar servicios sin cita. Para conocer las reglas que los rigen, consulte *Servicios sin cita* en el apartado [4.2.3](#423-estado-y-progreso-de-la-cita). Use este procedimiento cuando una persona **llega a la barbería sin haber agendado** y desea atenderse **ese mismo día**. En los listados, estos servicios se identifican con la etiqueta **Walk-in**.

> **Importante:** al llegar la hora de inicio, el sistema **registra el check-in automáticamente**. Después, el servicio ya no puede editarse ni cancelarse, y pasa a **Completada** al llegar su hora de término. Registre el servicio solo si el cliente **está en la barbería** y aceptó el horario.

**Antes de comenzar:**

- Pregunte al cliente qué **servicios** desea.
- Pregunte si **tiene una cuenta** en la plataforma. Si no la tiene, se registra como **visitante**.
- Considere que solo pueden usarse **horarios del día en curso**. Si no queda disponibilidad hoy, deberá ofrecerle agendar otro día (ver [5.2.2](#522-agendar-una-cita-personal)).
- El horario que ofrece el sistema **no necesariamente es inmediato**: depende del turno y de las citas de cada barbero, así como de la duración de los servicios.

---

**A. Abrir el registro de un servicio sin cita**

1. En el menú de navegación, presione **Agendar Cita**. En teléfonos y tabletas, abra primero el menú ☰.
2. En la parte superior de la página, presione **Registrar servicio sin cita**. El título de la página cambia a **Registrar servicio sin cita**.

> Para volver al agendado normal, presione **Agendar cita con fecha**. Al cambiar entre ambos modos, el formulario se vacía.

> 📷 **[Apoyo visual pendiente — Figura 5.2.7-A]** Página *Agendar cita* del personal con el botón *Registrar servicio sin cita*.

---

**B. Capturar la sucursal, los servicios y el cliente**

1. En **Sucursal**, seleccione el local. Si solo tiene una sucursal disponible, como en el caso del **recepcionista**, aparece ya seleccionada. El **gerente o asistente** puede elegir cualquiera de las sucursales a su cargo.
2. En **Servicio**, seleccione el servicio solicitado. Si requiere más de uno, use **Añadir otro servicio** (y la **X** para quitar uno).
3. En la sección **Cliente**, indique a nombre de quién se registra el servicio, igual que en el paso 4 del apartado [5.2.2](#522-agendar-una-cita-personal):
   - **Cliente registrado:** búsquelo por nombre, apellido o correo y presione el resultado correcto.
   - **Visitante:** escriba su nombre completo (máximo 100 caracteres).

> 📷 **[Apoyo visual pendiente — Figura 5.2.7-B]** Formulario en modo *Registrar servicio sin cita* con la sucursal, los servicios y el cliente capturados.

---

**C. Elegir el barbero y el horario**

En este modo **no hay calendario**. Cuando la sucursal y al menos un servicio están seleccionados, aparece el panel **Próximo horario de hoy**.

1. Revise las opciones. El sistema muestra **una por barbero**, con su **primer horario disponible de hoy** para los servicios elegidos, ordenadas de la hora más temprana a la más tardía. Los barberos sin disponibilidad no aparecen.
2. El sistema **preselecciona la primera opción** de la lista. Cuando hay horarios distintos, el más temprano se identifica como **Más próximo**.
3. Informe al cliente las opciones (barbero y hora) y presione **la que prefiera**. La opción elegida queda resaltada.

> 📷 **[Apoyo visual pendiente — Figura 5.2.7-C]** Panel *Próximo horario de hoy* con varios barberos, la etiqueta *Más próximo* y una opción seleccionada.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.7-D]** Panel con el mensaje *No queda disponibilidad hoy para estos servicios*.

---

**D. Revisar y registrar**

1. En el panel **Información de la cita**, identificado con la etiqueta **Walk-in**, revise el cliente, la sucursal, la fecha (la de hoy), el horario con el barbero, los servicios, el precio total y la duración total.
2. Compruebe que **la hora elegida no haya pasado** mientras capturaba los datos, ya que la lista de horarios no se actualiza sola.
3. Presione **Registrar servicio**. El botón se habilita cuando están completos el cliente, la sucursal, los servicios y el horario. Presiónelo una sola vez y espere sin cerrar la página.

Debajo del botón, el sistema indica a qué hora la cita *pasará sola a "en curso"*. Ese momento corresponde al cambio al estado **Iniciada**.

> 📷 **[Apoyo visual pendiente — Figura 5.2.7-E]** Panel *Información de la cita* con la etiqueta *Walk-in* y el botón *Registrar servicio*.

**Cómo hacer cambios antes de registrar**

- Si cambia la **sucursal** o los **servicios**, el sistema vuelve a consultar los horarios y preselecciona la primera opción. **Confirme de nuevo el barbero** que eligió el cliente.
- El botón **Cancelar** vacía el formulario, incluido el cliente. Si solo tiene una sucursal disponible, esta se selecciona de nuevo. No cancela ningún servicio ya registrado.

---

**E. Verificar el registro y dar seguimiento**

Si la operación es correcta, el sistema muestra **«Servicio sin cita registrado correctamente.»** y lo lleva al listado **Citas**. El servicio avanza así:

| Momento | Estado | Qué observará |
|---|---|---|
| Desde el registro y antes de la hora de inicio | **Agendada** | Etiqueta **Walk-in** y la leyenda **Automático** en la columna *Acciones*. El seguimiento muestra **Walk-in registrado**. |
| A partir de la hora de inicio (la actualización puede tardar cerca de un minuto) | **Iniciada** | El seguimiento agrega **Check-in registrado**, con la indicación *Check-in automático (Walk-in)* y la hora de inicio programada. |
| A partir de la hora de término | **Completada** | El seguimiento agrega **Cita completada**. |

El personal **no necesita registrar el check-in** y un servicio sin cita **nunca pasa a *Ausencia***. Para ver los cambios de estado, actualice la página.

> 📷 **[Apoyo visual pendiente — Figura 5.2.7-F]** Listado *Citas* con un servicio sin cita recién registrado: aviso de confirmación, etiqueta *Walk-in* y leyenda *Automático*.

**Si algo cambia antes de la hora de inicio**

Mientras no llegue la hora de inicio, el servicio puede cancelarse y editarse, pero su **fecha y hora no pueden modificarse**.

- **El cliente se retira o ya no desea el servicio:** cancélelo **antes de la hora de inicio** (ver [5.2.5](#525-cancelar-una-cita)). Si no lo hace, el sistema lo registrará como atendido.
- **Cambian los servicios o el barbero:** edite la cita (ver [5.2.4](#524-editar-o-reprogramar-una-cita)). El cambio solo es posible si hay disponibilidad **en el mismo horario**. Si no la hay, cancele el servicio y regístrelo de nuevo.
- **Desea agregar notas:** el formulario de registro no tiene campo de notas. Puede agregarlas editando la cita antes de la hora de inicio.
- **El cliente prefiere otra hora de hoy:** cancele el servicio sin cita y regístrelo de nuevo, eligiendo entre los horarios que ofrezca el sistema.
- **El cliente prefiere atenderse otro día:** cancele el servicio sin cita y agende una **cita normal** (ver [5.2.2](#522-agendar-una-cita-personal)).

**Errores frecuentes y cómo resolverlos**

*Situaciones durante la captura:*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| No aparece el botón **Registrar servicio sin cita**. | No se encuentra en la página *Agendar Cita* o su cuenta no es de personal. | Presione **Agendar Cita** en el menú y verifique la cuenta con la que inició sesión. |
| Las listas de **Sucursal** o **Servicio** aparecen vacías. | No se pudieron cargar los datos o no hay sucursales o servicios activos disponibles para su cuenta. | Actualice la página. Si continúan vacías, contacte al gerente o a soporte. |
| *Selecciona una sucursal y al menos un servicio para ver la disponibilidad.* | Falta elegir la sucursal o el servicio. | Complete ambos datos. |
| *No queda disponibilidad hoy para estos servicios. No es posible registrar el servicio sin cita. Ofrece al cliente agendar otro día.* | Ningún barbero tiene hoy un espacio suficiente: las agendas están llenas, los turnos terminan antes de que concluya el servicio o la sucursal no abre ese día (domingo). | Ofrezca agendar otro día (ver [5.2.2](#522-agendar-una-cita-personal)). Si el cliente acepta un servicio más corto o menos servicios, ajuste la selección y revise si hay horarios. |
| No aparece un barbero en las opciones. | No le queda un horario suficiente hoy, está fuera de turno o no está aceptando citas. | Ofrezca otra de las opciones. Si cree que es un error, pida al gerente que revise la configuración del barbero. |
| El panel muestra *No se pudo consultar el próximo horario disponible. Intenta de nuevo.* o un mensaje en inglés. | Falló la consulta de horarios. | Revise la conexión y actualice la página. Deberá capturar de nuevo los datos. |
| El botón **Registrar servicio** aparece deshabilitado. | Falta el cliente, la sucursal, el servicio o el horario, o los horarios todavía se están consultando. | Complete los datos y presione una de las opciones de horario, aunque la lista ya esté visible. |
| *No se encontraron clientes.* | Ningún cliente coincide con la búsqueda. | Revise la ortografía o busque por correo. Si la persona no tiene cuenta, use **Visitante**. |

*Mensajes que pueden aparecer al registrar.* Aparecen durante unos segundos en la parte superior derecha. Actualmente, la mayoría de las respuestas del servidor se muestran en **inglés**:

| Mensaje | Significado | Qué hacer |
|---|---|---|
| *El horario seleccionado se ocupó mientras tanto. Se recalculó el próximo horario disponible.* | El horario ya no está disponible porque su hora pasó o alguien más lo ocupó. | El sistema preselecciona la primera opción de la nueva lista, que **puede ser de otro barbero**. Revísela con el cliente, elija una opción y presione **Registrar servicio** de nuevo. |
| *Barber not found or is not accepting bookings* (o *…at this shop*) | El barbero dejó de estar disponible. | Actualice la página y capture de nuevo el servicio con otro barbero. |
| *Service not found or is inactive* | Un servicio dejó de estar disponible. | Actualice la página y seleccione otro servicio. |
| *Shop not found or is inactive* | La sucursal no está disponible. | Contacte al gerente o a soporte. |
| *Client not found* | El cliente seleccionado ya no existe en el sistema. | Busque de nuevo al cliente. |
| *Not authorized to create this appointment* o *Not authorized to manage walk-ins of this shop* | La sucursal no corresponde a su cuenta. | Verifique la cuenta y la sucursal. Si el problema continúa, contacte al gerente o a soporte. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. **Antes de repetir**, consulte **Citas** para comprobar que el servicio no se haya registrado y así evitar un duplicado. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)), compruebe en **Citas** si el servicio se registró y, si no, repita el procedimiento. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Registre el servicio en cuanto el cliente confirme.** Los primeros horarios pueden estar muy próximos y dejar de estar disponibles si la captura se demora.
- **Comunique la hora de inicio y el barbero** antes de registrar, sobre todo si el cliente tendrá que esperar.
- **Confirme que el barbero seleccionado sea el que eligió el cliente** antes de presionar **Registrar servicio**, en especial después de cambiar los servicios o de recibir un aviso de horario ocupado.
- **Confirme todos los servicios desde el registro.** Solo podrán cambiarse antes de la hora de inicio, que puede ser en pocos minutos.
- **Prefiera «Cliente registrado»** si el cliente tiene cuenta: así el servicio queda en su historial y, al completarse, cuenta para el programa de fidelidad (ver [4.6](#46-programa-de-fidelidad)). Los servicios de **visitantes** no suman a ningún conteo.
- **Cancele a tiempo los servicios que no se realizarán**, para liberar el horario y evitar que se registren como atendidos.
- Los servicios sin cita **no generan recordatorios** (ver [4.3](#43-recordatorios-automáticos)).
- **No use este procedimiento para un cliente que ya tiene una cita de hoy.** Si llegó dentro de la ventana permitida, registre su check-in (ver [5.2.6](#526-registrar-la-llegada-del-cliente-check-in)).
- Recuerde al cliente que el **pago se realiza en la barbería**.

#### 5.2.8 Seguimiento de estados

**Perfil:** Cliente (solo consulta) · Recepcionista · Gerente/Asistente. La opción **Marcar inasistencia** es exclusiva del **recepcionista**. Para conocer el significado de cada estado, el ciclo de vida de la cita y las transiciones automáticas, consulte el apartado [4.2.3](#423-estado-y-progreso-de-la-cita).

El seguimiento permite saber **en qué punto se encuentra una cita** y **qué ha ocurrido con ella**. La plataforma lo muestra de dos formas:

- La **etiqueta de estado**, que indica la situación actual. Aparece en el listado y en el detalle de la cita.
- La sección **Seguimiento** del detalle, una línea de tiempo con los hechos de la cita y su fecha y hora.

No existe una opción para elegir o cambiar libremente el estado de una cita: este cambia como resultado de una acción (reprogramar, registrar la llegada, cancelar o marcar la inasistencia) o de forma **automática** según la hora.

> **Importante:** las pantallas **no se actualizan solas**. Si mantiene abierto un listado o un detalle, **actualice la página** para ver los cambios automáticos y los que hayan hecho otras personas.

**Cómo identificar el estado**

| Etiqueta | Color | ¿Es un estado final? |
|---|---|---|
| **Agendada** | Turquesa | No |
| **Reagendada** | Dorado | No |
| **Iniciada** | Azul | No |
| **Completada** | Verde | Sí |
| **Cancelada** | Rosa | Sí |
| **Ausencia** | Terracota | Sí |

Además de su estado, una cita puede mostrar el distintivo **Walk-in** (servicio sin cita) o el de recompensa del programa de fidelidad (una **estrella** en el listado y la etiqueta **Recompensa otorgada** en el detalle). Estos distintivos no son estados.

---

**A. Cliente: consultar el estado y el seguimiento de una cita**

1. En el menú de navegación, presione **Mis Citas**. En teléfonos y tabletas, abra primero el menú ☰.
2. Elija la pestaña donde se encuentra la cita:

   | Estado de la cita | Pestaña |
   |---|---|
   | **Agendada**, **Reagendada** o **Iniciada** cuyo horario aún no termina | **Próximas citas** |
   | **Completada** o **Ausencia** | **Citas pasadas** |
   | **Cancelada** | **Citas canceladas** |

   Una cita cuyo horario ya terminó aparece en **Citas pasadas**, aunque su estado todavía no se haya actualizado.

3. Consulte la columna **Estado**. El cliente no cuenta con un filtro por estado; para buscar una cita, use las pestañas y los filtros descritos en el apartado [5.2.3](#523-consultar-y-filtrar-citas).
4. Presione la fila de la cita. Se abre la página **Detalle de la cita**, con la etiqueta de estado en la parte superior.
5. Revise la sección **Seguimiento** (ver *Cómo interpretar el seguimiento*, más adelante).
6. Para volver al listado, presione **Volver a mis citas**.

Los botones **Editar cita** y **Cancelar cita** solo aparecen en citas **Agendadas** o **Reagendadas** que aún no han comenzado. Que aparezcan no significa que el cambio todavía esté permitido: si faltan menos de 8 horas, el sistema le indica que ya no puede hacerlo (ver [5.2.4](#524-editar-o-reprogramar-una-cita) y [5.2.5](#525-cancelar-una-cita)).

El cliente **no puede cambiar el estado** de su cita registrando su llegada o una inasistencia. Solo puede reprogramarla o cancelarla dentro del plazo permitido.

> 📷 **[Apoyo visual pendiente — Figura 5.2.8-A]** Pantalla *Mis citas* del cliente con las etiquetas de estado en la columna *Estado*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.8-B]** Página *Detalle de la cita* del cliente con la etiqueta de estado y la sección *Seguimiento*.

---

**B. Personal: dar seguimiento a las citas**

El **recepcionista** consulta las citas de su sucursal; el **gerente o asistente**, las de las sucursales a su cargo.

1. En el menú de navegación, presione **Citas**.
2. Revise la columna **Estado**. Sin fechas indicadas, el listado muestra de hoy a los próximos 30 días. Para revisar citas de días anteriores, defina el periodo en **Fecha de servicio (desde) / (hasta)**.
3. Para ver solo las citas de un estado, presione **Filtros** y elíjalo en **Estado**. Para volver a verlas todas, seleccione **Todos los estados**. La opción **Restablecer filtros** limpia además la búsqueda y los demás filtros (ver [5.2.3](#523-consultar-y-filtrar-citas)).
4. Presione la fila de la cita. Se abre la ventana **Detalle de la cita**.
5. Revise la etiqueta de estado, en la parte superior, y la sección **Seguimiento**.

La ventana muestra los datos que tenía la cita al abrirla desde el listado. Para comprobar si hubo cambios, ciérrela, actualice la página y vuelva a abrirla.

Las acciones disponibles en el detalle dependen del estado y de la hora de la cita:

| Situación de la cita | Acciones disponibles |
|---|---|
| **Agendada** o **Reagendada**, antes de su hora de inicio | **Editar cita** y **Cancelar cita**. Además, **Check-in** desde 15 minutos antes (excepto en servicios sin cita). |
| **Agendada** o **Reagendada**, desde su hora de inicio | **Check-in** hasta antes de que pasen 10 minutos y, solo para la recepción, **Marcar inasistencia**. No aplican a servicios sin cita. |
| **Iniciada**, **Completada**, **Cancelada** o **Ausencia** | Ninguna: la cita ya no admite cambios manuales. |

El recepcionista ve el botón de inasistencia en **todas** las citas, pero **deshabilitado** cuando no corresponde usarlo. El gerente o asistente no ve este botón.

Para realizar cada acción, consulte los apartados [5.2.4](#524-editar-o-reprogramar-una-cita) (editar o reprogramar), [5.2.5](#525-cancelar-una-cita) (cancelar) y [5.2.6](#526-registrar-la-llegada-del-cliente-check-in) (check-in).

> 📷 **[Apoyo visual pendiente — Figura 5.2.8-C]** Listado *Citas* del personal con el filtro *Estado* desplegado y citas con distintas etiquetas.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.8-D]** Ventana *Detalle de la cita* del personal con la etiqueta de estado y la sección *Seguimiento*.

---

**Cómo interpretar el seguimiento**

*Aplica a todos los perfiles.* La línea de tiempo se lee **de arriba hacia abajo**, en orden cronológico. El último punto aparece resaltado.

| Evento | Fecha y hora que muestra | Información adicional |
|---|---|---|
| **Cita agendada** o **Walk-in registrado** | Cuándo se creó la cita. | — |
| **Cita reagendada** | Cuándo se cambió por última vez la fecha, la hora o el barbero. | **Fecha original:** la fecha y hora con las que se agendó por primera vez. |
| **Check-in registrado** | Cuándo se registró la llegada. En un servicio sin cita, su hora de inicio programada. | *Check-in automático (Walk-in)*, en servicios sin cita. |
| **Cliente ausente** | La **hora de inicio programada** de la cita, no la hora en que se marcó la ausencia. | *El cliente no se presentó*. |
| **Cita cancelada** | Cuándo se canceló. | El motivo, si se indicó. |
| **Cita completada** | La hora de término de la cita. | — |

Tenga en cuenta lo siguiente:

- La fecha que aparece **debajo de cada evento** no es siempre la fecha de la cita. La fecha y el horario vigentes de la cita se muestran en los datos generales del detalle.
- El evento **Cita reagendada** aparece en toda cita a la que se le cambió la fecha, la hora o el barbero, y **se conserva aunque el estado cambie** a *Iniciada*, *Completada*, *Cancelada* o *Ausencia*. Por ello, el seguimiento puede mostrarlo aunque la etiqueta de estado ya no sea *Reagendada*.
- Cambiar solo los **servicios** o las **notas** no convierte una cita *Agendada* en *Reagendada*. En una cita ya reprogramada, estos cambios tampoco modifican la fecha y hora del evento **Cita reagendada**.
- Si solo se cambió el **barbero**, la **Fecha original** puede coincidir con la fecha y hora vigentes de la cita.
- La línea de tiempo **no es un registro de todos los cambios**: si una cita se reprograma varias veces, muestra un solo evento **Cita reagendada**, correspondiente al último cambio. Tampoco indica quién hizo cada acción.
- En una **Ausencia**, el seguimiento no distingue si la marcó la recepción o el sistema.

> 📷 **[Apoyo visual pendiente — Figura 5.2.8-E]** Ejemplos de la sección *Seguimiento*: una cita *Reagendada*, una cita *Completada* que conserva el evento *Cita reagendada* y una con *Ausencia*.

**Cambios automáticos de estado**

El sistema aplica estos cambios sin intervención del personal. Los revisa cada minuto, por lo que pueden tardar un poco en reflejarse y requieren actualizar la página:

| Cuándo | Cambio | Qué debe hacer el personal |
|---|---|---|
| Llega la hora de inicio de un **servicio sin cita** | **Agendada** o **Reagendada** → **Iniciada** | Nada. Si el servicio no se realizará, debe cancelarlo **antes** de esa hora. |
| Pasan 10 minutos de la hora de inicio de una cita **sin check-in** (no aplica a servicios sin cita) | **Agendada** o **Reagendada** → **Ausencia** | Si el cliente llegó a tiempo, registrar su check-in **antes** de que se cumplan los 10 minutos. |
| Llega la hora de término de una cita **Iniciada** | **Iniciada** → **Completada** | Nada. No existe un botón para completar la cita. |

El sistema no envía ningún aviso al cliente cuando cambia el estado de su cita. El efecto de cada estado final en el programa de fidelidad se describe en *Efecto en el programa de fidelidad*, en el apartado [4.2.3](#423-estado-y-progreso-de-la-cita).

---

**C. Recepcionista: marcar una inasistencia**

Use esta opción cuando ya sepa que el cliente **no se presentará** y quiera cerrar la cita sin esperar el cambio automático. Esto libera el horario del barbero. Si no lo hace, el sistema marca la *Ausencia* por sí solo 10 minutos después de la hora de inicio, por lo que **no es obligatorio** usarla.

> **Importante:** la inasistencia **no se puede deshacer** y la cita ya no admitirá check-in. Puede marcarse desde la hora de inicio, **antes de que termine el plazo de 10 minutos** de tolerancia para la llegada. Si el cliente todavía puede llegar, no la marque.

**Requisitos:**

- La cita pertenece a **su sucursal**.
- Su estado es **Agendada** o **Reagendada**.
- **No** es un servicio sin cita.
- Ya llegó la **hora de inicio** programada.

**Procedimiento**

1. En el menú de navegación, presione **Citas** y ubique la cita.
2. Presione su fila para abrir **Detalle de la cita**.
3. Verifique el cliente, la fecha, el horario y el barbero.
4. Presione **Marcar inasistencia**, en la parte inferior de la ventana. Si abrió el detalle antes de la hora de inicio, el botón se habilita al llegar esa hora.
   - Mientras la ventana de check-in siga abierta, este botón aparece **junto al botón Check-in**. Asegúrese de presionar el correcto.
5. En la ventana **Confirmar inasistencia**, revise los datos del cliente, la fecha y el horario.
   - Si la cita incluye una recompensa, aparece el aviso **«Al confirmar, el cliente perderá la recompensa y su contador de lealtad se reiniciará.»** (ver [4.6](#46-programa-de-fidelidad)).
6. Presione **Confirmar inasistencia**. Para regresar al detalle sin hacer cambios, presione **Volver**; para cerrar sin hacer cambios, presione la **X**.
7. Mientras se procesa, el botón muestra **Marcando...** y la ventana no puede cerrarse.

**Verificar el registro**

Si la operación es correcta:

1. La ventana se cierra y aparece el aviso **Cita marcada como inasistencia.** en la parte superior derecha.
2. El listado se actualiza y la cita aparece como **Ausencia**. Si tenía un filtro de **Estado** distinto de *Ausencia*, dejará de verse.
3. Al abrir el detalle, el seguimiento muestra **Cliente ausente** y el botón aparece deshabilitado con el texto **Inasistencia registrada**.

> 📷 **[Apoyo visual pendiente — Figura 5.2.8-F]** Ventana *Detalle de la cita* de la recepción con los botones *Check-in* y *Marcar inasistencia*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.8-G]** Ventana *Confirmar inasistencia*, incluido el aviso de pérdida de recompensa.
>
> 📷 **[Apoyo visual pendiente — Figura 5.2.8-H]** Aviso de confirmación y detalle de la cita con *Inasistencia registrada* y el evento *Cliente ausente*.

**Errores frecuentes y cómo resolverlos**

*Situaciones al consultar el estado:*

| Situación | Causa | Qué hacer |
|---|---|---|
| El estado no cambió aunque ya pasó la hora. | La pantalla no se actualiza sola, o el sistema aún no ha revisado la cita. | Espere cerca de un minuto y actualice la página. Si continúa igual, informe a la gerencia o a soporte (sección [7](#7-soporte-técnico)). |
| La cita aparece como **Ausencia**, pero el cliente sí asistió. | No se registró el check-in antes de cumplirse los 10 minutos, o la recepción marcó la inasistencia. | El estado es final y no puede corregirse. Para evitarlo, registre la llegada a tiempo (ver [5.2.6](#526-registrar-la-llegada-del-cliente-check-in)). |
| La cita aparece como **Completada**, pero el servicio no se realizó. | Se había registrado el check-in, o era un servicio sin cita que no se canceló antes de su hora de inicio. | El estado es final y no puede corregirse. Informe a la gerencia. |
| La cita está en **Citas pasadas**, pero su estado aún es *Agendada*, *Reagendada* o *Iniciada* (cliente). | Su horario ya terminó y la pantalla no muestra todavía el estado actualizado. | Espere cerca de un minuto y actualice la página. |
| No se encuentra una cita *Completada*, *Cancelada* o *Ausencia* de días anteriores (personal). | Sin fechas, el listado solo muestra de hoy a los próximos 30 días. | Defina el periodo en **Fecha de servicio**. |
| *No encontramos esta cita.* (cliente) | La cita no existe en el sistema. | Presione **Volver a mis citas** y selecciónela desde el listado. |
| *No se pudo cargar la cita.* (cliente) | Falla de conexión o del servidor, o la cita no corresponde a su cuenta. | Presione **Reintentar**. Si continúa, regrese a **Mis Citas** y verifique la cuenta con la que inició sesión. |

*Situaciones en las que **Marcar inasistencia** no está disponible.* En una computadora, al colocar el cursor sobre el botón deshabilitado puede aparecer el motivo.

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| El botón no aparece. | Solo se muestra al **recepcionista**. | El gerente o asistente no puede marcar inasistencias. Solicítelo a la recepción de la sucursal o espere el cambio automático. |
| *Se habilita a partir de la hora programada de inicio.* | La cita aún no comienza. | Espere a la hora de inicio. Si el cliente avisó que no asistirá, puede cancelar la cita antes de esa hora (ver [5.2.5](#525-cancelar-una-cita)). |
| Ya es la hora, pero el botón sigue deshabilitado. | La hora del dispositivo puede ser incorrecta. | Compruebe la fecha y la hora del dispositivo, actualice la página y abra de nuevo la cita. |
| *Los walk-ins no se marcan como inasistencia.* | Es un servicio sin cita. | Si no se realizará y aún no llega su hora de inicio, cancélelo (ver [5.2.7](#527-registrar-un-servicio-sin-cita)). |
| *Solo se pueden marcar citas agendadas o reagendadas.* | La cita está *Iniciada*, *Completada* o *Cancelada*. | Revise el seguimiento para saber qué ocurrió. |
| *Esta cita ya está marcada como inasistencia.* | La *Ausencia* ya fue registrada. | No se requiere ninguna acción. |

*Mensajes que pueden aparecer al confirmar la inasistencia.* Se muestran dentro de la ventana **Confirmar inasistencia**. Actualmente, las respuestas del servidor aparecen en **inglés**. Si el sistema detecta que la cita ya cambió de estado, el botón puede mostrar **Cita ya cerrada**; en ese caso, cierre la ventana y actualice la página.

| Mensaje | Significado | Qué hacer |
|---|---|---|
| *Only scheduled or rescheduled appointments can be marked as no-show* | La cita ya cambió de estado; por ejemplo, otra persona registró la llegada o la canceló, o el sistema ya la marcó como *Ausencia*. | Actualice la página y revise el estado actual. |
| *Appointment can no longer be marked as no-show* | La cita cambió mientras se procesaba la solicitud. | Actualice la página y revise la cita. |
| *Appointment cannot be marked as no-show before its scheduled start* | Todavía no llega la hora de inicio; la hora del dispositivo puede estar adelantada. | Revise la hora del dispositivo y espere a la hora de inicio. |
| *Walk-in appointments cannot be marked as no-show* | Es un servicio sin cita. | No es posible marcarlo como inasistencia. |
| *Not authorized to mark this appointment as no-show* | La cuenta no es de recepción o la cita pertenece a otra sucursal. | Verifique la cuenta con la que inició sesión. Si el problema continúa, contacte al gerente o a soporte. |
| *Appointment not found* | La cita ya no existe en el sistema. | Actualice la página y vuelva a buscarla. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. Antes de repetir, actualice la página y compruebe si la cita ya aparece como *Ausencia*. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)) y compruebe el estado de la cita antes de repetir la acción. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

**Recomendaciones de uso**

- **Personal:** al comenzar la jornada, filtre **Fecha de servicio** con el día de hoy en ambas fechas para dar seguimiento a las citas del día.
- **Personal:** actualice la página antes de tomar una decisión sobre una cita, en especial cerca de su hora de inicio.
- **Personal:** antes de cerrar la jornada, revise las citas del día y confirme que sus estados correspondan con lo ocurrido. Comunique las diferencias a la gerencia.
- **Recepción:** antes de marcar una inasistencia, confirme que el cliente **no esté en la barbería** y que no haya avisado que viene en camino dentro de la tolerancia.
- **Recepción:** si no tiene certeza, **no marque la inasistencia**; el sistema lo hará al terminar el plazo si no se registra el check-in.
- **Recepción:** si el cliente llega después de que la cita quedó en *Ausencia* y desea atenderse, puede registrar un **servicio sin cita**, siempre que quede disponibilidad ese día (ver [5.2.7](#527-registrar-un-servicio-sin-cita)).
- **Cliente:** si no podrá asistir, **cancele o reprograme su cita con al menos 8 horas de anticipación**, para no dejarla pasar como *Ausencia*.
- **Cliente:** si el estado de una cita no corresponde con lo ocurrido, comuníquese con la barbería.

### 5.3 Obtener una recomendación de corte

**Perfil:** Cliente. El personal no cuenta con esta función. Para conocer cómo funciona la recomendación y qué reglas la rigen, consulte el apartado [4.5](#45-recomendación-personalizada-de-cortes). La recomendación es una **guía de apoyo**: no agenda una cita ni limita los servicios que puede reservar.

**Antes de comenzar:**

- Tenga una fotografía de su rostro, o un dispositivo con cámara para tomarla. La foto debe mostrar su **rostro y cabello**, de preferencia **de frente, con buena iluminación y sin gorra ni lentes**.
- Si sube un archivo, use una imagen en formato **JPG (JPEG), PNG o WEBP**, de **máximo 5 MB**. La pantalla permite elegir otros formatos de imagen (por ejemplo, GIF o HEIC), pero el análisis no los acepta.
- Cuente con una conexión estable a internet.
- Tenga en cuenta que, además de la foto y sus preferencias, la recomendación considera la **edad** y el **género** registrados en su cuenta.

> **Importante:** la plataforma conserva únicamente la **última foto que subió**. Cada foto nueva **reemplaza** a la anterior.

---

**A. Abrir la función y agregar la foto**

1. En el menú de navegación, presione **Recomendación de corte**. En teléfonos y tabletas, abra primero el menú ☰.
2. La pantalla contiene dos secciones: **Nueva recomendación** y **Recomendaciones anteriores**. En pantallas amplias aparecen lado a lado; en pantallas más pequeñas, el historial se encuentra debajo del formulario.
3. En **Nueva recomendación**, agregue la foto con **una** de las siguientes opciones.

> 📷 **[Apoyo visual pendiente — Figura 5.3-A]** Pantalla *Recomendación de corte* con el formulario *Nueva recomendación* vacío y la sección *Recomendaciones anteriores*.

**Opción 1 — Subir una foto del dispositivo**

1. Presione **Subir foto** y seleccione el archivo. En una computadora, también puede **arrastrar** la imagen hasta la zona de la foto.
2. Revise la vista previa. Para elegir otra imagen, presione **Cambiar foto** y repita el paso anterior.

**Opción 2 — Tomar una foto con la cámara**

1. Presione **Usar cámara**.
2. Si el navegador solicita permiso para usar la cámara, **permítalo**.
3. Espere a que desaparezca el texto **Iniciando cámara...** y aparezca la imagen. En los dispositivos con varias cámaras, la plataforma solicita la **frontal**.
4. Ubique su rostro de frente y presione **Tomar foto**. Para cerrar la cámara sin tomar la foto, presione **Cancelar**.
5. Revise la vista previa. Si no le convence, presione **Cambiar foto** y repita la toma.

**Opción 3 — Usar la última foto subida**

1. Marque la casilla **Usar la última foto subida**.
2. La zona de la foto se sustituye por el aviso *Se usará la última foto que subiste*. Para volver a elegir una foto, desmarque la casilla.

La casilla solo aparece si ya tiene al menos una recomendación en su historial. Esta opción **no muestra una vista previa** de la foto guardada. Corresponde a la última que se subió, **aunque la solicitud en la que la usó haya fallado**. Si no está seguro de cuál es, suba una foto nueva.

> 📷 **[Apoyo visual pendiente — Figura 5.3-B]** Zona de la foto con los botones *Subir foto* y *Usar cámara*, y la vista de la cámara con los botones *Tomar foto* y *Cancelar*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.3-C]** Vista previa de la foto con el botón *Cambiar foto*, y formulario con la casilla *Usar la última foto subida* marcada.

---

**B. Escribir las preferencias y solicitar la recomendación**

1. Si lo desea, en **Preferencias (opcional)** describa lo que busca: largo, estilo, mantenimiento u ocasión. Admite hasta **500 caracteres**; el contador indica cuántos ha escrito. Por ejemplo: *«Quiero un corte corto, fácil de peinar y adecuado para la oficina»*.
2. Presione **Obtener recomendación**.
3. Mientras se procesa, el botón muestra **Generando recomendación...** y permanece deshabilitado. El análisis puede tardar. **No cierre ni recargue la página** y espere a que aparezca el resultado.
4. Al terminar, se abre la ventana **Tu recomendación**.

El sistema trata sus preferencias como un **requisito**: si ningún corte disponible es compatible con ellas, no le propone el más parecido, sino que le informa que no encontró uno adecuado.

> 📷 **[Apoyo visual pendiente — Figura 5.3-D]** Formulario con la foto y las preferencias capturadas, y botón con el texto *Generando recomendación...*.

---

**C. Interpretar el resultado**

La ventana **Tu recomendación** puede mostrar uno de dos resultados.

**Resultado 1 — Cortes recomendados**

| Elemento | Cómo interpretarlo |
|---|---|
| **Cortes sugeridos** (etiquetas en la parte superior) | Cortes del catálogo propuestos para usted, ordenados **del más al menos adecuado** según el análisis. |
| **Mensaje de la recomendación** (texto debajo de los cortes) | Resumen de la recomendación. |
| **Por qué** | Razones de la propuesta, por ejemplo, la relación del corte con la forma de su rostro, las características visibles en la foto y sus preferencias. |
| **Confianza** | Porcentaje orientativo que el sistema asigna a su propia recomendación. No garantiza el resultado del corte. |

Para ver cómo es un corte:

1. Presione una etiqueta que tenga el **ícono de ojo**. Se muestra la foto de referencia del corte.
2. Para ocultarla, presione de nuevo la misma etiqueta. Para ver otro corte, presione su etiqueta.

El ícono puede tardar unos momentos en aparecer mientras se carga la imagen. Si un corte no lo muestra, solo está disponible su nombre. Las fotos son **de referencia**: no simulan cómo se verá el corte en usted.

En cuanto a la **confianza**, un porcentaje **bajo** puede indicar que la foto limitó el análisis, por ejemplo, porque está borrosa, el rostro está parcialmente cubierto o no está de frente. En ese caso, considere generar otra recomendación con una foto mejor. El valor es una estimación del servicio de análisis y puede variar.

**Resultado 2 — Ningún corte adecuado**

La ventana muestra el mensaje **«Ninguno de los cortes existentes parece ajustarse a tus preferencias, te sugerimos hablar directamente con tu barbero»** y, debajo, el **Motivo**. Este resultado **no es un error**. Puede:

1. Leer el **Motivo** para identificar qué preferencia no pudo cumplirse.
2. Cerrar la ventana, ajustar las **Preferencias** y solicitar otra recomendación.
3. Comentar su idea directamente con su barbero.

**Cerrar la ventana y volver a intentar**

- Para cerrar el resultado, presione la **X**, haga clic fuera de la ventana o presione la tecla **Esc**. Podrá consultarlo de nuevo en **Recomendaciones anteriores**.
- Después de generar una recomendación, la foto elegida y las preferencias permanecen en el formulario mientras no salga de la página ni la recargue.
- Para probar **otras preferencias con la misma foto**, marque **Usar la última foto subida**, modifique el texto y presione **Obtener recomendación**. Así evita volver a subirla y que el sistema identifique de nuevo la forma de su rostro. Si no marca la casilla y la foto sigue en la vista previa, se vuelve a subir.
- Cada solicitud genera un resultado nuevo, que puede ser distinto del anterior aunque use los mismos datos.

> 📷 **[Apoyo visual pendiente — Figura 5.3-E]** Ventana *Tu recomendación* con los cortes sugeridos, la foto de referencia de un corte, la explicación y la confianza.
>
> 📷 **[Apoyo visual pendiente — Figura 5.3-F]** Ventana *Tu recomendación* con el resultado de ningún corte adecuado y su *Motivo*.

---

**D. Consultar el historial de recomendaciones**

1. En la página **Recomendación de corte**, ubique la sección **Recomendaciones anteriores**.
2. Identifique la recomendación que busca. Se ordenan de la **más reciente a la más antigua** y cada una muestra:
   - la **fecha** en que se solicitó, y
   - los **nombres de los cortes** sugeridos o el texto **Sin corte adecuado**. Si ninguno de los cortes sugeridos sigue disponible en el sistema, puede aparecer solo la palabra **Recomendación**.
3. Presione la recomendación para **desplegarla**. Según el resultado, verá:
   - los cortes sugeridos, el texto bajo el título **Recomendación**, el apartado **Por qué** y la **Confianza**; o
   - el **Motivo** por el que ningún corte resultó adecuado.
4. Para ampliar la foto de un corte, presione su etiqueta con el **ícono de ojo**. Para cerrar la imagen, haga clic o toque **fuera de la ventana**, o presione la tecla **Esc**.
5. Presione de nuevo la recomendación para **contraerla**.

El historial no muestra la **foto** ni las **preferencias** que usó en cada solicitud. Tampoco permite eliminar recomendaciones. Las solicitudes que terminaron en error no aparecen.

> 📷 **[Apoyo visual pendiente — Figura 5.3-G]** Sección *Recomendaciones anteriores* con una recomendación desplegada y otra con *Sin corte adecuado*.
>
> 📷 **[Apoyo visual pendiente — Figura 5.3-H]** Foto ampliada de un corte, abierta desde el historial.

---

**Errores frecuentes y cómo resolverlos**

*Al agregar la foto.* Los mensajes aparecen en la zona de la foto o debajo de ella.

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *Sube o toma una foto para continuar.* | Presionó **Obtener recomendación** sin agregar una foto ni marcar la casilla para usar la anterior. | Agregue una foto o marque **Usar la última foto subida**, si está disponible. |
| *El archivo debe ser una imagen.* | El archivo elegido no es una imagen. | Elija una imagen JPG, PNG o WEBP. |
| *La imagen no debe pesar más de 5 MB.* | El archivo supera el tamaño permitido. | Reduzca su tamaño o resolución, o elija otra foto. |
| *Permiso de cámara denegado. Habilítalo en tu navegador o sube una foto.* | El navegador no tiene permiso para usar la cámara. | Habilite el permiso en el navegador y vuelva a abrir la cámara, o suba una foto. |
| *No se encontró ninguna cámara en este dispositivo.* | No se detectó una cámara. | Suba una foto. |
| *La cámara está siendo usada por otra aplicación.* | Otro programa está utilizando la cámara. | Cierre ese programa e intente de nuevo, o suba una foto. |
| *Tu navegador no permite usar la cámara. Sube una foto en su lugar.* | El navegador no permite el acceso a la cámara desde la página. | Suba una foto o utilice un navegador compatible (ver [2.1](#21-navegador-web-compatible)). |
| *No se pudo acceder a la cámara.* | Ocurrió otro problema al abrir la cámara. | Presione **Volver** e intente de nuevo, o suba una foto. |
| No aparece la casilla **Usar la última foto subida**. | Aún no tiene recomendaciones en su historial, o este no pudo cargarse. | Suba o tome una foto. Si ya tenía recomendaciones, recargue la página. |

*Al generar la recomendación.* Los errores del servidor pueden mostrarse en **inglés**.

| Mensaje | Causa probable | Qué hacer |
|---|---|---|
| *No pudimos usar tu última foto. Sube o toma una nueva para continuar.* | Al usar la foto guardada, esta no se encontró, no es válida o no permitió completar el análisis. | Suba o tome una foto nueva, de frente y bien iluminada. |
| *File is not a valid image (accepted formats: JPEG, PNG, WEBP)* | El formato no es aceptado o el archivo está dañado. Cambiar solo la extensión del nombre no convierte el formato. | Use una foto en formato JPG, PNG o WEBP, o tómela con **Usar cámara**. |
| *Image dimensions are too large* | La resolución de la imagen es demasiado grande, aunque el archivo pese menos de 5 MB. | Reduzca la resolución o use otra foto. |
| *Photo was not found* | El sistema no encontró la foto. | Suba la foto de nuevo. |
| Otro texto que describe un problema con la foto o los datos; puede variar. | El servicio no obtuvo información suficiente para recomendar, por ejemplo, porque no se distinguen el rostro y el cabello. | Use otra foto, de frente, con buena luz y el rostro y cabello visibles. |
| *Network error — could not upload the photo* | No fue posible enviar la foto, normalmente por un problema de conexión. | Revise su conexión e intente de nuevo. |
| *Photo upload failed with status …* | El servicio de almacenamiento rechazó la foto, por ejemplo, porque la subida tardó tanto que venció el permiso de 2 minutos. | Intente de nuevo con una conexión estable o una foto de menor tamaño. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. **Antes de repetir**, recargue la página y compruebe en el historial si la recomendación se generó. |
| *Facial detection request failed with status code: …* o *Network error. Could not call AI facial detection microservice* | Falló el servicio que analiza la forma del rostro. | Espere unos minutos e intente de nuevo. Si persiste, contacte a soporte. |
| *Haircut recommendation request failed with status code: …* o *Network error. Could not call AI microservice* | Falló el servicio de recomendación. | Espere unos minutos e intente de nuevo. Si persiste, contacte a soporte. |
| *No haircut styles were found* | No hay cortes activos disponibles en el catálogo. | Informe a la barbería o a soporte. Cambiar la foto no resuelve este problema. |
| *An unexpected error ocurred* | Ocurrió un error inesperado en el servidor. | Intente más tarde. Si persiste, contacte a soporte. |
| *No se pudo generar la recomendación. Intenta de nuevo.* | Ocurrió un error sin más detalles. | Intente de nuevo; si persiste, contacte a soporte. |
| El sistema le pide iniciar sesión nuevamente. | La sesión expiró. | Inicie sesión (ver [3.4](#34-expiración-de-la-sesión)), revise el historial y, si la recomendación no aparece, repita el procedimiento. |

*Al consultar el historial.*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *Cargando historial...* permanece en pantalla. | La consulta está tardando. | Espere unos momentos; si no termina, recargue la página. |
| *No se pudo cargar el historial. Intenta de nuevo.* o un mensaje en inglés dentro del historial. | Falla de conexión o del servidor. | Revise su conexión y recargue la página. |
| *Aún no has generado ninguna recomendación. Sube una foto para obtener la primera.* | No tiene recomendaciones guardadas. | No es un error: genere la primera. |
| Una recomendación recién generada no aparece. | No se pudo guardar o el historial no se actualizó. | Recargue la página. Si no aparece, informe a soporte. |
| Un corte no muestra el ícono de ojo. | No tiene foto de referencia o la imagen no pudo cargarse. | Espere unos momentos o recargue la página. Puede consultar el corte con su barbero. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico). Si va a reportarlo, indique el mensaje exacto que apareció.

**Recomendaciones de uso**

- **Tome la foto de frente**, con el rostro y el cabello visibles, luz uniforme y sin gorra, lentes ni filtros. Procure que aparezca **solo usted**.
- **Escriba preferencias concretas**, como el largo deseado, el tiempo que quiere dedicar al peinado o la ocasión. Si pide demasiadas condiciones a la vez, es más probable que ningún corte las cumpla.
- Si obtiene **Sin corte adecuado**, quite o flexibilice alguna preferencia y vuelva a intentarlo.
- Use **Usar la última foto subida** para comparar distintas preferencias. **Suba una foto nueva** si cambió su apariencia, si la anterior no era clara o si la última que subió no era de usted.
- Antes de agendar, revise las fotos de referencia y **confirme el corte con su barbero**, quien puede valorar aspectos que una fotografía no muestra.
- Para mostrar el corte en la barbería, abra **Recomendaciones anteriores** desde su teléfono.
- La recomendación **no queda vinculada a ninguna cita**. Si desea atenderse, agende el servicio correspondiente (ver [5.2.1](#521-agendar-una-cita-cliente)) y mencione el corte a su barbero.

### 5.4 Recordatorios

**Perfil:** Cliente. El personal no cuenta con esta función. Para conocer cuándo se envían los avisos y qué citas los generan, consulte el apartado [4.3](#43-recordatorios-automáticos).

Los recordatorios llegan por **Telegram**, aproximadamente **24 horas** y **4 horas** antes de cada cita. Una vez vinculada la cuenta, el envío es **automático**: ni el cliente ni el personal deben hacer algo para que se envíen.

**Antes de comenzar:**

- Tenga **Telegram** instalado en su teléfono y una cuenta de Telegram activa.
- Inicie sesión en la plataforma con **su propia cuenta** de cliente.
- De preferencia, abra la plataforma en una **computadora u otro dispositivo**, para poder escanear el código QR con la cámara de su teléfono.

> **Importante:** el código QR es **personal**. La cuenta de Telegram desde la que se abra quedará vinculada a **su** cuenta de la plataforma y recibirá sus recordatorios; si ya había otra vinculada, la nueva la reemplaza. No comparta el código ni publique capturas de pantalla en las que aparezca.

---

**A. Vincular su cuenta de Telegram**

La vinculación se realiza una sola vez.

1. En el menú de navegación, presione **Recordatorios**. En teléfonos y tabletas, abra primero el menú ☰.
2. Mientras la plataforma consulta su cuenta, aparece el texto **Verificando estado...**.
3. Si su cuenta no está vinculada, se muestra el título **Vincula tu cuenta** con un **código QR**.
4. Abra la cámara de su teléfono, o un lector de códigos QR, y apunte al código.
5. Abra el enlace que detecte el teléfono. Se mostrará en Telegram la conversación con el bot de Mr. Barber.
6. En Telegram, presione **Iniciar**. Según el idioma de la aplicación, el botón puede decir **Start**.
7. Espere el mensaje de confirmación del bot. Lo saluda por su nombre, indica que la cuenta quedó vinculada y que recibirá un aviso **24 horas** y **4 horas** antes de cada cita.
8. Regrese a la plataforma y compruebe la vinculación con el procedimiento B.

La pantalla no ofrece un enlace que pueda presionar; la vinculación se hace a través del código QR. Si solo dispone de su teléfono, puede tomar una captura de pantalla y abrirla con un lector que reconozca códigos QR en imágenes, si su teléfono cuenta con esa función. Elimine la captura al terminar.

> 📷 **[Apoyo visual pendiente — Figura 5.4-A]** Menú del cliente con la opción *Recordatorios* y pantalla *Vincula tu cuenta* con el código QR (cubra u oculte el código en la captura).
>
> 📷 **[Apoyo visual pendiente — Figura 5.4-B]** Conversación con el bot de Mr. Barber: botón *Iniciar* y mensaje de confirmación de la vinculación.

---

**B. Comprobar que la vinculación se completó**

1. Regrese a la pestaña o ventana donde tiene abierta la plataforma. La pantalla **Recordatorios** consulta el estado automáticamente al volver a ella.
2. Si todavía muestra el código QR, presione **Ya escanee el código**. Mientras se realiza la consulta, el botón muestra **Verificando...**.
3. La vinculación está completa cuando aparecen la etiqueta **Notificaciones Activas**, el título **Telegram vinculado** y la confirmación de que recibirá recordatorios 24 y 4 horas antes de cada cita.

Si la pantalla no cambia, no se muestra ningún mensaje de error: consulte la tabla de errores frecuentes. Puede volver a **Recordatorios** en cualquier momento para revisar si su cuenta sigue vinculada.

La etiqueta **Notificaciones Activas** indica que la cuenta tiene un Telegram vinculado, pero no comprueba que los mensajes puedan entregarse. Por ejemplo, la etiqueta se conserva aunque usted bloquee el bot.

> **Nota:** una vez vinculada la cuenta, la plataforma ya no muestra el código QR y no ofrece opciones para **desvincular** Telegram ni para **cambiar** la cuenta vinculada. Si cambió de cuenta de Telegram o vinculó una equivocada, consulte la sección [7. Soporte técnico](#7-soporte-técnico).

> 📷 **[Apoyo visual pendiente — Figura 5.4-C]** Pantalla *Recordatorios* con la etiqueta *Notificaciones Activas* y el mensaje *Telegram vinculado*.

---

**C. Revisar un recordatorio y actuar**

1. En Telegram, abra la conversación con el bot de Mr. Barber.
2. Revise el mensaje **Recordatorio de Cita - Mr. Barber**, que incluye:
   - su nombre;
   - el tiempo de anticipación del aviso (**24 horas** o **4 horas**), y
   - el **día y la hora** de la cita.
3. El mensaje **no indica la sucursal, el barbero ni los servicios**. Para consultarlos, ingrese a **Mis Citas** y abra el detalle de la cita (ver [5.2.3](#523-consultar-y-filtrar-citas)).
4. Actúe según su situación:

| Situación | Qué hacer |
|---|---|
| **Asistirá** a la cita | No necesita responder ni confirmar. Preséntese a la hora programada y registre su llegada con el personal. |
| Necesita **reprogramar o cancelar** y faltan **8 horas o más** | Hágalo desde **Mis Citas** (ver [5.2.4](#524-editar-o-reprogramar-una-cita) y [5.2.5](#525-cancelar-una-cita)). |
| Necesita **reprogramar o cancelar** y faltan **menos de 8 horas** | Ya no puede hacerlo desde su cuenta. Comuníquese con la barbería para que el personal le ayude. |

> **Importante:** el aviso de **24 horas** es el que le permite hacer cambios por su cuenta. Cuando llega el aviso de **4 horas**, el plazo de 8 horas ya terminó, aunque el mensaje invite a reprogramar o cancelar desde la plataforma.

Responder al mensaje en Telegram **no confirma, cambia ni cancela** la cita.

**Qué ocurre si la cita cambia**

- **Si cambia la fecha o la hora**, los avisos se calculan con el nuevo horario. Los mensajes enviados antes permanecen en Telegram con el horario anterior: tome como referencia lo que muestre **Mis Citas**.
- **Si solo cambia el barbero, los servicios o las notas**, no se repite un aviso que ya se había enviado.
- **Si la cita se cancela**, dejan de enviarse sus recordatorios. No se envía un mensaje para avisar de la cancelación.

**Citas con poca anticipación**

- Si al agendar o reprogramar faltan **menos de 23 horas y 30 minutos**, no recibirá el aviso de 24 horas.
- Si faltan **menos de 3 horas y 30 minutos**, no recibirá ningún aviso.
- Durante los **15 minutos por encima de cada límite**, el aviso **no está garantizado**: que llegue o no depende del momento en que el sistema realice su siguiente revisión. Esto ocurre con el aviso de 24 horas si faltan entre **23 horas y 30 minutos** y **23 horas y 45 minutos**, y con el de 4 horas si faltan entre **3 horas y 30 minutos** y **3 horas y 45 minutos**.

> 📷 **[Apoyo visual pendiente — Figura 5.4-D]** Ejemplo de recordatorio de cita recibido en Telegram (sin datos personales reales).

---

**Errores frecuentes y cómo resolverlos**

*Al vincular la cuenta.*

| Situación o mensaje | Causa probable | Qué hacer |
|---|---|---|
| *Verificando estado...* no desaparece. | La consulta de su cuenta está tardando. | Revise su conexión y recargue la página. |
| El código queda en *Generando QR...* | La plataforma no pudo generar el código. | Recargue la página. Si persiste, contacte a soporte. |
| Al escanear, no se abre la conversación en Telegram. | Telegram no está instalado o el lector no abrió el enlace. | Instale o actualice Telegram y vuelva a escanear. Pruebe con otro lector de códigos QR. |
| El bot solo le da la bienvenida y le pide escanear el código. | Abrió el bot directamente, sin el enlace del código QR. | Vuelva a **Recordatorios** y escanee el código. |
| *El enlace de vinculación no es válido. Genera un nuevo código QR desde tu cuenta.* | El enlace está incompleto o fue modificado. | Recargue **Recordatorios** y escanee el código nuevamente. |
| *No encontramos tu cuenta de cliente en el sistema.* | El código no corresponde a una cuenta de cliente existente. | Inicie sesión con su cuenta de cliente y escanee el código que se muestre. |
| *Ocurrió un error al vincular tu cuenta. Intenta escanear el código nuevamente.* | Ocurrió una falla al guardar la vinculación. | Espere unos minutos y vuelva a escanear. Si persiste, contacte a soporte. |
| El bot no responde después de presionar **Iniciar**. | Problema de conexión o el servicio del bot no está disponible. | Revise su conexión e intente más tarde. Si persiste, contacte a soporte. |
| La pantalla sigue mostrando el código después de la confirmación del bot. | La pantalla no se ha actualizado, no pudo consultar su cuenta o abrió un código de otra cuenta. | Presione **Ya escanee el código** o recargue la página. Compruebe que la sesión abierta sea la suya. |

*Al esperar un recordatorio.*

| Situación | Causa probable | Qué hacer |
|---|---|---|
| El aviso no llegó a la hora exacta. | El sistema revisa las citas cada 15 minutos. | Una diferencia de algunos minutos es normal. |
| No llegó ningún aviso. | La cuenta no está vinculada, el bot está bloqueado, la cita no cumple las condiciones o se agendó con poca anticipación. | Revise **Recordatorios** y el estado de la cita en **Mis Citas**; compruebe que no haya bloqueado el bot. Consulte las condiciones en [4.3](#43-recordatorios-automáticos). |
| Solo llegó el aviso de 4 horas. | Agendó o reprogramó con poca anticipación, o vinculó su cuenta cuando el primer aviso ya no correspondía. | No es necesario hacer nada. |
| Los mensajes llegan a otra cuenta de Telegram. | La cuenta se vinculó desde ese Telegram. | Contacte a soporte; la pantalla no permite cambiar la vinculación. |
| El horario del mensaje no coincide con **Mis Citas**. | La cita cambió después de que se envió el mensaje. | Tome como referencia **Mis Citas**. Si tiene dudas, comuníquese con la barbería. |

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico). Si va a reportarlo, indique el mensaje exacto que apareció y la fecha y hora de la cita afectada.

**Recomendaciones de uso**

*Para el cliente:*

- **Vincule Telegram antes de agendar**, para poder recibir los dos avisos desde su primera cita.
- Conserve la conversación con el bot y **no lo bloquee**. Active las notificaciones de Telegram en su teléfono; puede silenciar otras conversaciones, pero evite silenciar la de Mr. Barber.
- Al recibir el aviso de 24 horas, **confirme que podrá asistir**. Si necesita hacer cambios, realícelos de inmediato.
- No dependa únicamente de los recordatorios: consulte **Mis Citas** para verificar sus próximas citas.

*Para el personal:*

- Al atender o agendar a un cliente registrado, **invítelo a activar sus recordatorios**. La vinculación debe hacerla el cliente desde su cuenta.

### 5.5 Mi perfil

**Perfil:** Cliente. El personal no cuenta con esta pantalla. En **Mi perfil**, el cliente puede consultar y actualizar sus datos personales, cambiar su contraseña, cerrar sesión y eliminar su cuenta.

**Antes de comenzar:**

- Inicie sesión con su cuenta de cliente (ver [3.3](#33-proceso-de-inicio-de-sesión)).
- Si va a cambiar su correo o teléfono, verifique que el nuevo dato sea correcto y que no esté registrado en otra cuenta.
- Si va a eliminar su cuenta, lea primero el procedimiento E completo: la eliminación **no se puede deshacer**.

---

**A. Consultar sus datos**

1. En el menú de navegación, presione **Mi Perfil**. En teléfonos y tabletas, abra primero el menú ☰.
2. En la primera tarjeta aparecen sus iniciales, su nombre y la etiqueta **Cliente**, junto con los siguientes datos:

| Campo | Contenido |
|---|---|
| **Nombre Completo** | Nombre y apellido de la cuenta. |
| **Correo electrónico** | Correo con el que inicia sesión. |
| **Teléfono** | Número registrado. Si no tiene uno, aparece **Sin teléfono**. |
| **Fecha de nacimiento** | Fecha en formato día/mes/año. |
| **Género** | **Femenino**, **Masculino** u **Otro**. |

Debajo de sus datos se encuentran los botones **Cambiar Contraseña** y **Actualizar Datos**. Más abajo están las opciones **Cerrar Sesión** y **Eliminar Cuenta**.

Esta pantalla no muestra el historial de citas ni el avance del programa de fidelidad.

> 📷 **[Apoyo visual pendiente — Figura 5.5-A]** Pantalla *Mi perfil* completa, con datos ficticios.

---

**B. Actualizar sus datos personales**

1. En **Mi perfil**, presione **Actualizar Datos**.
2. Se abre la ventana **Editar usuario**, con sus datos actuales.
3. Modifique los campos necesarios. Los marcados con asterisco (`*`) son obligatorios.

| Campo | Cómo llenarlo |
|---|---|
| **Nombre \*** | Al menos 2 caracteres. |
| **Apellido \*** | Al menos 2 caracteres. |
| **Teléfono** | Exactamente 10 dígitos, sin espacios ni guiones. Es opcional; para quitarlo, deje el campo vacío. |
| **Fecha de nacimiento** | Formato *dd/mm/aaaa*. Puede escribir solo los números, ya que las diagonales se agregan solas, o elegir la fecha con el ícono de calendario. No puede ser futura ni anterior a 1900. |
| **Género** | Seleccione **Femenino**, **Masculino** u **Otro**. |
| **Correo Electrónico \*** | Formato `usuario@dominio.com`. No puede pertenecer a otra cuenta. |

4. Revise la información y presione **Actualizar Usuario**.
5. Mientras se guardan los cambios, el botón muestra **Actualizando...**.
6. Al terminar, la ventana se cierra, aparece el mensaje **Usuario actualizado correctamente.** y la pantalla muestra los nuevos datos.

Para salir **sin guardar**, presione **Cancelar** o la **X**, haga clic fuera de la ventana o presione la tecla **Esc**. Los cambios se descartan sin pedir confirmación.

**Efectos de los cambios**

- **Correo electrónico:** en los siguientes inicios de sesión, use el correo **nuevo**.
- **Fecha de nacimiento y género:** las siguientes recomendaciones de corte consideran los datos actualizados (ver [5.3](#53-obtener-una-recomendación-de-corte)).
- **Fecha de nacimiento:** no es posible dejarla sin valor. Si borra el campo y guarda, se conserva la fecha anterior.

> 📷 **[Apoyo visual pendiente — Figura 5.5-B]** Ventana *Editar usuario* y mensaje *Usuario actualizado correctamente.*

---

**C. Cambiar su contraseña**

1. En **Mi perfil**, presione **Cambiar Contraseña**.
2. En **Nueva contraseña**, escriba una contraseña que tenga:
   - al menos **8 caracteres**;
   - al menos **una letra mayúscula**, y
   - al menos **un número**.
3. Escríbala de nuevo en **Confirmar nueva contraseña**. Puede usar el ícono de ojo de cada campo para mostrarla u ocultarla.
4. Presione **Cambiar contraseña**. Mientras se guarda, el botón muestra **Actualizando...**.
5. Al terminar, aparece el mensaje **Contraseña actualizada correctamente.**
6. En el siguiente inicio de sesión, use la contraseña nueva.

La ventana **no solicita la contraseña actual**. Al cambiarla, la sesión en la que realiza el cambio permanece abierta, y las sesiones que tenga en otros dispositivos **no se cierran de inmediato**: pueden continuar activas hasta que expiren (ver [3.4](#34-expiración-de-la-sesión)).

> **Importante:** como no se pide la contraseña actual, cualquier persona con acceso a su sesión abierta puede cambiarla. **Cierre sesión** cuando use un equipo compartido o público.

Si olvidó su contraseña y no tiene una sesión abierta, consulte [3.6](#36-recuperación-de-contraseña).

> 📷 **[Apoyo visual pendiente — Figura 5.5-C]** Ventana *Cambiar contraseña* con los campos ocultos.

---

**D. Cerrar sesión desde el perfil**

1. En la tarjeta **Cerrar Sesión**, presione el botón **Cerrar Sesión**.
2. En la ventana **¿Cerrar sesión?**, presione **Sí, cerrar sesión**. Para permanecer en la plataforma, presione **Cancelar**.

También puede cerrar sesión desde el menú de navegación (ver [3.5](#35-cierre-de-sesión)).

> 📷 **[Apoyo visual pendiente — Figura 5.5-D]** Ventana *¿Cerrar sesión?* abierta desde el perfil.

---

**E. Eliminar su cuenta**

> **Importante:** esta acción es **permanente**. No hay forma de recuperar la cuenta desde la plataforma.

Solo puede eliminar su cuenta si **no tiene citas pendientes** (**Agendadas** o **Reagendadas**) **ni en curso** (**Iniciadas**).

**Qué pierde al eliminar la cuenta**

- Sus datos de acceso y datos de perfil: ya no podrá iniciar sesión con esa cuenta.
- El acceso a su **historial de citas**.
- Su avance en el **programa de fidelidad**, incluidas las recompensas que no haya utilizado.
- Su historial de **recomendaciones de corte**.
- La vinculación con **Telegram** para recibir recordatorios.

La barbería **conserva registros de las citas**, incluido el correo que tenía la cuenta al agendarlas, aunque ya no queden ligados a ella.

**Antes de eliminarla**

1. Ingrese a **Mis Citas** y revise la pestaña **Próximas citas**.
2. Compruebe que no tenga citas **Agendadas**, **Reagendadas** o **Iniciadas**. Mientras tenga alguna, la plataforma **no le permitirá eliminar la cuenta**.
3. Si no va a asistir a una cita pendiente, **cancélela** (ver [5.2.5](#525-cancelar-una-cita)). La plataforma **no cancela sus citas automáticamente**. Si va a asistir, elimine la cuenta después de que la cita haya concluido.
4. Si necesita cancelar una cita, pero faltan menos de 8 horas, comuníquese con la barbería. Si tiene una cita **en curso**, espere a que concluya.
5. Anote o guarde la información que quiera conservar, por ejemplo, los cortes que le recomendaron.

**Cómo eliminarla**

1. En **Mi perfil**, en la tarjeta **Eliminar Cuenta**, presione **Eliminar Cuenta**.
2. Lea la advertencia de la ventana **¿Eliminar cuenta permanentemente?**.
3. En el campo de confirmación, escriba **ELIMINAR**, en mayúsculas y sin espacios adicionales. El botón **Sí, eliminar cuenta** permanece deshabilitado mientras el texto no coincida.
4. Presione **Sí, eliminar cuenta**. Mientras se procesa, el botón muestra **Eliminando...**.
5. Si **tiene citas pendientes o en curso**, la cuenta **no se elimina** y aparece un mensaje que explica el motivo. Su cuenta, sus datos y sus citas se conservan. Presione **Cancelar** para cerrar la ventana, revise los pasos de **Antes de eliminarla** y vuelva a intentarlo cuando ya no tenga esas citas.
6. Si no las tiene, al terminar se cierra la sesión y la plataforma lo lleva a la página principal.

Para conservar la cuenta, presione **Cancelar** antes de confirmar. También puede cerrar la ventana haciendo clic fuera de ella o presionando la tecla **Esc**.

Después puede registrarse de nuevo, incluso con el mismo correo (ver [3.2](#32-registro-de-un-cliente-nuevo)). La cuenta nueva **no recupera** las citas, recompensas ni recomendaciones de la anterior.

> 📷 **[Apoyo visual pendiente — Figura 5.5-E]** Ventana *¿Eliminar cuenta permanentemente?* con el campo de confirmación vacío y el botón deshabilitado.

---

**Errores frecuentes y cómo resolverlos**

Los errores del servidor pueden mostrarse en **inglés**.

*Al actualizar los datos.*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *El nombre es obligatorio.* / *El apellido es obligatorio.* / *El correo es obligatorio.* | Un campo obligatorio está vacío. | Complete el campo indicado. |
| *Debe tener al menos 2 caracteres.* | El nombre o apellido es demasiado corto. | Escriba al menos 2 caracteres. |
| *Debe tener 10 dígitos.* | El teléfono tiene menos o más dígitos, espacios u otros símbolos. | Escriba exactamente 10 dígitos o deje el campo vacío. |
| *El correo no es válido.* | El correo no tiene el formato esperado. | Revise que esté escrito como `usuario@dominio.com`. |
| *Usa el formato dd/mm/aaaa.* | La fecha está incompleta o no existe en el calendario. | Corrija el día, mes y año. |
| *La fecha de nacimiento no puede ser en el futuro.* / *La fecha de nacimiento no es válida.* | La fecha es posterior a hoy o anterior a 1900. | Escriba su fecha de nacimiento correcta. |
| *Email is already registered* | El correo pertenece a otra cuenta. | Use otro correo. Si considera que le pertenece, contacte a soporte. |
| *Phone is already registered* | El teléfono pertenece a otra cuenta. | Revise el número, use otro o contacte a soporte. |
| Un texto técnico que contiene *"field"* y *"detail"*. | El servidor rechazó un dato. | El valor junto a *"field"* identifica el campo. Corríjalo; verifique, por ejemplo, que el nombre y apellido no sean solo espacios. |
| *Network error — could not reach the API* | No hubo conexión con el servidor. | Revise su conexión. Recargue la página para comprobar sus datos antes de intentar de nuevo. |
| *No se pudo actualizar el usuario* u otro mensaje del servidor. | No se pudo completar la actualización. | Intente más tarde. Si persiste, contacte a soporte. |

*Al cambiar la contraseña.*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| *Debe capturar la nueva contraseña y su confirmación.* | Falta la nueva contraseña o su confirmación. | Complete los dos campos que aparecen. |
| *La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.* | La contraseña no cumple los requisitos. | Ajústela según los requisitos. |
| *La confirmación no coincide con la nueva contraseña.* | Los dos campos son diferentes. | Escriba exactamente la misma contraseña en ambos. |
| *Ocurrió un error al actualizar la contraseña. Intente nuevamente.* | Falla de conexión o del servidor. | Revise su conexión e intente de nuevo. Si no sabe cuál contraseña quedó activa, pruebe primero la nueva al iniciar sesión. |

*Al eliminar la cuenta.*

| Situación o mensaje | Causa | Qué hacer |
|---|---|---|
| El botón **Sí, eliminar cuenta** está deshabilitado. | El texto de confirmación no es exactamente **ELIMINAR**. | Escríbalo en mayúsculas y sin espacios. |
| Un mensaje indica que no puede eliminar la cuenta porque tiene citas pendientes o en curso. | Tiene al menos una cita **Agendada**, **Reagendada** o **Iniciada**. | Revise **Mis Citas**. Cancele las citas pendientes a las que no asistirá o espere a que concluyan. Si no puede cancelar una porque faltan menos de 8 horas, comuníquese con la barbería. |
| *Network error — could not reach the API* | No hubo respuesta del servidor. | Revise su conexión y recargue la página antes de intentar de nuevo; la solicitud pudo haberse procesado. |
| *No se pudo eliminar la cuenta. Intenta de nuevo.* u otro mensaje del servidor. | No se pudo completar la eliminación. | Intente más tarde. Si persiste, contacte a soporte. |

*En general.* Si aparece **Tu sesión expiró** o el sistema lo envía a la pantalla de inicio de sesión, ingrese de nuevo (ver [3.4](#34-expiración-de-la-sesión)) y revise en **Mi perfil** si el cambio se guardó.

Si el problema persiste, consulte la sección [7. Soporte técnico](#7-soporte-técnico). Si va a reportarlo, indique el mensaje exacto, pero **nunca comparta su contraseña**.

**Recomendaciones de uso**

- **Mantenga actualizados su correo y teléfono**, y revise que el correo esté bien escrito antes de guardar.
- **Registre correctamente su fecha de nacimiento y género**, ya que se consideran en las recomendaciones de corte.
- Use una **contraseña distinta** de las que utiliza en otros servicios y no la comparta.
- **Cierre sesión** al terminar en equipos compartidos o públicos.
- Si solo quiere dejar de usar la cuenta temporalmente, **cierre sesión en lugar de eliminarla**.

### 5.6 Historial del cliente

*(por desarrollar)*

### 5.7 Programa de fidelidad

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
