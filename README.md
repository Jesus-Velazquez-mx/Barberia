# Mr. Barber App

Mr. Barber es una plataforma de gestión para barberías. Su enfoque principal es la **gestión de citas**: los clientes reservan cortes según la disponibilidad de cada barbero, y el personal de la tienda administra la operación diaria de su sucursal. La plataforma está pensada para varias sucursales (el objetivo inicial son dos).

El producto se entrega como:

- una **aplicación web** que atiende a todos los roles (clientes, recepcionistas y gerentes), y
- una **aplicación Android** solo para clientes. Las funciones de personal, como el check-in y el registro de clientes sin cita, son exclusivas de la web por diseño.

## Qué hace

- **Reservas y gestión de citas.** Clientes y personal reservan citas según el turno y la disponibilidad del barbero. Las citas se pueden editar (reprogramar, reasignar barbero o cambiar servicios) o cancelar, con reglas según el rol. También se admiten clientes sin cita (walk-ins) y reservas para clientes no registrados (invitados).
- **Recomendaciones de corte con IA.** El cliente envía una foto, el sistema detecta la forma del rostro y sugiere cortes del catálogo de la barbería. La sugerencia es orientativa y no limita lo que el cliente puede reservar.
- **Programa de lealtad.** Por cada 6 servicios pagados, el cliente gana un servicio gratis. Las recompensas son válidas en todas las sucursales.
- **Operación de la barbería.** Los gerentes configuran sucursales, turnos, barberos, recepcionistas y el catálogo de servicios compartido. Cada sucursal lleva su propio inventario de insumos, con alertas automáticas de reabastecimiento cuando el stock es bajo.

Planeado pero aún no implementado: recordatorios de citas por WhatsApp y correo electrónico, y reportes para gerencia.

## Usuarios y roles

| Rol | Acceso |
|---|---|
| **Cliente** | Reserva, edita y cancela sus propias citas; recibe recomendaciones de corte; consulta su saldo de lealtad. |
| **Recepcionista** | Gestiona las citas del día a día solo de su sucursal asignada. |
| **Gerente** | Administra el catálogo de servicios, las sucursales que supervisa, el personal, los horarios y los insumos de esas sucursales. |
| **Barbero** | No es usuario del sistema. Su agenda la administra el gerente de la sucursal. |

El registro en línea siempre crea una cuenta de cliente. Las cuentas de recepcionista y gerente las da de alta el personal.

## Stack tecnológico

| Área | Tecnologías |
|---|---|
| API backend | Node.js, Express 5, TypeScript (ESM), validación con `zod`, autenticación JWT, bcrypt |
| Base de datos | PostgreSQL 18 (AWS RDS) |
| Frontend web | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, React Hook Form |
| Cliente Android | Kotlin, Jetpack Compose, Hilt, Retrofit, DataStore |
| Servicio de IA | Python, FastAPI, PyTorch (modelo de forma de rostro), proveedor LLM (API de Anthropic u Ollama local) |
| Almacenamiento | AWS S3 (bucket privado para las fotos de los clientes) |
| Infraestructura | Docker, AWS EC2, Apache (proxy inverso), Cloudflare (DNS, TLS, hosting con Workers), CI/CD con GitHub Actions |

## Arquitectura

El repositorio contiene cuatro proyectos independientes. Cada uno tiene sus propias dependencias y no comparten herramientas de workspace.

```text
  Web SPA (React)            App Android (Compose)
  Cloudflare Worker          solo clientes
          \                      /
           \   REST / JSON      /
            v                  v
        API backend (Express 5, Docker en EC2)
          |              |                 |
          v              v                 v
     PostgreSQL (RDS)   Servicio de IA   AWS S3
                        (FastAPI)        fotos de clientes
                           |
                           v
                  LLM: API de Anthropic u Ollama
```

Puntos clave del diseño:

- **El backend es el único componente que se comunica con la base de datos, S3 y el servicio de IA.** Los clientes (web y Android) solo llaman a la API REST.
- **Backend por capas.** Las peticiones pasan por `routes` → `controllers` → `services` → `repositories`. La autorización vive en la capa de servicios (`userPermissions.ts`), no en middleware, así que las reglas de alcance se aplican donde sea que se invoque un servicio.
- **Envoltorio uniforme de la API.** Cada respuesta tiene la forma `{ data, message, error }`. Los errores de negocio son errores tipados que se traducen a códigos HTTP. Los clientes desempaquetan ese mismo envoltorio.
- **La disponibilidad se calcula, no se guarda.** Los horarios libres se derivan del turno de cada barbero y de sus citas existentes. Al reservar se bloquea la fila del barbero para evitar dobles reservas.
- **Parte de la lógica de negocio vive en la base de datos.** Los triggers garantizan la consistencia de roles, el contador de lealtad, la marca de reabastecimiento, las protecciones al eliminar y `updated_at`. El archivo de esquema es la única fuente de verdad, ya que el proyecto no usa una herramienta de migraciones.
- **Las fotos nunca pasan por el backend.** El cliente sube su foto directamente a S3 con una URL prefirmada. Después, el backend envía solo la clave de S3 al servicio de IA, que descarga la imagen por sí mismo. La clave nunca se toma del cliente, así que un usuario no puede pedir la foto de otro.
- **El servicio de IA no guarda estado.** No tiene base de datos y recibe en cada petición todos los datos que necesita. Solo lo llama el backend, autenticado con una clave de API interna. Las recomendaciones de corte se limitan al catálogo de la propia sucursal.

## Estructura del repositorio

```text
Barberia/
├── backend/        API en Express 5 + TypeScript, esquema de PostgreSQL, pruebas de integración
│   ├── src/        routes, controllers, services, repositories, types, utils, errors
│   └── database/   init_database.sql (esquema y triggers), scripts de datos de prueba y utilidades
├── frontend/       App web en React 19 + Vite (Tailwind v4)
│   └── src/        pages → containers → components, context, services, router
├── ai_service/     Microservicio FastAPI: detección de forma de rostro y recomendación de cortes
│   └── app/        api, services, llm, schemas, core, utils, test
├── android/        Cliente en Kotlin + Jetpack Compose (Clean Architecture, Hilt)
│   └── app/src/    features/<nombre>/{data, domain, presentation, di}
├── docs/           Documentos de negocio y de arquitectura técnica
├── .github/        Flujo de CI/CD (filtrado por ruta para cada proyecto)
└── Dockerfile      Imagen multietapa del backend
```

## Resumen de despliegue

- **Frontend web**: se compila con Vite y se despliega como Cloudflare Worker, con enrutamiento de single-page application.
- **Backend**: se empaqueta como imagen de Docker y corre en una sola instancia EC2 de AWS. Un proxy inverso Apache termina el TLS del dominio que pasa por Cloudflare. La base de datos es AWS RDS (PostgreSQL) y las fotos se guardan en un bucket privado de S3.
- **Servicio de IA**: imagen de Docker con el modelo de forma de rostro incluido. Está planeado que corra en un servidor local accesible desde EC2 mediante una red privada de Tailscale.
- **CI/CD**: GitHub Actions ejecuta las pruebas de cada proyecto solo cuando ese proyecto cambia. Los despliegues solo se hacen desde la rama `main`.

## Documentación

- [`docs/barbershop-app-overview.md`](docs/barbershop-app-overview.md): contexto de negocio, reglas del producto y preguntas abiertas.
- [`docs/architecture.md`](docs/architecture.md): arquitectura técnica, modelo de datos, contrato de la API y detalles de despliegue.
- [`docs/epic-appointment-status-business-rules.md`](docs/epic-appointment-status-business-rules.md) y [`docs/edit_cancel_reservations_rules.md`](docs/edit_cancel_reservations_rules.md): reglas de negocio sobre el estado de las citas y la edición o cancelación de reservas.

## Estado del proyecto

- **Backend**: la API principal está implementada, incluyendo autenticación, usuarios, clientes, personal, sucursales, turnos, catálogo de servicios, insumos, citas (crear, listar, editar, cancelar), disponibilidad y recomendaciones de IA. Aún no están construidos: creación de citas sin cita previa (walk-ins), check-in, transiciones a completada y no-show, canje de recompensas por la API, movimientos de stock de insumos, notificaciones y reportes.
- **Web**: vistas por rol para clientes, gerentes y recepcionistas. Algunas vistas de gestión de clientes para el personal todavía usan datos simulados.
- **Servicio de IA**: la detección de forma de rostro y la recomendación de cortes están implementadas. Todavía no forma parte del CI/CD.
- **Android**: pantallas de inicio de sesión, inicio y perfil. Las pantallas de reservas, citas, recomendaciones y lealtad aún no están construidas.
