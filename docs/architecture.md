# Barbershop App — Technical Architecture

For the product/business context behind these decisions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).

## 1. System Components & Tech Stack

There will be two client apps (Next.js web, Kotlin Android). They will talk to a single Express backend over a REST API. The backend is the source of truth for business logic and owns the PostgreSQL database. It delegates AI work (haircut recommendations) to a dedicated Python microservice, and delegates outbound communication (appointment reminders) to WhatsApp and email providers. Everything runs on AWS: EC2 for the three services, RDS for Postgres.

### 1.1 Client applications

All three clients are "thin" — they hold UI state and call the backend API; they don't talk to the database or the AI microservice directly.

- **Web (Next.js + Tailwind)**: serves clients, barbers, and managers/assistants through role-gated routes. Given three quite different personas, plan for three route groups behind one app. Next.js API routes will just proxy to the Express backend rather than duplicate logic.
- **Android (Kotlin)**: primarily client-facing (booking, recommendations, reminders, loyalty), though barbers may also want a lightweight mobile view of their schedule.

All clients share one OpenAPI contract so the three teams (web, Android) don't drift.

### 1.2 Backend (Express + PostgreSQL, EC2)

Owns:
- Auth & role-based access control (barber / manager-assistant / client)
- Appointments: CRUD, scheduling rules, availability calendar
- Services & products catalog
- Loyalty/fidelity program logic and ledger
- Reporting/analytics queries for managers
- Orchestration: calls the AI microservice for recommendations, and triggers the notification pipeline for reminders
- It should NOT contain haircut-recommendation model logic — that's isolated in the AI microservice so it can be iterated on, scaled, and potentially swapped (or moved to a different provider) independently.

Suggested internal module boundaries:
- `auth`
- `appointments` (includes availability/scheduling engine)
- `catalog` (services, products, pricing)
- `loyalty`
- `notifications` (orchestrates the actual WhatsApp/email send, likely via a queue)
- `reports`
- `users` (barbers, managers, clients, profile data incl. facial-structure preference inputs)

> Note: the current backend code (`backend/controllers`, `backend/routes`) is an early scaffold and doesn't yet reflect this module breakdown — see `CLAUDE.local.md` for the code-level state.

### 1.3 AI microservice (EC2)

Single responsibility: take a client's inputs (photo and/or facial-structure attributes, stated preferences, maybe hair type/texture) and return haircut suggestions. Called asynchronously by the backend, not directly by clients — this keeps model credentials, provider choice, and scaling isolated from the main API, and makes the AI service replaceable without touching the client apps.

The recommendation method (image-based ML model, a curated rules-engine, or an LLM-based service with prompt engineering) is not specified yet.

### 1.4 Database (PostgreSQL on RDS)

Core entities to model (not exhaustive): `users` (with role), `barbers`, `clients`, `services`, `products`, `appointments`, `appointment_services`, `availability_slots`/`schedules`, `loyalty_accounts`, `loyalty_transactions`, `notifications_log`, `preferences`/`recommendation_history`.

### 1.5 Notifications (WhatsApp / email)

Not a separate "service" in the current stack, but it needs its own design:
- **WhatsApp**: requires the WhatsApp Business Platform (via Meta directly or a BSP like Twilio, MessageBird, 360dialog). Needs pre-approved message templates for anything outside a 24-hour user-initiated session window — appointment reminders will need an approved template.
- **Email**: AWS SES is the natural fit given we're already on AWS.
- Reminders are time-triggered, not request-triggered, so we will need a scheduler — e.g., a cron-style job (node-cron, or an EC2 cron job) or, cleaner, an SQS queue plus a small worker, so a reminder isn't lost if the backend restarts. Given reliability matters here (a missed reminder is a bad experience), a queue-based approach is worth the extra setup.

## 2. System Data Flows

**Booking an appointment**: Client app → Backend `appointments` module checks barber availability against `availability_slots` and existing bookings → writes `appointments` row → enqueues a reminder job (e.g. "send 24h before, send 2h before") → returns confirmation to client.

**Getting a haircut recommendation**: Client submits photo/preferences → Backend stores/validates input, calls AI microservice → AI microservice returns suggestions (+ confidence/explanation) → Backend persists to `recommendation_history` and returns to client.

**Reminder delivery**: Scheduler/worker picks up due reminder jobs → `notifications` module resolves client's preferred channel(s) → calls WhatsApp API and/or SES → logs delivery status to `notifications_log` (for retry/troubleshooting).

**Redeeming a loyalty reward**: Client or barber/manager triggers redemption → `loyalty` module validates balance against program rules → deducts credit, creates `loyalty_transactions` entry → appointment marked as reward-redeemed for reporting.

## 3. Deployment Infrastructure: AWS EC2 + Apache + Cloudflare + Express

**Goal:** Deploy an Express.js backend on an EC2 instance, publicly accessible via a custom domain, with Cloudflare proxying/terminating TLS and Apache acting as a local reverse proxy to the Node app.

### 3.1 Components & Flow

```
Visitor → Cloudflare (proxy, TLS termination for visitors, orange cloud DNS)
        → EC2 Security Group (ports 80 + 443 open to 0.0.0.0/0)
        → Apache (listens on 80/443, holds Cloudflare Origin Cert)
        → Reverse proxy (mod_proxy) → Express app (localhost:3000, plain HTTP)
```

### 3.2 Setup Completed So Far

1. **DNS/Cloudflare**: EC2 instance's public IP registered as an **A record**, proxy enabled (orange cloud).

2. **EC2 Security Group**: Inbound rules opened for port 80 (HTTP) and port 443 (HTTPS), both from `0.0.0.0/0`. This was required because proxied traffic arrives from **Cloudflare's IP ranges**, not the visitor's IP — an overly narrow Security Group causes a **522 error** (Cloudflare can't complete the TCP handshake).

3. **Cloudflare Origin Certificate**: Generated via Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate (RSA 2048, default hostnames/validity). Cert and private key saved on the instance:
   - `/etc/ssl/cloudflare/cert.pem` (644 permissions)
   - `/etc/ssl/cloudflare/key.pem` (600 permissions)

4. **Apache SSL configuration**: `mod_ssl` installed/enabled (`a2enmod ssl` on Ubuntu), SSL vhost config (`default-ssl.conf` on Ubuntu, or `ssl.conf` on RHEL/Amazon Linux) updated to point `SSLCertificateFile` / `SSLCertificateKeyFile` at the above cert/key. Apache restarted with `sudo systemctl restart apache2`.

5. **Cloudflare SSL/TLS mode**: Set to **Full (strict)** — Cloudflare now trusts the Origin Cert and encrypts the Cloudflare-to-origin leg, not just visitor-to-Cloudflare.

6. Confirmed working: domain loads correctly over HTTPS through Cloudflare.

### 3.3 Key Troubleshooting Notes

- **522 error** = Cloudflare couldn't reach the origin at all (TCP timeout) → almost always a Security Group / firewall issue.
- **521 error** = Cloudflare reached the origin but the origin refused the connection → typically means nothing is properly listening/responding on the port/protocol Cloudflare expects (e.g., SSL/TLS mode set to Full but no valid TLS listener on port 443).
- Cloudflare Origin Certificates are **only trusted by Cloudflare**. Direct requests to the EC2 IP over HTTPS (bypassing Cloudflare) will show a cert warning. This is expected and acceptable since the Security Group only needs to serve traffic that arrives via Cloudflare.

### 3.4 Next Step (In Progress): Integrating Express

Decision made: **keep Apache in front as a reverse proxy** rather than having Express handle TLS directly. Planned steps:

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

This keeps TLS termination and cert management centralized in Apache (already configured and working), while Express stays simple and only needs to handle HTTP internally.

> Note: `backend/` and `frontend/` are being decoupled into separately built/deployed artifacts — see `CLAUDE.local.md` for the current state of that migration. The proxy/TLS layer above still applies to how traffic reaches the backend; how the frontend is served may change as part of that split.

## 4. Technical Open Questions

**Database schema**
- Single database vs. schema-per-tenant if it's decided to support multiple barbershop locations/franchises.
- Store facial photos or not. If stored, we'll use an S3 bucket.
- Audit/history requirements for reports (e.g. will historical snapshots of prices/services be needed for accurate past-revenue reporting?).

**Non-functional / operational**
- Expected scale (number of shops, barbers, appointments/day) — affects RDS sizing and whether a single EC2 instance per service is even adequate to start.
- CI/CD strategy for four codebases (web, backend, AI service, Android, iOS) plus infra — how are releases coordinated, especially given mobile app store review times differ from web deploy cadence?
- Environments (dev/staging/prod) and how config/secrets are managed (AWS Secrets Manager / Parameter Store recommended over .env files in EC2).

For the business decisions driving these questions, see [`barbershop-app-overview.md`](./barbershop-app-overview.md).
