# Barbershop App — Technical Architecture

For the product/business context behind these decisions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).

## 1. System Components & Tech Stack

There will be three client apps (Vite web, Kotlin Android, Swift iOS). They will talk to a single Express backend over a REST API. The backend is the source of truth for business logic and owns the PostgreSQL database. It delegates AI work (haircut recommendations) to a dedicated microservice, and delegates outbound communication (appointment reminders) to WhatsApp and email providers. The frontend is deployed to Cloudflare Workers; the backend, AI microservice, and database run on AWS (EC2 + RDS).

The system supports multiple barbershop locations, starting with 2 — this is a confirmed multi-tenancy requirement, not just a possibility, and affects the data model (see §1.4).

### 1.1 Client applications

All three clients are "thin" — they hold UI state and call the backend API; they don't talk to the database or the AI microservice directly.

- **Web (Vite + Tailwind)**: a client-side single-page app (no SSR, no server-side logic — e.g., auth session handling happens via tokens on the client, not a Node server). Serves clients, barbers, and managers/assistants through role-gated routes. Given three quite different personas, plan for either route groups within one app, or (if the manager/barber workload grows) a separate admin app later. Deployed as a Cloudflare Worker at `barberia.erickdh.com`.
- **Android (Kotlin)** / **iOS (Swift)**: primarily client-facing (booking, recommendations, reminders, loyalty), though barbers may also want a lightweight mobile view of their schedule. Deployment for both is **not yet configured or decided**.

All clients share one OpenAPI contract (REST) so the three teams (web, Android, iOS) don't drift. Generating client SDKs from the OpenAPI spec will save a lot of pain later.

### 1.2 Backend (Express + PostgreSQL, EC2)

Owns:
- Auth & role-based access control (barber / manager-assistant / client)
- Appointments: CRUD, scheduling rules, availability calendar. Walk-ins are supported alongside scheduled appointments (not appointment-only).
- Services & products catalog
- Loyalty/fidelity program logic and ledger
- Reporting/analytics queries for managers
- Orchestration: calls the AI microservice for recommendations, and triggers the notification pipeline for reminders
- It should NOT contain haircut-recommendation model logic — that's isolated in the AI microservice so it can be iterated on, scaled, and potentially swapped (or moved to a different provider) independently.

Runs on a single AWS EC2 instance (free tier), listening on **plain HTTP only** — TLS is terminated upstream by Apache (see §3). Reachable externally at `barberia-api.erickdh.com`, a subdomain managed via Cloudflare DNS pointing at the EC2 instance.

Suggested internal module boundaries (even inside one Express app, keep these as separate modules with clear boundaries — you'll likely want to split them into services later):
- `auth`
- `appointments` (includes availability/scheduling engine)
- `catalog` (services, products, pricing)
- `loyalty`
- `notifications` (orchestrates the actual WhatsApp/email send, likely via a queue)
- `reports`
- `users` (barbers, managers, clients, profile data incl. facial-structure preference inputs)

> Note: the current backend code (`backend/controllers`, `backend/routes`) is an early scaffold and doesn't yet reflect this module breakdown — see `CLAUDE.local.md` for the code-level state.

### 1.3 AI microservice

Single responsibility: take a photo of the client and return haircut suggestions as a text response. Called **asynchronously** by the backend, not directly by clients — this keeps model credentials, provider choice, and scaling isolated from the main API, and makes the AI service replaceable without touching the client apps.

The recommendation method is decided: computer-vision analysis of an uploaded photo, returning a text-based suggestion (rather than a rules-engine questionnaire or LLM-prompting flow). Open questions around where photos are processed, retention, and consent remain — see §5.

**Runs on the same EC2 instance as the backend** (free-tier constraint), also over plain HTTP behind Apache. This is a departure from strict service isolation: on a single shared instance, a spike in AI workload (e.g., CV model inference) can affect backend responsiveness, since both share the instance's CPU/RAM. Worth monitoring, and worth splitting onto its own instance later if load becomes a problem.

### 1.4 Database (PostgreSQL on RDS)

Core entities to model (not exhaustive): `users` (with role), `barbers`, `clients`, `services`, `products`, `appointments`, `appointment_services`, `availability_slots`/`schedules`, `loyalty_accounts`, `loyalty_transactions`, `notifications_log`, `preferences`/`recommendation_history`.

Points to decide before schema design:
- Multi-tenancy is confirmed (multiple barbershop locations, starting with 2) — still open is *how*: single database with a `shop_id` on relevant tables vs. schema-per-tenant.
- Facial photos are **not** stored in Postgres — they live in an S3 bucket (see §1.5), with only the URL/key referenced in the DB.
- Audit/history requirements for reports (e.g. will historical snapshots of prices/services be needed for accurate past-revenue reporting?) — still open.

### 1.5 Static assets (S3)

Client photos and other static assets (mainly images) are stored in an S3 bucket, with only the URL/key referenced in Postgres.

### 1.6 Notifications (WhatsApp / email)

Not a separate "service" in the current stack, but it needs its own design:
- **WhatsApp**: requires the WhatsApp Business Platform (via Meta directly or a BSP like Twilio, MessageBird, 360dialog). Needs pre-approved message templates for anything outside a 24-hour user-initiated session window — appointment reminders will need an approved template.
- **Email**: AWS SES is the natural fit given we're already on AWS.
- Reminders are time-triggered, not request-triggered, so we need a scheduler. **Not yet set up.** At a target scale of ~100 users, the case for a full SQS-based queue is driven by *reliability* (not losing a reminder if the backend restarts), not scale — SQS's free tier would comfortably cover this volume regardless. Two realistic options:
  - **Simple cron job** (node-cron in the Express app, or an EC2 cron) — least setup, but a reminder scheduled during a restart/deploy could be missed unless we add our own tracking/retry logic.
  - **SQS + small worker** — more resilient, minimal added cost at this scale, more moving parts to operate.
  - Given the single-EC2/free-tier posture elsewhere, a lightweight cron approach with a check-on-startup safeguard (querying `notifications_log`/pending reminders on boot) is a reasonable middle ground, but this is a judgment call on how tolerant the business is of an occasional missed reminder.

## 2. System Data Flows

**Booking an appointment**: Client app → Backend `appointments` module checks barber availability against `availability_slots` and existing bookings → writes `appointments` row → enqueues a reminder job (e.g. "send 24h before, send 2h before") → returns confirmation to client.

**Getting a haircut recommendation**: Client submits photo → Backend stores/validates input, calls AI microservice → AI microservice returns a text suggestion (+ confidence/explanation) → Backend persists to `recommendation_history` and returns to client.

**Reminder delivery**: Scheduler/worker picks up due reminder jobs → `notifications` module resolves client's preferred channel(s) → calls WhatsApp API and/or SES → logs delivery status to `notifications_log` (for retry/troubleshooting).

**Redeeming a loyalty reward**: Client or barber/manager triggers redemption → `loyalty` module validates balance against program rules → deducts credit, creates `loyalty_transactions` entry → appointment marked as reward-redeemed for reporting.

## 3. Deployment Infrastructure

### 3.1 Topology overview

- **Frontend**: Vite SPA deployed as a **Cloudflare Worker**, served at `barberia.erickdh.com`. No SSR, no server-side logic — pure static/client-side app.
- **Backend + AI microservice**: co-located on a **single AWS EC2 instance** (free tier). Both listen on HTTP only.
- **Reverse proxy**: **Apache** on the same EC2 instance, handling HTTP/HTTPS ingress, SSL/TLS termination, and internal routing (path- or subdomain-based) to the backend and AI microservice. No load balancer — judged unnecessary at current scale. Trade-off: no built-in health checks, failover, or horizontal scaling room; acceptable for now, worth revisiting if usage grows meaningfully.
- **DNS**: Managed in **Cloudflare**. `barberia.erickdh.com` → Cloudflare Worker (frontend); `barberia-api.erickdh.com` → the EC2 instance (backend, via Apache).
- **RDS**: PostgreSQL, single primary. No read replica yet — revisit once reporting queries start competing with transactional traffic.
- **S3**: client photos and static assets.
- **Networking**: with no load balancer and a single EC2 instance, the private/public subnet split from a multi-instance design is less relevant — Apache on the instance is the public-facing edge. RDS should still sit in a private subnet/security group reachable only from the backend's instance.
- **CI/CD**: **GitHub CI/CD** handles deployment to both **Cloudflare** (frontend Worker) and **AWS** (backend + AI microservice on the shared EC2 instance). Mobile CI/CD (Android/iOS) is not yet configured or decided.
- **Observability**: CloudWatch for the AWS side at minimum; still worth deciding on centralized error tracking (Sentry or similar) and how to monitor the Cloudflare Worker side too.
- **Environments**: dev/staging/production as separate stacks is still an open decision — worth resolving given everything now runs on a single free-tier instance (e.g., would staging share the same instance, a separate one, or run locally?).

> Note: `backend/` and `frontend/` are being decoupled into separately built/deployed artifacts — see `CLAUDE.local.md` for the current state of that migration.

### 3.2 Backend/Apache setup: AWS EC2 + Apache + Cloudflare + Express

**Goal:** Deploy an Express.js backend on an EC2 instance, publicly accessible via a custom domain, with Cloudflare proxying/terminating TLS and Apache acting as a local reverse proxy to the Node app.

#### 3.2.1 Components & Flow

```
Visitor → Cloudflare (proxy, TLS termination for visitors, orange cloud DNS)
        → EC2 Security Group (ports 80 + 443 open to 0.0.0.0/0)
        → Apache (listens on 80/443, holds Cloudflare Origin Cert)
        → Reverse proxy (mod_proxy) → Express app (localhost:3000, plain HTTP)
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

#### 3.2.4 Integrating Express

Decision made: **keep Apache in front as a reverse proxy** rather than having Express handle TLS directly. Steps:

1. Express app runs as plain HTTP on an internal port (e.g., `localhost:3000`), no TLS logic in Node at all — Apache handles all TLS.
2. Enable Apache proxy modules: `sudo a2enmod proxy proxy_http`.
3. Add to the same SSL vhost config (alongside the `SSLCertificateFile`/`SSLCertificateKeyFile` directives):
   ```apache
   ProxyPreserveHost On
   ProxyPass / http://localhost:3000/
   ProxyPassReverse / http://localhost:3000/
   ```
4. Restart Apache: `sudo systemctl restart apache2`.
5. Run the Express app persistently via `pm2` (`pm2 start app.js`, `pm2 startup`, `pm2 save`) so it survives crashes/reboots.

This keeps TLS termination and cert management centralized in Apache, while Express stays simple and only needs to handle HTTP internally. The AI microservice, co-located on the same instance (§1.3), is reached through the same Apache layer via its own routing rule (path- or subdomain-based).

## 4. Cross-Cutting Concerns to Design Explicitly

- **Auth**: JWT-based session with role claims (barber/manager/client) is a natural fit for three heterogeneous clients, and is now the *only* option for the web client since there's no server-side session handling (no SSR). Decide token lifetime, refresh strategy, and whether mobile uses secure storage (Keychain/Keystore) for tokens; for the Vite SPA, decide where tokens are stored client-side (memory vs. localStorage vs. cookie) with XSS/CSRF trade-offs in mind.
- **Background jobs**: reminders (and possibly AI processing, if recommendations aren't instant) still need a decision — see §1.6.
- **Image handling**: uploads, resizing, and privacy/retention rules for facial photos — this touches both S3 design and legal/compliance (see §5).
- **Rate limiting & abuse prevention**: especially around booking (prevent slot-spamming) and the AI endpoint (cost control) — more important now that backend and AI share one small instance's resources.
- **CORS**: since the frontend (`barberia.erickdh.com`) and backend (`barberia-api.erickdh.com`) are on different subdomains, the backend/Apache config needs explicit CORS handling for API requests from the Worker.
- **Single point of failure**: co-locating backend + AI microservice on one EC2 instance behind a single Apache process, with no load balancer or queue, means one instance failure or restart affects both services and any in-flight reminders. Acceptable trade-off at ~100 users; worth documenting as a known limitation rather than an oversight.

## 5. Technical Open Questions

**Business scope**
- Does a client book with a specific barber, or with "the shop" and get assigned? Can they have a preferred/favorite barber?
- Do appointments involve a single service, or multiple (e.g., haircut + beard trim in one slot)? Do different services take different durations?
- Multi-tenancy is confirmed (multiple barbershops, starting with 2) — still open: single database with a `shop_id` column vs. schema-per-tenant (see §1.4).

**Haircut recommendations (AI microservice)**
- The method is decided (photo in, text suggestion out — see §1.3). Still open: where photos are processed (in-house model vs. third-party API), how long they're retained, and what consent/disclosure is needed from clients (biometric data regulations vary by region — worth checking with whoever handles compliance).
- Should recommendations be reusable/editable by barbers (e.g., barber overrides or annotates the AI's suggestion)?

**Fidelity/loyalty program**
- What's the actual rule — e.g., "1 free haircut after N paid visits," a points system, or tiered rewards? Does it vary by service type or price?
- Do rewards expire? Are they shop-wide or tied to a specific barber?
- Can rewards be combined with other promotions?

**Appointments & scheduling**
- Do barbers set their own available hours, or does the manager set hours for all barbers (or both, with manager able to override)?
- How are cancellations/no-shows/reschedules handled — cutoff windows, penalties, waitlists?
- Multiple chairs per barber, or one appointment at a time per barber?

**Notifications**
- Cron job vs. SQS + worker for reminder scheduling — see §1.6. Needs a decision.
- Can clients choose/opt out of channel (WhatsApp vs. email vs. both)? Required for consent/compliance either way.
- Reminder timing — e.g., 24h and 2h before, configurable per shop?
- Who owns the WhatsApp Business account/verification — has that process been started, since Meta's approval can take time?

**Reporting**
- What reports does the manager actually need — revenue, most-booked services, barber utilization, client retention/churn, loyalty redemption rates? This determines whether a simple SQL-based reporting layer or a proper analytics pipeline is needed.

**Non-functional / operational**
- Expected scale beyond the ~100-user, 2-shop starting target — affects whether the single free-tier EC2 instance remains adequate, and when it's worth splitting the backend and AI microservice onto separate instances or reintroducing a load balancer.
- Data privacy/compliance requirements (GDPR, CCPA, or local equivalents) — especially relevant given facial photos and personal contact info for WhatsApp/email.
- Payment processing — is payment/deposit handled in-app (Stripe et al.) or purely in-person at the shop? Worth ruling in or out explicitly.
- CI/CD strategy for five codebases (web, backend, AI service, Android, iOS) plus infra — GitHub CI/CD now covers web (Cloudflare) and backend/AI (AWS); mobile CI/CD is still fully open, and mobile app-store review timelines will need to be coordinated separately from the web/backend deploy cadence.
- Environments (dev/staging/prod) and how config/secrets are managed (AWS Secrets Manager / Parameter Store recommended over .env files on the EC2 instance) — worth deciding given the single-instance setup.

For the business decisions driving these questions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).
