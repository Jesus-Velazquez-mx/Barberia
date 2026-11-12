# Barbershop App — Technical Architecture

For the product/business context behind these decisions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).

## 1. System Components & Tech Stack

The repository is a monorepo of four independent projects, each with its own dependencies and no shared workspace tooling:

- **`backend/`** — Express 5 + TypeScript (ESM) + PostgreSQL (`pg`). Owns the database, the business rules, and the orchestration of the AI service and S3.
- **`frontend/`** — Vite + React 19 + TypeScript + Tailwind v4 single-page app, deployed as a Cloudflare Worker.
- **`ai_service/`** — stateless FastAPI microservice (Python, `uv`) for face-shape detection and haircut recommendations. Called only by the backend.
- **`android/`** — Kotlin + Jetpack Compose client (feature-based Clean Architecture, Hilt DI). Client-facing only by design: it serves clients exclusively, and staff (receptionist/manager) features such as check-in and walk-in registration are web-only.

All clients talk to the Express backend over REST; none of them talk to PostgreSQL, S3, or the AI service directly. The backend is the only component that does. There is no iOS codebase yet. The system supports multiple barbershop locations, starting with 2; this is a confirmed multi-tenancy requirement and is reflected in the data model (see §1.4).

**Implementation status at a glance**

- **Backend**: every route group needed by the current feature set is implemented end to end — auth, users, clients, managers, barbers, receptionists, shops, shifts, service categories and offered services, supplies and supply categories, appointments (create, list, get, edit, cancel), availability, and AI recommendations with S3 photo upload. Not implemented: creating walk-ins, and endpoints that move an appointment to `checked_in`, `completed` or `no_show`; reward redemption at the API level; supply stock movements; reminders and notifications; reporting; route-level role middleware (role checks live in services); refresh tokens; reassigning a barber's shift or shop.
- **Web**: role-gated routes for clients, managers and receptionists, with most flows wired to the API. Client CRUD for staff views is still mock-backed (see §1.1). A placeholder page component exists but is not routed.
- **AI service**: face-shape detection and haircut recommendation are implemented. It is not deployed by CI.
- **Android**: login, home and profile screens only (view, edit, delete account, logout). No booking, appointments, recommendations or loyalty screens yet.

### 1.1 Client applications

All clients are "thin": they hold UI state and call the backend API.

- **Web (Vite + React 19 + TypeScript + Tailwind v4)** — a client-side single-page app with no SSR and no server-side logic. Routing is `react-router-dom` v7 (`createBrowserRouter`); forms use `react-hook-form`.
  - **Routes**: public landing (`/`), `/login`, `/register`; `/client/*` (home, booking, appointments and detail, recommend-haircut, profile); `/manager/*` (home, staff, clients, appointments, booking, inventory with supplies and supply categories, management with shops, shifts, services and service categories); `/receptionist/*` (home, appointments, booking, clients, inventory, services). Each group is wrapped in `components/auth/RoleProtectedRoute.tsx`. Barbers have no account, so there is no barber-facing view.
  - **Structure**: `pages/` (route-level composition) → `containers/` (state and logic, e.g. `LoginContainer.tsx`) → `components/` (presentational). `context/AuthContext.tsx` holds the authenticated user and token and persists both to `localStorage`.
  - **API access**: `services/apiClient.ts` is a thin `fetch` wrapper around `VITE_API_URL`. It unwraps the `{data, message, error}` envelope and throws a typed `ApiError`. Per-domain modules (`authService`, `appointmentService`, `availabilityService`, `recommendationService`, `shiftService`, `shopService`, `staffService`, `supplyService`, `supplyCategoryService`, `offeredServiceService`, `serviceCategoryService`, `userService`, `clientService`) build on it.
  - **Mocks**: `services/clientService.ts` returns mock data for list, create, update and delete (`mocks/adminMock.ts`). Only `searchClients` calls the API. `mocks/supplyMock.ts` is not imported anywhere.
  - **Deployment**: `wrangler.toml` defines the production Worker `barberia-frontend` (served at `barberia.erickdh.com`) and a `[env.staging]` Worker, `barberia-frontend-staging`. CI deploys only to production, from `main` (see §3.1). No CI step deploys the staging Worker.
- **Android (Kotlin + Jetpack Compose)** — `minSdk` 26, `targetSdk` 37, Hilt, Retrofit, DataStore. Features live under `features/<name>/{data,domain,presentation,di}`: `login`, `home` (current user) and `perfil` (view, edit via `PUT /api/users`, delete account via `DELETE /api/users/:id`, logout). The session is persisted through DataStore (`core/datastore`). Debug builds point `BASE_URL` at `http://10.0.2.2:3000/` (the emulator's host loopback). There is no Android CI yet.
- **iOS (Swift)** — planned, not started.

All clients share one OpenAPI contract (REST). The backend generates it with `swagger-jsdoc` / `swagger-ui-express`, served at `/api-docs`, from JSDoc annotations on each route file. Generating client SDKs from that spec is not set up yet.

### 1.2 Backend (Express + PostgreSQL, EC2)

**Owns:**

- **Auth and authorization.** Email/password login and self-registration (always as `client`), and a token-verification endpoint. Role and scope checks are enforced in services, through `services/userPermissions.ts`, not in middleware (see §4).
- **Appointments.** Create, list, get, edit (`PUT /api/appointments/:id`) and cancel (`PUT /api/appointments/:id/cancel`) are implemented. Availability is computed in `availabilityService.ts`. Walk-ins are modeled in the schema but cannot yet be created through any route. Nothing yet moves an appointment to `checked_in`, `completed` or `no_show`. See "Appointment editing & cancellation" below.
- **Staff and organization.** Barbers (`/api/barbers`), receptionists (`/api/receptionists`), managers (`PUT /api/managers`, title only), shops (`/api/shops`, with `/:id/barbers`, `/:id/receptionists` and `/:id/availability`), and shifts (`/api/shifts`).
- **Catalogs and inventory.** Service categories (`/api/servicesCategories`) and offered services (`/api/offeredServices`, backed by the `services` table) are shared across shops. Supply categories (`/api/suppliesCategories`) and supplies (`/api/supplies`) are per shop. Supply stock and movements are modeled in the schema but no code reads or writes them yet.
- **Clients.** `/api/clients` (list, get, create, update, delete), plus `PUT /api/clients` for a client updating their own record.
- **Users.** `PUT /api/users` (shared personal data) and `DELETE /api/users/:id`, with the rules in `userPermissions.ts` (see §1.4).
- **AI recommendations.** `POST /api/recommendations/generate`, `GET /api/recommendations` (history), `GET /api/recommendations/test` (AI health passthrough), and `GET /api/presigned-url` (S3 upload for a client's photo). See §1.3 and §1.5.
- **Loyalty.** Modeled as a running counter on `clients`, maintained by a DB trigger (see §1.4). No application-level redemption flow exists yet.
- **Notifications and reporting.** Not started (see §1.6 and §5).
- **Test scaffolding.** `/api/listarTests`, `/api/crearTest`, `/api/actualizarTest`, `/api/eliminarTest` operate on a throwaway `test` table. They are a template and a CI smoke test for DB connectivity, not part of the product.
- It should NOT contain haircut-recommendation model logic. That lives in the AI microservice so it can be iterated on, scaled and swapped independently.

It runs in a Docker container on a single AWS EC2 instance (free tier), listening on **plain HTTP only** on port 3000. TLS is terminated upstream by Apache (see §3). It is reachable externally at `barberia-api.erickdh.com`, a Cloudflare-managed subdomain pointing at the EC2 instance.

**Layered structure** — the team decided against per-feature module folders in favor of one flat directory per technical layer under `backend/src/`:

- `routes/` — route definitions and Swagger/OpenAPI JSDoc annotations. Aggregated by `routes/routes.ts`. Route groups: `authRoutes`, `userRoutes`, `clientRoutes`, `managerRoutes`, `barberRoutes`, `receptionistRoutes`, `shopRoutes`, `shiftRoutes`, `serviceCategoryRoutes`, `offeredServiceRoutes`, `suppliesCategoryRoutes`, `supplyRoutes`, `appointmentRoutes`, `recommendationRoutes`, `testRoutes`.
- `controllers/` — request and response handling only; delegates to `services`. Every controller is wired to a route except `notificationLogController.ts`, which is an empty placeholder.
- `services/` — business logic and orchestration, framework-agnostic (no req/res). This is where authorization lives (`userPermissions.ts`), along with `appointmentService.ts`, `availabilityService.ts`, `aiService.ts`, `bucketService.ts`, `jwtTokenService.ts`, and the per-domain services.
- `repositories/` — data access with parameterized SQL through the shared `pg` pool. All repositories are implemented except `notificationLogRepository.ts`, which is an empty placeholder. `appointmentRepository.ts` holds the row-locking logic (see below).
- `types/` — split into `entities/` (one interface per DB table) and `dto/` (request and response contracts).
- `utils/` — response envelope helpers (`apiResponse.ts`), entity-to-DTO mappers, `businessTime.ts` (business timezone handling), `photoKey.ts` (S3 key derivation), and header and session helpers.
- `errors/` — `ApiError.ts`, a typed error with an `ApiErrorCode` enum that maps to HTTP status codes.
- `connection/` — singleton `pg` Pool (`connectDB` / `getPool` / `closeDB`) plus an `RDSClient` from `@aws-sdk/client-rds`. TLS to RDS is required for any environment except `local`, using `global-bundle.pem` (the AWS RDS CA bundle). The Dockerfile downloads a fresh copy at build time, and the repo also tracks one. A `pg` type parser makes `NUMERIC`/`DECIMAL` columns parse as JS `number`.

**API contract**: every response follows a standard envelope, `{ data, message, error }`, produced by `sendSuccess` / `sendFail` in `utils/apiResponse.ts`. Request validation uses `zod` schemas inline in controllers. Business-rule failures are thrown as `ApiError`. Its codes include `NOT_FOUND`, `INVALID_CREDENTIALS`, `USER_ALREADY_EXISTS`, `FORBIDDEN`, `CONFLICT`, `INVALID_INPUT` and `ACCOUNT_DEACTIVATED`, so controllers map each failure mode to a response without string-matching messages.

**Auth (implemented)**

- `POST /api/auth/register` hashes the password with `bcrypt` (cost factor 10) and always creates a `client` user. The insert runs in a transaction that checks for an existing email first.
- `POST /api/auth/login` verifies the password. Both endpoints return a JWT (`jsonwebtoken`, HS256 by default) signed with `JWT_SECRET`, carrying `{id, role, email}` claims and a **24-hour expiry**. There is no refresh-token flow, so a client must log in again after expiry.
- `POST /api/auth/verify-token` checks that a token is valid.
- Controllers read the bearer token with `extractBearerFromHeader`. `isUserSessionValid` decodes it and rejects soft-deleted staff (`isUserActive` checks `managers.deleted_at` / `receptionists.deleted_at`; clients are always active).
- The frontend stores the token and user object in `localStorage` (see §1.1). The Android client stores its session in DataStore. The earlier open question about token storage is resolved in favor of `localStorage` on the web, accepting its XSS-exposure trade-off over a cookie-based approach, since there is no server to set an HttpOnly cookie.

**Appointment editing & cancellation (both implemented)** — `PUT /api/appointments/:id` (`updateAppointment` in `appointmentService.ts`, `updateAppointmentWithServices` in `appointmentRepository.ts`, `canEditAppointment` / `isWithinClientEditCutoff` in `userPermissions.ts`). The body is partial and strict: `clientId`, `guestClientName` and `shopId` are rejected with 400. `PUT /api/appointments/:id/cancel` (`cancelAppointment`, `cancelAppointmentById`) shares the same prologue (`loadModifiableAppointment`): scope via `canEditAppointment`, `scheduled`/`rescheduled` only, future only, and the 8-hour client cutoff. It takes an optional `reason` (max 255) stored in `cancellation_reason`, sets `cancelled_at`, and leaves `is_reward_redemption` untouched.

The business rules (overview §3.1) translate into these requirements:

- **Authorization**: `canEditAppointment` resolves scope like `canCreateAppointment`. A client may act only on their own registered appointments (`client_id` = their id; never guest appointments). **Only clients** are subject to the cutoff: `scheduled_start - now() >= 8 hours`, an absolute-instant comparison with no business-timezone conversion. A receptionist may act on appointments whose `shop_id` is their shop. A manager may act on any shop returned by `getShopIdsByManagerId`. Barbers have no account, so they are never an actor.
- **Preconditions**: status must be `scheduled` or `rescheduled`. `checked_in`, `completed`, `cancelled` and `no_show` are rejected for both edit and cancel.
- **Editable vs. immutable fields**: editable are `scheduled_start` / `scheduled_end`, `barber_id`, the `appointment_services` rows, and `notes`. Immutable are `client_id`, `is_registered_client`, `guest_client_name` and `shop_id`. Moving to another shop means cancelling and creating a new appointment.
- **Reschedule window**: the new `scheduled_start` must fall between the booking date (`created_at`) and `created_at + 30 days`, in either direction, including the same day at another time. This bound is anchored on the booking date, while `MAX_BOOKING_DAYS_AHEAD = 30` in `availabilityService.ts` is anchored on today. The edit path enforces it explicitly, in addition to the availability check.
- **Barber re-assignment**: allowed only to a barber with the same `shop_id` as the original, who is not soft-deleted and is `is_accepting_bookings`. Keeping the same barber is always allowed.
- **Availability and overlap**: validated with the same logic as create (`getAvailableSlots`), but **excluding the appointment being edited** from the occupied intervals. Duration is the sum of the services' durations: unchanged services keep their `duration_minutes_at_booking` / `price_at_booking` snapshots, and added services use current catalog values. The update and the `appointment_services` replacement run in one transaction under the same barber-row `FOR UPDATE` lock used by `createAppointmentWithServices`, so concurrent edits and bookings yield one winner and a 409.
- **`rescheduled` occupies time** (done): the agenda query (`getBlockingAppointmentsByBarberIdsAndRange`) and the lock-time overlap checks treat `scheduled`, `rescheduled` and `checked_in` as occupying a barber's time. The same set is used by the barber-deletion guard (see §1.4).
- **Status transitions**: a reschedule (a change of `scheduled_start` or `barber_id`) sets `status = 'rescheduled'`. Notes-only and services-only edits keep the current status. A `rescheduled` appointment stays editable and cancellable any number of times. Cancelling sets `status = 'cancelled'`, `cancelled_at` and an optional `cancellation_reason`. The row is kept, never deleted.
- **Loyalty side effects**: the counter moves only when an appointment becomes `completed` (§1.4). Cancelling leaves `completed_services_count` untouched, so the client keeps the reward. **Marking a reward appointment `no_show` should forfeit the reward and reset the count to `0`, but the schema does not do this** — the loyalty triggers fire only on `completed`. Reward redemption is also not settable through the API: `is_reward_redemption` appears in responses but no create or edit input sets it.
- **Guest and walk-in bookings**: `POST /api/appointments` accepts either a `clientId` or a `guestClientName`, which covers unregistered clients. Walk-ins (`is_walk_in`, created already `checked_in`) are not exposed by any route yet.
- **Business timezone**: `BUSINESS_TIMEZONE` (default `America/Mazatlan`) drives the day boundaries in `businessTime.ts`.
- **Barber deletion**: the `trg_barbers_check_deletable` trigger blocks soft-deleting a barber while they have `scheduled`, `rescheduled` or `checked_in` appointments. Managers clear them with the endpoints above before deleting.
- **Audit trail**: only partial. `original_scheduled_start` is set once on insert and never changed, so the first booked time survives reschedules. `updated_at`, `cancelled_at` and `cancellation_reason` are the other traces. The previous barber and services are overwritten on edit.
- **API contract**: `rescheduled` is part of `APPOINTMENT_STATUSES` (zod) in `appointmentController.ts` and of the `status` filter in the OpenAPI annotation in `appointmentRoutes.ts`.

### 1.3 AI microservice (`ai_service/`)

Implemented as a FastAPI service, stateless, called only by the backend. It exposes an internal router under `/internal/v1`:

- `GET /internal/v1/health` — liveness; no API key.
- `POST /internal/v1/face/detect-structure` — takes a `photoKey` and returns one of the facial-structure types (`oval`, `triangle`, `heart`, `round`, `diamond`, `square`, `rectangle`). It runs a local PyTorch CNN (`models/model_85_nn_.pth`), which is downloaded and SHA256-verified at startup and baked into the Docker image.
- `POST /internal/v1/haircut/recommend` — takes a `photoKey`, the candidate haircut styles, and user data (facial structure, plus preferences if present), and returns a recommendation. The LLM may only choose from the candidate list. Its status is `recommended` or `no_suitable_haircut`.

Requests are authenticated with the `X-Internal-Api-Key` header, which must match `AI_SERVICE_API_KEY`. The service downloads the photo from S3 itself, using its own read-only credentials. It rejects any key outside `AWS_BUCKET_KEY_PREFIX`, resizes the image to at most 1024 px on the longest side, and processes it in memory without writing it to disk.

The LLM provider is selected by `AI_PROVIDER`:

- `anthropic` — `ClaudeClient` calls the Anthropic API (`ANTHROPIC_MODEL`, default `claude-haiku-5-5`). **The photo bytes are sent to Anthropic** as an image attached to the prompt.
- `ollama` (default) — `OllamaClient` calls a local Ollama server (`OLLAMA_BASE_URL`), so the photo stays on the host running the service.

The backend orchestrates the two stages (see §2): it calls face detection only when the client has no stored facial structure, and then calls the recommendation endpoint. `ai_service/Dockerfile` builds an image with CPU-only PyTorch. CI does not build, push or deploy it yet.

**Planned hosting**: the service is intended to run on a separate local server, not on AWS, reachable from the EC2 instance over a private **Tailscale** network rather than the public internet. This supersedes the earlier plan to co-locate it on the EC2 instance. `AI_SERVICE_URL` is the env var the backend uses to reach it. No Tailscale configuration exists in the repository yet; the node setup is an operational task outside the code. The trade-off is that the recommendation feature depends on the local server's power and uptime, its internet connection (if `anthropic` is used), and the tunnel staying up. None of these fall under AWS's operational guarantees.

### 1.4 Database (PostgreSQL on RDS)

The schema is implemented in `backend/database/init_database.sql` (Postgres 18). It is the single source of truth: there is no migration tool, so schema changes mean editing that file. It is loaded into a real Postgres instance in CI (see §3.1).

**Tables**: `users`, `managers`, `shops`, `shifts`, `barbers`, `clients`, `receptionists`, `services_categories`, `services`, `supplies_categories`, `supplies`, `supply_stock`, `supply_movements`, `appointments`, `appointment_services`, `haircut_styles`, `haircut_style_facial_structures`, `recommendation_history`, `notifications_log`. The throwaway `test` table is used only by the scaffolded CRUD example and CI.

**Enums**: `user_role` (`client`, `manager`, `receptionist`), `facial_structure_type` (seven shapes), `appointment_status` (`scheduled`, `rescheduled`, `checked_in`, `completed`, `cancelled`, `no_show`), `notification_status`, `supply_movement_type` (`in`, `out`).

**Decided and implemented**

- **Multi-tenancy**: a single database with a `shop_id` column on shop-scoped tables (`barbers`, `receptionists`, `supplies`, `appointments`), not schema-per-tenant. `managers` are not shop-scoped directly. A manager owns zero or more shops via `shops.manager_id` (`NOT NULL`, `ON DELETE RESTRICT`), so a manager must be reassigned off all shops before deletion. Each shop has an `is_active` flag.
- **Primary keys**: UUID (`gen_random_uuid()`, built into Postgres core).
- **Role consistency**: `clients`, `managers` and `receptionists` are 1:1 extension tables keyed on `user_id → users.id`. `barbers` is the exception: barbers never log in, so `user_role` has no `barber` value and `barbers` is standalone, with its own `id`. A `check_user_role()` trigger rejects, for example, inserting a `managers` row for a user whose role is not `manager`.
- **Shifts**: a manager-managed catalog (`shifts`), seeded with `morning` (08:00–16:00) and `afternoon` (12:00–20:00). Managers manage shifts through `/api/shifts`; receptionists can only read them. The API enforces that a shift lasts exactly 4, 6 or 8 hours (`ALLOWED_SHIFT_HOURS`), that its name is unique, and that the last shift cannot be deleted. The database enforces that two shifts cannot share the same start and end time. Overlapping shifts are allowed. A shift cannot be deleted while any barber or receptionist is assigned to it. Each barber and receptionist has exactly one `shift_id`, set on creation. There is no endpoint to reassign it later.
- **Barbers**: `is_accepting_bookings` controls whether a barber takes new bookings. Barber updates (`PUT /api/barbers/:id`) cover personal data, `bio` and `isAcceptingBookings` only. Shop and shift cannot be changed.
- **Receptionist management**: `/api/receptionists` (`POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`) and `GET /api/shops/:id/receptionists`, all manager-only. Every operation checks that the receptionist's shop is one the manager owns (`assertShopManaged`). Creating one inserts the `users` row (hashed password) and the `receptionists` row in one transaction. Deletion is a soft delete (`receptionists.deleted_at`). `POST` with the email of a soft-deleted receptionist reactivates them with the new data, shop and shift. An email belonging to a client, a manager or an active receptionist returns 409. `PUT` updates personal data only; shop and shift cannot be changed.
- **Users (`PUT /api/users`, `DELETE /api/users/:id`)**: these use `canUpdateUser` and the delete rules in `userService.ts`. They are not shop-scoped: a manager can update or delete any non-manager user, including a receptionist of another shop. A manager cannot touch another manager. This gap is open (see §5).
- **Loyalty**: a running counter, `clients.completed_services_count`, not a ledger. The `update_client_loyalty_count()` trigger fires when an appointment is inserted as, or updated to, `completed` with a registered client. It increments the counter, or resets it to `0` if the appointment is flagged `is_reward_redemption`. Guest appointments and deleted clients (`client_id IS NULL`) are skipped. Cancelling leaves the counter alone. `no_show` does not reset it yet (see §1.2).
- **Clients**: `clients.facial_structure_type` caches the face-shape detection result, so detection runs once per photo. Uploading a new photo clears it (see §1.5).
- **User deletion**: clients are hard-deleted. Staff (barbers, managers, receptionists) are soft-deleted with their own `deleted_at timestamptz`. `users` has no `is_active` or `deleted_at` column. `appointments.client_id` is `ON DELETE SET NULL`, `notifications_log.client_id` and `recommendation_history.client_id` are `CASCADE`, and `barbers.shift_id` and `appointments.barber_id` are `RESTRICT`.
- **Soft-delete guards**: `trg_barbers_check_deletable` blocks setting `barbers.deleted_at` while the barber has `scheduled`, `rescheduled` or `checked_in` appointments (`rescheduled` is included). Terminal statuses do not block it. `trg_managers_check_deletable` blocks deleting a manager who still owns a shop. No guard exists for `receptionists.deleted_at`, because nothing has an FK on `receptionists.user_id`. `users.email` and `users.phone` stay globally `UNIQUE`, so a soft-deleted staff member's email or phone stays reserved.
- **Appointments**: `status` is an enum (see above). `is_walk_in` and `is_reward_redemption` are boolean flags. `barber_id` is nullable only for an unassigned walk-in, enforced by `chk_appointments_barber_required`. Guest bookings are supported. `client_id` is nullable (`ON DELETE SET NULL`), and `guest_client_name` holds the only data captured for a guest. An explicit `is_registered_client` boolean, set at creation and never changed, tells a guest apart from a registered client whose account was deleted. `chk_appointments_client_or_guest` enforces the pairing. `client_email` is a snapshot filled by `trg_appointments_set_client_email` on insert, so it survives client deletion. `original_scheduled_start` is captured on insert by `trg_appointments_set_original_start`. `checked_in_at` and `completed_at` exist, but nothing yet sets them. `appointment_services` snapshots `price_at_booking` and `duration_minutes_at_booking`, so past revenue is not distorted by later catalog changes.
- **Service catalog**: `services_categories` and `services` are shared across shops and exposed as `/api/servicesCategories` and `/api/offeredServices`. The DB table is `services`, but the API calls them offered services.
- **Supplies**: `supplies` (identity: name, unit, SKU, category) is scoped **per shop**, with `supplies_categories` as a lookup. Mutable stock lives in `supply_stock`, which is split from identity because the two change at different rates. The `set_supplies_needs_reorder()` trigger derives `supply_stock.needs_reorder` on every insert or update, so application code never sets that flag directly. Only the supplies and categories endpoints are implemented.
- **Supply movements**: `supply_movements` is an append-only ledger of `in` and `out` entries. `quantity` is always positive, with direction from the type. It is **not** wired to `supply_stock`: nothing in the database or the API updates `quantity_on_hand` when a movement is inserted. `performed_by` is `NOT NULL` and references `users(id)` with no `ON DELETE` action, which is safe because staff are soft-deleted.
- **Availability**: there is no `availability_slots` table. Availability is computed in `availabilityService.ts` from the barber's shift, `is_accepting_bookings`, open days Monday–Saturday, 15-minute slots (`SLOT_STEP_MINUTES`), the `MAX_BOOKING_DAYS_AHEAD = 30` horizon from today, and the barber's blocking appointments (`scheduled`, `rescheduled`, `checked_in`). There is no exception table for time off or holidays.
- **Recommendations**: `haircut_styles` holds the catalog (`is_active` flag). `haircut_style_facial_structures` maps each style to the facial-structure types it suits. `recommendation_history` stores each request, both successful and failed (`error_message`). It records the suggestion text, confidence, reasoning, the recommended style (`ON DELETE SET NULL`), and `requested_at` and `completed_at`.
- **Notifications**: `notifications_log` has `status` (`pending`, `sent`, `failed`), a free-text `trigger_type` (since reminder timing is not final), `scheduled_for`, `sent_at` and `retry_count`. `client_id` is `NOT NULL`, so appointments for guests cannot have notifications, and the scheduler must skip them. No code writes to the table yet.
- Every mutable table has a `set_updated_at()` trigger that keeps `updated_at` current on `UPDATE`.

**Still open**

- Whether `supply_stock` should be updated by a trigger from `supply_movements` rather than by the application in a transaction. This is undecided because no movement code exists yet.
- Whether loyalty and reporting will need a real ledger table rather than the counter plus `is_reward_redemption` flag. The counter is enough for "how many until the next free service" but not for "list every redemption with a timestamp and shop".
- Time-off and one-off availability overrides. There is no exception table.
- Historical reporting needs beyond what the `appointment_services` snapshot provides.

### 1.5 Static assets and client photos (S3)

Client photos are stored in a private S3 bucket, not in Postgres. There is one photo per client, and its key is derived from the client's user id: `AWS_BUCKET_KEY_PREFIX` + `userId` (`utils/photoKey.ts`). Uploading a new photo overwrites the old one.

- **Upload**: `GET /api/presigned-url` (client only) returns an S3 presigned POST for that key. It accepts only `image/*` content types and at most 5 MB, and expires after 120 seconds. Issuing the URL also clears the client's stored `facial_structure_type`, so the next recommendation re-detects it. The client uploads directly to S3 with the presigned POST, and the backend never proxies the bytes.
- **Read**: the backend sends only the `photoKey` to the AI service, which downloads the object with its own read-only credentials (see §1.3).
- The key is never taken from the client. This means a user cannot ask for another user's photo to be analyzed.
- Other static assets (mainly images) are intended for the same bucket, but nothing else uses it yet.

### 1.6 Notifications (WhatsApp / email)

Not implemented. The backend has no scheduler dependency and no WhatsApp or SES SDK. `notifications_log` exists in the schema, but its controller and repository are empty placeholders (see §1.2). Confirmations and notifications for appointment operations (booking, editing, cancelling) are pending. Once reminders exist, a reschedule must re-time the appointment's reminder jobs and a cancellation must remove them. Design considerations, unchanged from the original plan:

- **WhatsApp**: requires the WhatsApp Business Platform (via Meta directly or a BSP such as Twilio, MessageBird or 360dialog). Messages outside a 24-hour user-initiated session window need pre-approved templates, so appointment reminders will need one.
- **Email**: AWS SES is the natural fit given we are already on AWS.
- Reminders are time-triggered, so a scheduler is needed. At a target scale of about 100 users, the case for a full SQS-based queue is driven by *reliability*, not scale. Two realistic options:
  - **Simple cron job** (`node-cron` in the Express app, or an EC2 cron). Least setup, but a reminder scheduled during a restart or deploy can be missed unless we add tracking and retry logic. The container now has `--restart unless-stopped` (§3.1), which makes an in-process cron more reliable than before, but a deploy still restarts it.
  - **SQS + small worker**. More resilient, minimal added cost at this scale, more moving parts to operate.
- A lightweight cron with a check-on-startup safeguard (querying `notifications_log` / pending reminders on boot) is a reasonable middle ground. It is a judgment call on how tolerant the business is of an occasional missed reminder.

## 2. System Data Flows

**Booking an appointment** (implemented, without reminders): the client or staff member sends `POST /api/appointments` with a registered `clientId` or a guest `guestClientName`, plus services and a barber. The backend checks the actor's scope (`canCreateAppointment`) and computes availability (`getAvailableSlots`). It then opens a transaction, takes the barber-row `FOR UPDATE` lock, re-checks overlaps, and writes the `appointments` row and its `appointment_services` snapshots. A reminder job should then be enqueued, which is not built yet (see §1.6).

**Editing or cancelling an appointment** (implemented): the actor sends `PUT /api/appointments/:id` or `PUT /api/appointments/:id/cancel`. The backend loads the appointment and checks the actor's scope (client: own appointment and at least 8 hours before `scheduled_start`; receptionist: their shop; manager: any shop they manage) and that `status` is `scheduled` or `rescheduled`. For an edit, it validates the 30-day-from-booking window, that a new barber is in the same shop, and availability excluding the appointment itself. It then runs one transaction under the barber lock: it updates the row, replaces `appointment_services`, and sets `status = 'rescheduled'` if the time or barber changed. For a cancel, it sets `status = 'cancelled'` and `cancelled_at`, leaving the loyalty counter untouched. Reminder jobs should be re-timed or removed once the notification pipeline exists. Changing the shop or the client is not an edit: cancel and create a new appointment.

**Getting a haircut recommendation** (implemented):

1. The client uploads a photo directly to S3 with the presigned POST from `GET /api/presigned-url` (§1.5).
2. The client calls `POST /api/recommendations/generate`. The backend checks that the caller is a client, then loads the client record.
3. If the client has no stored `facial_structure_type`, the backend calls the AI service's `/face/detect-structure` with the `photoKey` and stores the result on the client.
4. The backend loads the active haircut styles that match the facial structure, falling back to all active styles if none match. It calls the AI service's `/haircut/recommend` with the `photoKey`, those candidates, and user data.
5. The AI service downloads the photo, calls the LLM (§1.3), and returns the recommendation. The LLM may only choose from the candidates.
6. The backend writes a `recommendation_history` row for the success or the error, then returns the result. A "no suitable haircut" outcome returns a fixed message, and the reason goes in `data`.

**Reminder delivery** (not implemented): a scheduler picks up due reminder jobs → the `notificationLog` service resolves the client's preferred channel(s) → calls WhatsApp and/or SES → logs the delivery status to `notifications_log` for retry and troubleshooting.

**Redeeming a loyalty reward** (partially implemented): the appointment must be created with `is_reward_redemption = true`, but no endpoint can set that flag yet. On completion, the `update_client_loyalty_count()` trigger resets `clients.completed_services_count` to `0`. A cancelled reward appointment leaves the counter untouched, so the client keeps the reward. A `no_show` should forfeit the reward and reset the counter to `0`, which is not yet handled (see §1.2).

**Logging in / registering** (implemented): the client submits credentials to `POST /api/auth/login` or `/register` → `userController` validates with `zod` → `authService` checks, hashes or verifies with `bcrypt` and queries `userRepository` → a JWT is signed and returned with the user record (minus `password_hash`) → the frontend stores both through `AuthContext`.

## 3. Deployment Infrastructure

### 3.1 Topology overview

- **Frontend**: a Vite SPA deployed as a **Cloudflare Worker** (`frontend/wrangler.toml`, with SPA fallback via `not_found_handling = "single-page-application"`). The CI job `frontend-deploy` deploys the production Worker from `main`. A `barberia-frontend-staging` Worker is defined in `wrangler.toml` but no CI step deploys it. No SSR and no server-side logic.
- **Backend**: a multi-stage **Docker image** (`Dockerfile`: a build stage compiles TypeScript; the runtime stage installs production dependencies and downloads the RDS CA bundle). It is pushed to Docker Hub as `jesusvelazquezmx/barberia:latest`. It runs on a **single AWS EC2 instance** (free tier) via `docker run --network host --restart unless-stopped`, with env vars injected from GitHub secrets and variables by the `backend-deploy` job over SSH. The container listens on HTTP only (port 3000). Env vars: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `AI_SERVICE_URL`, `AI_SERVICE_API_KEY`, `AI_PROVIDER`, `FRONTEND_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`, `AWS_BUCKET_KEY_PREFIX`. The restart policy closes the gap noted in the earlier revision of this document.
- **AI microservice**: `ai_service/Dockerfile` builds an image (`python:3.13-slim`, CPU-only PyTorch, with the face model baked in). It is not built or deployed by CI. Hosting is planned on a local server joined to the **Tailscale** tailnet (see §1.3).
- **Reverse proxy**: **Apache** on the same EC2 instance, handling HTTP/HTTPS ingress, TLS termination (the Cloudflare Origin Certificate) and proxying to the backend. This configuration is outside the repository. No load balancer, judged unnecessary at current scale. Trade-off: no built-in health checks, failover or horizontal scaling.
- **DNS**: managed in **Cloudflare**. `barberia.erickdh.com` → the Cloudflare Worker (frontend). `barberia-api.erickdh.com` → the EC2 instance (backend, via Apache).
- **RDS**: PostgreSQL, single primary. No read replica yet.
- **S3**: the private photo bucket (§1.5). The backend and the AI service both use the same bucket and key prefix.
- **Networking**: a single EC2 instance means Apache on the instance is the public-facing edge. RDS should sit in a private subnet or security group reachable only from the backend's instance.
- **CI/CD**: one GitHub Actions workflow, `.github/workflows/cicd-package.yml`, triggered on pushes and pull requests to `main` and `dev`. A `changes` job uses a path filter, so each project's tests run only when that project changes:
  1. **`backend-tests`** — spins up a `postgres:18` service, loads `backend/database/init_database.sql`, and runs the Jest/Supertest suite with `ENV=local`. Also runs the Prettier check.
  2. **`frontend-tests`** — installs dependencies, builds, lints and runs the Prettier check.
  3. **`ai-service-tests`** — installs dependencies with `uv` and runs `pytest`.
  4. **`test`** — aggregate gate. Fails if any of the above failed or was cancelled.
  5. **`frontend-deploy`** (needs `test`, only on push to `main`) — builds and deploys the production Worker with `wrangler`.
  6. **`docker-hub`** (needs `test`, only on push to `main`) — builds the backend `Dockerfile` and pushes `jesusvelazquezmx/barberia:latest`.
  7. **`backend-deploy`** (needs `docker-hub`) — SSHes into the EC2 host, pulls the new image, and replaces the running container.

  Deploys happen only from `main`. There is no staging backend, and no deployment from `dev`. Android has no CI.
- **Local development**: `backend/docker-compose.yml` runs only Postgres 18 (with the schema mounted as the init script). The backend runs un-containerized with `npm run dev` (`tsx watch`). `ai_service` runs with `uv run uvicorn`, and the Ollama server is started separately if the `ollama` provider is used.
- **Observability**: CloudWatch for the AWS side at minimum. Still open: centralized error tracking (Sentry or similar) and monitoring for the Cloudflare Worker. Nothing beyond default AWS and Cloudflare logging is configured.
- **Environments**: the frontend has dev, staging and production definitions (local `vite dev` against `.env.development`, a staging Worker in `wrangler.toml`, and production from `main`), but only production is deployed by CI. The backend has local (`docker-compose`) and production (the single EC2 instance, deployed only from `main`). A `dev`-branch backend change is tested in CI but never deployed before merging to `main`.

### 3.2 Backend/Apache setup: AWS EC2 + Apache + Cloudflare + Express (in Docker)

**Goal:** run a containerized Express.js backend on EC2, publicly reachable through a custom domain, with Cloudflare proxying and terminating visitor TLS, and Apache acting as a local reverse proxy to the container. This part is configured on the host, not in the repository.

#### 3.2.1 Components & Flow

```
Visitor → Cloudflare (proxy, TLS termination for visitors, orange cloud DNS)
        → EC2 Security Group (ports 80 + 443 open to 0.0.0.0/0)
        → Apache (listens on 80/443, holds Cloudflare Origin Cert)
        → Reverse proxy (mod_proxy) → Docker container (localhost:3000, plain HTTP, --network host)
```

#### 3.2.2 Setup Completed So Far

1. **DNS/Cloudflare**: the EC2 instance's public IP is registered as an **A record**, with the proxy enabled (orange cloud).
2. **EC2 Security Group**: inbound rules for ports 80 and 443 from `0.0.0.0/0`. This is required because proxied traffic arrives from **Cloudflare's IP ranges**, not the visitor's IP. An overly narrow Security Group causes a **522 error**.
3. **Cloudflare Origin Certificate**: generated in the Cloudflare dashboard (SSL/TLS → Origin Server, RSA 2048). Saved on the instance:
   - `/etc/ssl/cloudflare/cert.pem` (644 permissions)
   - `/etc/ssl/cloudflare/key.pem` (600 permissions)
4. **Apache SSL configuration**: `mod_ssl` enabled (`a2enmod ssl`). The SSL vhost (`default-ssl.conf` on Ubuntu, or `ssl.conf` on RHEL/Amazon Linux) points `SSLCertificateFile` and `SSLCertificateKeyFile` at the cert and key above. Apache restarted with `sudo systemctl restart apache2`.
5. **Cloudflare SSL/TLS mode**: set to **Full (strict)**, so Cloudflare trusts the Origin Cert and encrypts the Cloudflare-to-origin leg.
6. Confirmed working: the domain loads over HTTPS through Cloudflare.

#### 3.2.3 Key Troubleshooting Notes

- **522 error** = Cloudflare could not reach the origin at all (TCP timeout). Almost always a Security Group or firewall issue.
- **521 error** = Cloudflare reached the origin, but the origin refused the connection. Typically nothing is listening on the expected port and protocol (e.g. SSL mode set to Full with no valid TLS listener on 443).
- Cloudflare Origin Certificates are **only trusted by Cloudflare**. Direct HTTPS requests to the EC2 IP show a certificate warning. This is expected, since the Security Group only needs to serve traffic arriving via Cloudflare.

#### 3.2.4 Running the Express app in Docker

Decision made: **keep Apache in front as a reverse proxy** rather than having Express handle TLS directly, and run the Express app inside a Docker container rather than under a process manager such as `pm2`.

1. The Express app runs as plain HTTP on `localhost:3000`, with no TLS logic in Node. Apache handles all TLS.
2. Enable the Apache proxy modules: `sudo a2enmod proxy proxy_http`.
3. Add to the SSL vhost, alongside the certificate directives:
   ```apache
   ProxyPreserveHost On
   ProxyPass / http://localhost:3000/
   ProxyPassReverse / http://localhost:3000/
   ```
4. Restart Apache: `sudo systemctl restart apache2`.
5. The container runs with `--network host` (so `localhost:3000` is reachable from Apache on the host) and `--restart unless-stopped`. Its env vars are injected at `docker run` time by the `backend-deploy` job (§3.1), not baked into the image or read from a `.env` file on the host.

The AI microservice is not reached through Apache. It is called directly over the private Tailscale network (see §1.3), so no public routing rule is needed for that leg.

## 4. Cross-Cutting Concerns to Design Explicitly

- **Auth**: a JWT session with role claims (manager, receptionist, client) is implemented for login and registration (§1.2): 24-hour expiry, no refresh flow, token and user persisted to `localStorage` on the web and to DataStore on Android. Still open: a refresh-token strategy, or whether "log in again after 24h" is acceptable long-term.
- **Authorization**: role and scope checks live in services, through `services/userPermissions.ts`. There is no route-level middleware. Each protected controller extracts the bearer token itself (`extractBearerFromHeader`), and each service enforces the role. A gap remains: `PUT /api/users` and `DELETE /api/users/:id` let a manager act on any non-manager user, including receptionists of other shops (see §1.4).
- **Background jobs**: reminders, and possibly AI processing if recommendations stop being instant, still need a decision and are unbuilt (see §1.6).
- **Image handling**: presigned uploads, the 5 MB and `image/*` limits, key derivation, and in-memory processing in the AI service are implemented (§1.5). Still open: retention rules, consent and disclosure, and whether photos sent to Anthropic under `AI_PROVIDER=anthropic` are acceptable (§5).
- **Rate limiting and abuse prevention**: especially around booking (slot spam) and the recommendation endpoint (LLM cost). Nothing is implemented yet.
- **CORS**: the `cors` middleware allows a single origin, `FRONTEND_URL` (`http://localhost:5173` when `ENV=local`; otherwise the env var, set from a GitHub variable), with methods `GET`, `POST`, `PUT` and `DELETE`. Because only one origin is allowed, the staging frontend cannot call the production backend unless `FRONTEND_URL` points to it.
- **Validation**: request bodies are validated with `zod` in controllers. Errors return a validation response through `sendValidationError`.
- **Single point of failure**: the backend container runs alone on one EC2 instance behind a single Apache process, with no load balancer and no queue. The restart policy now covers container crashes and host reboots, but an instance failure still needs manual recovery. The AI microservice is a second, independent single point of failure outside AWS, reachable only while its Tailscale connection is up. It is worth deciding what the recommendation feature does (queue, retry, or fail gracefully to the client) when that server or tunnel goes down. Today the backend returns an error and records it in `recommendation_history`.

## 5. Technical Open Questions

**Haircut recommendations (AI microservice)**
- Where photos are processed. Face-shape detection always runs on the local PyTorch model, so that photo never leaves the host. The recommendation step sends the photo to Anthropic when `AI_PROVIDER=anthropic`, and keeps it on the local Ollama server when `AI_PROVIDER=ollama`. Decide which provider runs in production and whether sending photos to Anthropic needs client disclosure or consent.
- How long photos are retained. Photos currently stay in S3 until the client uploads a new one. There is no deletion path, and no retention policy.
- What consent or disclosure clients need (biometric data regulations vary by region).
- Tailscale operational details for the local AI server (§1.3): how its node and auth key are provisioned and rotated, whether tailnet ACLs restrict connectivity to the EC2 instance and this node, and the timeout and retry behavior the backend should use when the tunnel or the local server is unreachable.
- Whether recommendations should be reusable or editable by barbers (for example, a barber annotating the AI's suggestion).

**Fidelity/loyalty program**
- The counter and trigger (§1.4) handle the current flat "every 6th free" rule. They have no per-service or per-price weighting. If the business rule varies by service type or price (see the overview doc's open question), the schema would need to change from an integer counter to something that weights each completed service.
- Whether a real audit ledger (who redeemed what, when, at which shop) is needed for reporting. Today that can only be derived from `appointments.is_reward_redemption` and timestamps, and redemption cannot yet be set through the API.
- The `no_show` reset of the counter (§1.2) is not implemented. Its business rule is decided, but the trigger and service logic are not.

**Appointments & scheduling**
- Availability is derived from shifts and recurring Monday–Saturday hours. There is no mechanism for one-off exceptions (a barber's day off, a holiday closure, extended hours).
- Walk-ins, and the check-in, completion and no-show transitions, have no endpoints. Their rules are in the schema and the overview, but not in the API.
- Whether the lack of a full audit trail and of reschedule or cancellation limits should be revisited once reporting needs are known. Only `original_scheduled_start` is kept.
- Waitlists and any no-show penalty beyond forfeiting a redeemed reward remain undefined.
- Reassigning a barber's shift, or a receptionist's shop or shift, has no endpoint.

**Authorization**
- `/api/users` (`PUT` and `DELETE`) is not shop-scoped for managers. Decide whether a manager should be able to act on any receptionist, or only those of shops they manage, and align `PUT /api/users` and `DELETE /api/users/:id` with `/api/receptionists`, which already checks shop ownership.

**Notifications**
- Cron job vs. SQS + worker for reminder scheduling (§1.6). It needs a decision, and it is more pressing now that a deploy restarts the container.
- Who owns the WhatsApp Business account and its verification, and how reminder timing and channel preferences (business decisions, see overview doc) map onto the `notifications_log.trigger_type` free-text field.

**Inventory**
- Whether `supply_stock` should be updated by a trigger from `supply_movements` or by the application in a transaction. No movement code exists yet.

**Reporting**
- What reports the manager actually needs. This determines whether a simple SQL reporting layer or a proper analytics pipeline is needed. No reporting code exists yet.

**Non-functional / operational**
- Expected scale beyond the roughly 100-user, 2-shop starting target. This affects whether the single free-tier EC2 instance remains adequate, whether the local server has enough capacity for the face-detection and LLM workload, and whether a load balancer becomes necessary.
- Data privacy and compliance requirements (GDPR, CCPA, or local equivalents), especially given facial photos and personal contact info for WhatsApp and email.
- Payment processing: decided. Payment is always made in person at the barbershop, and the system does not handle payments or deposits, so cancellations and reschedules involve no refunds or charges.
- CI/CD for the five codebases (web, backend, AI service, Android, iOS) plus infra. GitHub Actions covers web (test, with production deploy only), backend (test, Docker build, deploy to production), and the AI service (test only, no deploy). Android and iOS have no CI yet. The staging Worker and any staging backend are not deployed.
- Secrets are GitHub Actions secrets, injected as plain env vars into the `docker run` command and into CI test runs. AWS Secrets Manager or Parameter Store would be more robust long-term, since the values otherwise live in shell history and `docker inspect` on the host.
- Route-level authorization is still missing (§4). Services enforce roles, but nothing rejects a request at the routing layer. This is worth adding before more business routes are built.

For the business decisions driving these questions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).
