# Barbershop App — Technical Architecture

For the product/business context behind these decisions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).

## 1. System Components & Tech Stack

There will be three client apps (Vite web, Kotlin Android, Swift iOS). Today only the web client exists in this repository — there is no Android or iOS codebase yet (not just "deployment undecided"; the projects haven't been started). All clients talk to a single Express backend over a REST API. The backend is the source of truth for business logic and owns the PostgreSQL database. It delegates AI work (haircut recommendations) to a dedicated microservice, and delegates outbound communication (appointment reminders) to WhatsApp and email providers. The frontend is deployed to Cloudflare Workers; the backend and database run on AWS (EC2 + RDS). The AI microservice, once built, will run on a separate local server (not AWS) reachable from the EC2 instance over a private **Tailscale** network — it does not exist as a deployable service yet (see §1.3).

The system supports multiple barbershop locations, starting with 2 — this is a confirmed multi-tenancy requirement, not just a possibility, and is already reflected in the data model (see §1.4).

**Implementation status at a glance**: only authentication (login/register) and a passthrough health check for the future AI microservice are functionally implemented end-to-end today. The rest of the backend (appointments, availability, services, shops, supplies, notifications, recommendation history) exists only as scaffolding — route-less controller and repository files with no logic — following the same layered structure so business logic can be filled in without restructuring. The frontend has a login page wired to the real API and a placeholder landing page; booking, recommendations, loyalty, and role-gated views are not built yet.

### 1.1 Client applications

All three clients are "thin" — they hold UI state and call the backend API; they don't talk to the database or the AI microservice directly.

- **Web (Vite + React 19 + TypeScript + Tailwind v4)**: a client-side single-page app (no SSR, no server-side logic — auth session handling happens via tokens on the client, not a Node server). Routing is `react-router-dom` v7 (`createBrowserRouter`); forms use `react-hook-form`. Serves clients, barbers, receptionists, and managers/assistants through role-gated routes — not yet implemented; today `router.tsx` only defines `/` (a placeholder `ExamplePage`) and `/login`. Given four quite different personas, plan for either route groups within one app, or (if the manager/barber/receptionist workload grows) a separate admin app later. Deployed as a Cloudflare Worker at `barberia.erickdh.com`, with a separate staging Worker (`barberia-frontend-staging`) deployed from the `dev` branch.
  - **Structure**: `pages/` (route-level composition) → `containers/` (state/logic, e.g. `LoginContainer.tsx` wraps `react-hook-form` + the auth call) → `components/` (presentational, e.g. `LoginFormComponent.tsx`). `context/AuthContext.tsx` holds the authenticated user/token and persists them to `localStorage`. `services/apiClient.ts` is a thin `fetch` wrapper that reads `VITE_API_URL`, unwraps the backend's `{data, message, error}` envelope, and throws a typed `ApiError`; per-domain modules like `services/authService.ts` build on it.
- **Android (Kotlin)** / **iOS (Swift)**: primarily client-facing (booking, recommendations, reminders, loyalty), though barbers may also want a lightweight mobile view of their schedule. Not started — no code, deployment pipeline, or tooling decisions made yet.

All clients are meant to share one OpenAPI contract (REST) so the three teams (web, Android, iOS) don't drift. The backend already generates an OpenAPI spec via `swagger-jsdoc`/`swagger-ui-express`, served at `/api-docs`, from JSDoc annotations on each route file. Generating client SDKs from that spec (for web and, later, mobile) is not yet set up.

### 1.2 Backend (Express + PostgreSQL, EC2)

Owns:
- Auth & role-based access control (barber / manager-assistant / receptionist / client). **Implemented**: email/password login and self-registration (always as `client`), see below. Role-based route protection (middleware gating routes by role) is not yet implemented — only the JWT issuance/verification pieces exist.
- Appointments: CRUD, scheduling rules, availability calendar. Walk-ins are supported alongside scheduled appointments (not appointment-only) — modeled in the schema (see §1.4) but not yet exposed via any route/service/repository logic.
- Services catalog (shared across shops) and each shop's supplies inventory (internal consumables — scissors, shampoo, conditioner, etc. — not customer-facing) — modeled in the schema, not yet exposed via routes.
- Loyalty/fidelity program logic — modeled as a running counter on `clients`, maintained by a DB trigger (see §1.4); no application-layer service exists yet to redeem rewards or expose the count via the API.
- Reporting/analytics queries for managers — not started.
- Orchestration: calls the AI microservice for recommendations, and triggers the notification pipeline for reminders. Only a health-check passthrough (`GET /api/recommendation/test` → AI service's `/health`) exists today; there is no recommendation-submission endpoint yet, and the notification pipeline (scheduler, WhatsApp/SES calls) is not started.
- It should NOT contain haircut-recommendation model logic — that's isolated in the AI microservice so it can be iterated on, scaled, and potentially swapped (or moved to a different provider) independently.

Runs in a Docker container on a single AWS EC2 instance (free tier), listening on **plain HTTP only** — TLS is terminated upstream by Apache (see §3). Reachable externally at `barberia-api.erickdh.com`, a subdomain managed via Cloudflare DNS pointing at the EC2 instance.

**Layered structure** — the team decided against per-feature module folders in favor of organizing the backend by technical layer, one flat directory per layer under `backend/src/`:
- `routes/` — route definitions + Swagger/OpenAPI JSDoc annotations. Currently: `userRoutes.ts` (login/register), `recommendationRoutes.ts` (AI health-check passthrough), `testRoutes.ts` (a CRUD scaffold against the throwaway `test` table, used as a template and as a CI smoke test for DB connectivity — not part of the product).
- `controllers/` — req/res handling only, delegates to `services`. Most controller files beyond `userController.ts` and `recommendationController.ts` are currently empty placeholders (`appointmentController.ts`, `availabilitySlotController.ts`, `notificationLogController.ts`, `recommendationHistoryController.ts`, `serviceController.ts`, `shopController.ts`, `supplyController.ts`).
- `services/` — business logic/orchestration, framework-agnostic (no req/res). Only `userService.ts` (auth) and `aiService.ts` (AI microservice HTTP client) have logic today.
- `repositories/` — data access, parameterized SQL via the shared `pg` pool from `connection/`. Only `userRepository.ts` is implemented; the rest are empty placeholders mirroring the schema's tables.
- `types/` — split into `entities/` (one interface per DB table, e.g. `appointment.interface.ts`, `shift.interface.ts`) and `dto/` (request/response contracts, e.g. `apiResponse.interface.ts`, `authResponse.interface.ts`, `userResponse.interface.ts`).
- `connection/` — singleton `pg` Pool (`connectDB` / `getPool` / `closeDB`), plus an `RDSClient` from `@aws-sdk/client-rds`. TLS to RDS is required for any environment except `local` (via `global-bundle.pem`, the AWS RDS CA bundle downloaded at Docker build time). A `pg` type parser overrides `NUMERIC`/`DECIMAL` columns to parse as JS `number` instead of the driver's default `string`, matching the `number` types used in `types/entities`.

**API contract**: every response follows a standard envelope, `{ data, message, error }` (`types/dto/apiResponse.interface.ts`), produced via `sendSuccess`/`sendFail` helpers in `utils/apiResponse.ts`. Request validation uses `zod` schemas inline in controllers. Business-rule errors are thrown as `ApiError` (`errors/ApiError.ts`), a typed error carrying an `ApiErrorCode` enum (`NOT_FOUND`, `INVALID_CREDENTIALS`, `USER_ALREADY_EXISTS`) and an HTTP status code, so controllers can map specific failure modes to specific responses without string-matching error messages.

**Auth (implemented)**: `POST /api/register` hashes the password with `bcrypt` (cost factor 10) and always creates a `client`-role user (a transaction first checks for an existing email, then inserts, rolling back on conflict). `POST /api/login` verifies the password and, on success, both endpoints issue a JWT (`jsonwebtoken`, `HS256` default) signed with `JWT_SECRET`, carrying `{id, role, email}` claims and an **8-hour expiry**. There is no refresh-token flow — a client must log in again after expiry. On the frontend, the token and user object are persisted to `localStorage` (see §1.1) — the earlier open question of where to store tokens client-side is resolved in favor of `localStorage`, accepting its XSS-exposure trade-off over a cookie-based approach, since there is no server to set an HttpOnly cookie.

### 1.3 AI microservice

**Not yet implemented.** No AI microservice code exists in this repository or elsewhere. What exists today is a placeholder integration point: `backend/src/services/aiService.ts` calls `${AI_SERVICE_URL}/health` and the result is exposed via `GET /api/recommendation/test`, purely to prove connectivity once a real service is stood up at that URL. `AI_SERVICE_URL` is already wired as a secret in the backend's deploy pipeline (see §3.1) in anticipation of this.

Single responsibility (planned): take a photo of the client and return haircut suggestions as a text response. Intended to be called **asynchronously** by the backend, not directly by clients — this keeps model credentials, provider choice, and scaling isolated from the main API, and makes the AI service replaceable without touching the client apps.

The recommendation method is decided: computer-vision analysis of an uploaded photo, returning a text-based suggestion (rather than a rules-engine questionnaire or LLM-prompting flow) — see the `recommendation_history` table in §1.4, which is already shaped for this. Open questions around where photos are processed, retention, and consent remain — see §5.

**Planned to run on a separate local server** (not AWS), reachable from the EC2 instance over a private **Tailscale** network rather than the public internet. This supersedes the earlier plan to co-locate it on the same EC2 instance as the backend: the AI workload gets its own dedicated CPU/RAM instead of contending with the backend for the free-tier instance's resources, and the backend reaches it directly over the Tailscale tunnel via `AI_SERVICE_URL` (already wired as an env var, see §1.2) — no public exposure and no Apache routing rule needed for this leg. This trades the earlier resource-contention risk for a new one: the recommendation feature now depends on the local server's power/uptime and its internet connection, plus the Tailscale tunnel staying up — none of which fall under AWS's operational guarantees.

### 1.4 Database (PostgreSQL on RDS)

The schema is implemented in `backend/database/database.sql` (Postgres 18) and is loaded into a real Postgres instance in CI (see §3.1), not just aspirational. Entities: `users` (shared identity, role-gated), `managers`, `shops`, `shifts`, `clients`, `barbers`, `receptionists`, `services_categories`, `services`, `supplies_categories`, `supplies`, `supply_stock`, `availability_slots`, `appointments`, `appointment_services`, `recommendation_history`, `notifications_log`. (There is also a throwaway `test` table used only by the scaffolded CRUD example in §1.2/CI.)

Decided and implemented:
- **Multi-tenancy**: single database with a `shop_id` column on shop-scoped tables (`barbers`, `receptionists`, `supplies`, `availability_slots`, `appointments`) rather than schema-per-tenant. `managers` are not shop-scoped directly — a manager owns zero or more shops via `shops.manager_id` (`NOT NULL`, `ON DELETE RESTRICT`, so a manager must be reassigned off all shops before deletion).
- **Primary keys**: UUID (`gen_random_uuid()`, built into Postgres core since v13 — no extension needed).
- **Role consistency**: `clients`, `barbers`, `managers`, and `receptionists` are 1:1 extension tables keyed on `user_id → users.id`. A `check_user_role()` trigger (`BEFORE INSERT OR UPDATE`) rejects inserting a row into e.g. `barbers` for a user whose `users.role` isn't `barber` — a plain FK can't express that constraint, so it's enforced procedurally.
- **Barber shifts**: a fixed `shifts` lookup table with exactly two rows — `morning` (08:00–16:00) and `afternoon` (12:00–20:00) — seeded by the schema itself. Each barber has exactly one `shift_id`, settable only through whatever future admin flow managers use (no self-service endpoint exists yet). This supersedes an earlier "staggered arbitrary start time" design; the implemented model only supports these two fixed windows.
- **Loyalty**: implemented as a running counter (`clients.completed_services_count`), not a ledger/transactions table. An `update_client_loyalty_count()` trigger fires when an appointment's status becomes `completed`: it increments the counter, or resets it to `0` if the appointment is flagged `is_reward_redemption`. There is no `loyalty_accounts`/`loyalty_transactions` table — redemption history for reporting would have to be derived from `appointments.is_reward_redemption` plus timestamps, since there's no separate ledger today.
- The `services` catalog is shared/global across all shops, now with a `services_categories` lookup table (not previously documented). `supplies` — each shop's inventory of consumables used to deliver services, never sold to or attached to a client's appointment — is scoped **per-shop**, also with a `supplies_categories` lookup. Supply identity (`supplies`: name, unit, SKU) is split from mutable stock state (`supply_stock`: quantity on hand, reorder threshold, cost), since the two change at different rates. A `set_supplies_needs_reorder()` trigger derives `supply_stock.needs_reorder` automatically from `quantity_on_hand` vs. `reorder_threshold` on every insert/update — the reorder flag is never set directly by application code.
- **Availability**: `availability_slots` models a recurring weekly pattern per barber (`day_of_week` 0–6 + `start_time`/`end_time`), scoped to a shop. There is no `availability_exceptions` table (e.g. for one-off time off, holidays) — that's not implemented, unlike what was previously assumed.
- **Appointments**: `status` is an enum (`scheduled`, `checked_in`, `completed`, `cancelled`, `no_show`); `is_walk_in` and `is_reward_redemption` are explicit boolean flags; `barber_id` is nullable specifically to allow an unassigned walk-in until check-in, enforced by a `CHECK` constraint (`is_walk_in = true OR barber_id IS NOT NULL`). `appointment_services` snapshots `price_at_booking`/`duration_minutes_at_booking` so past revenue isn't distorted by later catalog price changes.
- Facial photos are **not** stored in Postgres — `recommendation_history.photo_s3_key` stores only the S3 key (see §1.5).
- Every mutable table has a `set_updated_at()` trigger keeping `updated_at` current on `UPDATE`.

Still open:
- Whether loyalty/reporting needs will eventually require a real ledger table instead of the counter+flag approach — the counter is sufficient for "how many until the next free service" but not for "list every redemption with a timestamp and shop."
- Time-off / one-off availability overrides (no `availability_exceptions`-equivalent exists).
- Broader historical-reporting needs beyond what `appointment_services`' price/duration snapshot already supports.

### 1.5 Static assets (S3)

Client photos and other static assets (mainly images) are intended to be stored in an S3 bucket, with only the URL/key referenced in Postgres (`recommendation_history.photo_s3_key`). The backend's deploy pipeline already provisions `AWS_S3_BUCKET_NAME` and AWS credentials as environment variables (see §3.1), but no upload/retrieval code exists yet — there's no recommendation-submission endpoint to receive a photo in the first place (see §1.3).

### 1.6 Notifications (WhatsApp / email)

Not implemented. Modeled in the schema (`notifications_log`, with a free-text `trigger_type` since reminder timing isn't finalized), but there is no scheduler, no WhatsApp/SES integration, and no code that writes to this table yet. Design considerations, unchanged from the original plan:
- **WhatsApp**: requires the WhatsApp Business Platform (via Meta directly or a BSP like Twilio, MessageBird, 360dialog). Needs pre-approved message templates for anything outside a 24-hour user-initiated session window — appointment reminders will need an approved template.
- **Email**: AWS SES is the natural fit given we're already on AWS.
- Reminders are time-triggered, not request-triggered, so a scheduler is needed. At a target scale of ~100 users, the case for a full SQS-based queue is driven by *reliability* (not losing a reminder if the backend restarts), not scale — SQS's free tier would comfortably cover this volume regardless. Two realistic options:
  - **Simple cron job** (node-cron in the Express app, or an EC2 cron) — least setup, but a reminder scheduled during a restart/deploy could be missed unless we add our own tracking/retry logic. This is now more relevant to flag since the backend runs as a Docker container without a documented restart policy (see §3.2) — a container that doesn't come back automatically makes an in-process cron even less reliable.
  - **SQS + small worker** — more resilient, minimal added cost at this scale, more moving parts to operate.
  - Given the single-EC2/free-tier posture elsewhere, a lightweight cron approach with a check-on-startup safeguard (querying `notifications_log`/pending reminders on boot) is a reasonable middle ground, but this is a judgment call on how tolerant the business is of an occasional missed reminder.

## 2. System Data Flows

These flows describe the intended design; only the auth portion of "booking" (none) and the AI health-check leg of "recommendation" are actually implemented today — see §1.2/§1.3 for current status.

**Booking an appointment**: Client app → Backend `appointment` controller/service checks barber availability against `availability_slots` and existing bookings → writes `appointments` row → enqueues a reminder job (e.g. "send 24h before, send 2h before") → returns confirmation to client.

**Getting a haircut recommendation**: Client submits photo → Backend stores/validates input, calls AI microservice → AI microservice returns a text suggestion (+ confidence/explanation) → Backend persists to `recommendation_history` and returns to client.

**Reminder delivery**: Scheduler/worker picks up due reminder jobs → `notificationLog` service resolves client's preferred channel(s) → calls WhatsApp API and/or SES → logs delivery status to `notifications_log` (for retry/troubleshooting).

**Redeeming a loyalty reward**: Client, barber, receptionist, or manager triggers redemption → appointment is created/marked with `is_reward_redemption = true` → on completion, the `update_client_loyalty_count()` trigger resets `clients.completed_services_count` to `0` (see §1.4) → appointment is marked reward-redeemed for reporting.

**Logging in / registering** (implemented): Client submits credentials → `userController` validates with `zod` → `userService` checks/hashes/verifies via `bcrypt` and queries `userRepository` → a JWT is signed and returned alongside the user record (minus `password_hash`) → frontend stores both in `localStorage` via `AuthContext`.

## 3. Deployment Infrastructure

### 3.1 Topology overview

- **Frontend**: Vite SPA deployed as a **Cloudflare Worker** (`wrangler.toml`, SPA fallback via `not_found_handling = "single-page-application"`). Production serves `barberia.erickdh.com` (from the `main` branch); a separate `barberia-frontend-staging` Worker is deployed from the `dev` branch. No SSR, no server-side logic — pure static/client-side app.
- **Backend**: packaged as a **Docker image** (multi-stage `Dockerfile`: build stage compiles TypeScript, runtime stage installs only production deps and downloads the AWS RDS CA bundle) and pushed to Docker Hub (`jesusvelazquezmx/barberia`). Deployed to a **single AWS EC2 instance** (free tier) by SSHing in and running `docker run --network host` with DB/JWT/AI-service/AWS-S3 env vars injected from GitHub Secrets. The container listens on HTTP only (port 3000, exposed to the host network). This supersedes an earlier plan to run the app directly via `pm2` — the app is no longer run outside a container. Note: the `docker run` command has no `--restart` flag configured, so the container does not automatically come back after a host reboot or crash; this is a real operational gap worth closing (e.g. `--restart unless-stopped`), especially given §1.6's dependence on the backend staying up for reminders.
- **AI microservice**: not deployed anywhere — it doesn't exist yet (see §1.3). Once built, the plan is to run it on a separate local server outside AWS, joined to the same **Tailscale** tailnet as the EC2 instance so the backend can reach it privately without exposing it to the public internet or opening additional inbound ports on the EC2 Security Group (Tailscale handles NAT traversal between the two nodes).
- **Reverse proxy**: **Apache** on the same EC2 instance, handling HTTP/HTTPS ingress, SSL/TLS termination, and internal routing (path- or subdomain-based) to the backend (and, later, the AI microservice). No load balancer — judged unnecessary at current scale. Trade-off: no built-in health checks, failover, or horizontal scaling room; acceptable for now, worth revisiting if usage grows meaningfully.
- **DNS**: Managed in **Cloudflare**. `barberia.erickdh.com` → Cloudflare Worker (frontend); `barberia-api.erickdh.com` → the EC2 instance (backend, via Apache).
- **RDS**: PostgreSQL, single primary. No read replica yet — revisit once reporting queries start competing with transactional traffic.
- **S3**: intended for client photos and static assets; bucket name/credentials are already wired into the backend's deploy env, but no code uploads to it yet (see §1.5).
- **Networking**: with no load balancer and a single EC2 instance, the private/public subnet split from a multi-instance design is less relevant — Apache on the instance is the public-facing edge. RDS should still sit in a private subnet/security group reachable only from the backend's instance.
- **CI/CD**: a single GitHub Actions workflow (`.github/workflows/cicd-package.yml`) with four jobs, gated on pushes/PRs to `main`/`dev`:
  1. **`test`** — spins up a real `postgres:18` service container, loads `backend/database/database.sql` into it, installs both `backend` and `frontend` dependencies, and runs the backend's Jest/Supertest suite against that database.
  2. **`frontend-deploy`** (needs `test`, only on `push`) — builds the Vite app and deploys it via `wrangler`: to the `staging` Cloudflare environment on `dev`, to production on `main`.
  3. **`docker-hub`** (needs `test`, only on push to `main`) — builds the backend `Dockerfile` and pushes `jesusvelazquezmx/barberia:latest` to Docker Hub.
  4. **`backend-deploy`** (needs `docker-hub`) — SSHes into the AWS EC2 host and replaces the running container with the freshly pushed image.
  Mobile CI/CD (Android/iOS) is not configured — there's no mobile codebase yet (§1.1).
- **Local development**: the backend runs un-containerized via `tsx watch` against a local Postgres started with `docker-compose.yml` (a single `postgres:18` service, no app container). This is closer to how CI runs tests than to how production runs the built image.
- **Observability**: CloudWatch for the AWS side at minimum; still worth deciding on centralized error tracking (Sentry or similar) and how to monitor the Cloudflare Worker side too. Nothing beyond default AWS/Cloudflare logging is configured today.
- **Environments**: frontend has real dev/staging/production separation (local `vite dev` against `.env.development`'s `localhost:3000`, a Cloudflare staging Worker from `dev`, and production from `main`). The backend only has local (via `docker-compose`) and production (the single EC2 instance, deployed only from `main`) — there is no staging backend/database, so a `dev`-branch backend change is tested in CI but never deployed anywhere before merging to `main`.

### 3.2 Backend/Apache setup: AWS EC2 + Apache + Cloudflare + Express (in Docker)

**Goal:** Run a containerized Express.js backend on an EC2 instance, publicly accessible via a custom domain, with Cloudflare proxying/terminating TLS and Apache acting as a local reverse proxy to the container.

#### 3.2.1 Components & Flow

```
Visitor → Cloudflare (proxy, TLS termination for visitors, orange cloud DNS)
        → EC2 Security Group (ports 80 + 443 open to 0.0.0.0/0)
        → Apache (listens on 80/443, holds Cloudflare Origin Cert)
        → Reverse proxy (mod_proxy) → Docker container (localhost:3000, plain HTTP, --network host)
```

#### 3.2.2 Setup Completed So Far

1. **DNS/Cloudflare**: EC2 instance's public IP registered as an **A record**, proxy enabled (orange cloud).

2. **EC2 Security Group**: Inbound rules opened for port 80 (HTTP) and port 443 (HTTPS), both from `0.0.0.0/0`. This was required because proxied traffic arrives from **Cloudflare's IP ranges**, not the visitor's IP — an overly narrow Security Group causes a **522 error** (Cloudflare can't complete the TCP handshake).

3. **Cloudflare Origin Certificate**: Generated via Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate (RSA 2048, default hostnames/validity). Cert and private key saved on the instance:
   - `/etc/ssl/cloudflare/cert.pem` (644 permissions)
   - `/etc/ssl/cloudflare/key.pem` (600 permissions)

4. **Apache SSL configuration**: `mod_ssl` installed/enabled (`a2enmod ssl` on Ubuntu), SSL vhost config (`default-ssl.conf` on Ubuntu, or `ssl.conf` on RHEL/Amazon Linux) updated to point `SSLCertificateFile` / `SSLCertificateKeyFile` at the above cert/key. Apache restarted with `sudo systemctl restart apache2`.

5. **Cloudflare SSL/TLS mode**: Set to **Full (strict)** — Cloudflare now trusts the Origin Cert and encrypts the Cloudflare-to-origin leg, not just visitor-to-Cloudflare.

6. Confirmed working: domain loads correctly over HTTPS through Cloudflare.

#### 3.2.3 Key Troubleshooting Notes

- **522 error** = Cloudflare couldn't reach the origin at all (TCP timeout) → almost always a Security Group / firewall issue.
- **521 error** = Cloudflare reached the origin but the origin refused the connection → typically means nothing is properly listening/responding on the port/protocol Cloudflare expects (e.g., SSL/TLS mode set to Full but no valid TLS listener on port 443).
- Cloudflare Origin Certificates are **only trusted by Cloudflare**. Direct requests to the EC2 IP over HTTPS (bypassing Cloudflare) will show a cert warning. This is expected and acceptable since the Security Group only needs to serve traffic that arrives via Cloudflare.

#### 3.2.4 Running the Express app in Docker

Decision made: **keep Apache in front as a reverse proxy** rather than having Express handle TLS directly, and run the Express app inside a Docker container rather than directly via a process manager like `pm2`.

1. Express app runs as plain HTTP on an internal port (`localhost:3000`), no TLS logic in Node at all — Apache handles all TLS.
2. Enable Apache proxy modules: `sudo a2enmod proxy proxy_http`.
3. Add to the same SSL vhost config (alongside the `SSLCertificateFile`/`SSLCertificateKeyFile` directives):
   ```apache
   ProxyPreserveHost On
   ProxyPass / http://localhost:3000/
   ProxyPassReverse / http://localhost:3000/
   ```
4. Restart Apache: `sudo systemctl restart apache2`.
5. The container is run with `--network host` (so `localhost:3000` inside the container is reachable from Apache on the host) and its env vars (DB credentials, `JWT_SECRET`, `AI_SERVICE_URL`, AWS credentials/region/S3 bucket) are injected at `docker run` time by the `backend-deploy` CI job (§3.1), not baked into the image or read from a `.env` file on the host.

This keeps TLS termination and cert management centralized in Apache, while the containerized Express app stays simple and only needs to handle HTTP internally. The AI microservice, once built, will **not** be reached through Apache — it lives on a separate local server and is called directly over the private Tailscale network (see §1.3), so no public-facing routing rule is needed for that leg.

## 4. Cross-Cutting Concerns to Design Explicitly

- **Auth**: JWT-based session with role claims (barber/manager/receptionist/client) is implemented for login/register (§1.2) — 8-hour expiry, no refresh flow, token+user persisted to `localStorage` on the web client. Still open: refresh-token strategy (or whether "log in again after 8h" is acceptable long-term), role-based route/middleware protection on the backend (currently nothing checks the JWT's `role` claim to gate access), and whether mobile will use secure storage (Keychain/Keystore) once mobile clients exist.
- **Background jobs**: reminders (and possibly AI processing, if recommendations aren't instant) still need a decision and are entirely unbuilt — see §1.6.
- **Image handling**: uploads, resizing, and privacy/retention rules for facial photos — no upload endpoint or S3 integration exists yet, so this is still fully open (touches both S3 design and legal/compliance, see §5).
- **Rate limiting & abuse prevention**: especially around booking (prevent slot-spamming, once booking exists) and the AI endpoint (cost control, once it exists) — nothing implemented yet.
- **CORS**: implemented — the backend's `cors` middleware allows only `http://localhost:5173` (when `ENV=local`) or `https://barberia.erickdh.com` (otherwise) as the origin, restricted to `GET`/`POST`/`PUT`/`DELETE`. Note this single hardcoded production origin does not yet include the Cloudflare staging Worker's domain, so the staging frontend cannot currently call the (single, production-only) backend.
- **Single point of failure**: the backend Docker container runs alone on one EC2 instance behind a single Apache process, with no load balancer, no queue, and no configured restart policy (§3.2.4) — an instance failure, restart, or container crash currently means manual intervention to bring the API back. Acceptable trade-off at ~100 users, but the missing restart policy is a low-effort fix worth prioritizing over the rest. Once the AI microservice exists on its separate local server (§1.3), it becomes a second, independent single point of failure — outside AWS entirely and reachable only while its Tailscale connection is up — so it's worth deciding what the recommendation feature should do (queue, retry, fail gracefully to the client) if that server or tunnel goes down.

## 5. Technical Open Questions

**Haircut recommendations (AI microservice)**
- The method is decided (photo in, text suggestion out — see §1.3), and `recommendation_history` is already shaped for it, but the service itself hasn't been started. Still open: where photos are processed (in-house model vs. third-party API), how long they're retained, what consent/disclosure is needed from clients (biometric data regulations vary by region), and how photos reach S3 (direct client upload with a signed URL vs. proxied through the backend).
- Tailscale operational details for the local AI server (§1.3): how its node/auth key is provisioned and rotated, whether tailnet ACLs restrict connectivity to just the EC2 instance and this node, and what timeout/retry behavior the backend should have when the tunnel or the local server is unreachable.
- Should recommendations be reusable/editable by barbers (e.g., barber overrides or annotates the AI's suggestion)?

**Fidelity/loyalty program**
- The counter+trigger implementation (§1.4) handles the current flat "every 6th free" rule cleanly, but has no per-service or per-price weighting — if the business rule ever needs to vary by service type/price (see the overview doc's open question), the schema would need to change from a simple integer counter to something that can weight each completed service.
- Whether a real audit ledger (who redeemed what, when, at which shop) is needed for reporting, given today's implementation only derives that from `appointments.is_reward_redemption` and timestamps.

**Appointments & scheduling**
- Availability is recurring-only (`availability_slots` by day-of-week); there's no mechanism for one-off exceptions (a barber's day off, a holiday closure, extended hours). Whatever cancellation/no-show/reschedule policy the business settles on (see the overview doc) will need corresponding backend logic — none exists yet beyond the `status` enum values already in the schema.

**Notifications**
- Cron job vs. SQS + worker for reminder scheduling — see §1.6. Needs a decision, and is more pressing now that the backend runs as a container with no auto-restart (§3.2.4): an in-process cron would silently stop working on any unplanned restart.
- Who owns the WhatsApp Business account/verification, and how reminder timing/channel preferences (business decisions, see overview doc) map onto the already-modeled `notifications_log.trigger_type` free-text field.

**Reporting**
- What reports does the manager actually need — this determines whether a simple SQL-based reporting layer or a proper analytics pipeline is needed. No reporting code exists yet.

**Non-functional / operational**
- Expected scale beyond the ~100-user, 2-shop starting target — affects whether the single free-tier EC2 instance remains adequate for the backend, and whether the local server hosting the AI microservice (§1.3) has enough capacity for the CV workload; also affects whether a container restart policy or a load balancer become necessary.
- Data privacy/compliance requirements (GDPR, CCPA, or local equivalents) — especially relevant given facial photos and personal contact info for WhatsApp/email, once those features are built.
- Payment processing — is payment/deposit handled in-app (Stripe et al.) or purely in-person at the shop? Not started either way.
- CI/CD strategy for five codebases (web, backend, AI service, Android, iOS) plus infra — GitHub Actions now covers web (Cloudflare, both staging and production) and backend (Docker build/push/deploy to production only, no staging); the AI microservice and both mobile platforms have no CI/CD because none of them exist yet as codebases.
- Secrets are currently managed as GitHub Actions secrets, injected as plain env vars into the `docker run` command and into CI test runs — AWS Secrets Manager / Parameter Store would be a more robust long-term store than passing secrets through GitHub Actions and the EC2 host's process environment, especially since there's no `.env` file to secure but the values still live in shell history / `docker inspect` on the host.
- No role-based authorization middleware exists yet — every route that isn't `/login`/`/register`/the recommendation health-check would currently be reachable by anyone with a valid token (or, for now, by anyone at all, since none of those routes exist). This needs to land before any real business-logic routes go in.

For the business decisions driving these questions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).
