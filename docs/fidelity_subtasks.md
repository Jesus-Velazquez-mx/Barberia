# Issue #281 — Implementar canjeo de puntos de fidelidad: subtasks

Parent issue: [#281](https://github.com/Jesus-Velazquez-mx/Barberia/issues/281) (label `feature`, no body, no sub-issues yet). It belongs to the loyalty-program epic [#69](https://github.com/Jesus-Velazquez-mx/Barberia/issues/69).

This plan is based on the loyalty analysis of the current code and docs (`docs/barbershop-app-overview.md` §3.3 and §5, `docs/architecture.md` §1.2, §1.4, §2 and §5). Each subtask is sized to become one sub-issue of #281, labeled `backend`, `frontend` or `task` to match the repo's convention.

## 1. Goal

Let a registered client **redeem** a free appointment once they have accumulated enough completed appointments, and let the system enforce and display that rule end to end.

**Decided rules this feature builds on**

- Every **6 completed appointments** earns the 7th free. Each completed appointment adds exactly 1 to `clients.completed_services_count`, whatever services it had and whatever they cost.
- Rewards do not expire, are global (usable at any shop) and are never combined with other promotions (there are none).
- Only registered clients participate. Guest appointments never earn or use rewards.
- Cancelling a reward appointment keeps the reward. A `no_show` on a reward appointment forfeits it (counter reset to 0, already implemented by `trg_appointments_reward_no_show`).
- Completing a reward appointment resets the counter to 0 (already implemented by `update_client_loyalty_count()`).
- No redemption ledger: a redemption is identified only by `appointments.is_reward_redemption`.
- Payment is always made in person; the system handles no payments, so "free" is a flag on the appointment, not a price calculation.

## 2. Current state (what exists and what is missing)

| Piece | State |
|---|---|
| Counter column, increment/reset trigger on `completed`, reset trigger on reward `no_show` | Implemented (`init_database.sql`) |
| `is_reward_redemption` column and its exposure in API responses | Implemented |
| Web `RewardBadge`, cancel-modal note, no-show-modal warning | Implemented |
| Redemption rules and error contract | Decided and documented (overview §3.3 and §5, architecture §1.4 and §2) |
| Any way to **set** `is_reward_redemption` (create or edit) | **Missing**: not in `createAppointmentSchema`, the service, or the repository `INSERT` |
| Eligibility check (counter ≥ 6), server side | **Missing** |
| Guard against using one reward on several appointments | **Missing** |
| Loyalty progress endpoint or UI for the client | **Missing** (the counter is only a raw number in the login payload and the staff client table) |
| "Use free haircut" option in booking (client or staff) | **Missing** |
| Job that moves appointments to `completed` | Missing, tracked in [#253](https://github.com/Jesus-Velazquez-mx/Barberia/issues/253) |
| Counter test matrix | Tracked in [#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255) |
| Android loyalty screens | Out of scope: Android has no booking and is client-only for now |

## 3. Confirmed decisions

All confirmed and recorded in `docs/barbershop-app-overview.md` §3.3 and §5 and in `docs/architecture.md` §1.4, §2 and §5. The subtasks below implement them.

| # | Question | Decision |
|---|---|---|
| D1 | Does the reward cover the whole appointment or just one service? | The **whole appointment**, whatever services it includes. |
| D2 | Are `price_at_booking` snapshots zeroed on a reward appointment? | **No.** The real catalog price is kept as a snapshot; the flag alone marks the appointment as free. |
| D3 | How many reward appointments can a client hold at once? | **One** open reward appointment (`scheduled`, `rescheduled` or `checked_in`). |
| D4 | Can the flag be turned on or off after creation? | **No.** It is set at creation only and is immutable. To switch, cancel and rebook (a cancelled reward appointment keeps the reward). |
| D5 | What if the counter is above 6 when the reward appointment completes? | The counter **resets to 0**; surplus progress is discarded, and the UI should say so. |
| D6 | Can staff redeem for a walk-in? | **Yes**, for a registered client. Guests, and walk-ins for guests, can never redeem. Clients cannot create walk-ins. |

**Error contract** for a rejected redemption: guest or no client → `400`; role or scope not allowed → `403`; count below the threshold → `409`; another open reward appointment → `409`.

**Threshold**: one backend constant, `LOYALTY_REWARD_THRESHOLD = 6`, returned by the API so no client application hard-codes it.

## 4. Dependency overview

```
ST-1 (DB guard) ──────┐
                      ├─► ST-3 (create with reward) ─┬─► ST-8 (API tests)
ST-2 (status service) ┤                              │
                      └─────────────────────────────┬┴─► ST-4 (frontend service) ─┬─► ST-5 (client progress UI)
                                                                                   ├─► ST-6 (booking option)
                                                                                   └─► ST-7 (staff visibility, optional)

ST-3, ST-5, ST-6, ST-8 ──► ST-9 (docs + end-to-end QA) ◄── external: #253 (complete job)
```

ST-1 and ST-2 have no dependencies and can be built in parallel. ST-4 depends on the API contract of ST-2 and ST-3, so it can start from the OpenAPI annotations once those are agreed.

**External dependencies (not part of this feature)**

- [#253](https://github.com/Jesus-Velazquez-mx/Barberia/issues/253) — job that completes `checked_in` appointments. Without it nothing ever reaches `completed`, so the counter never increments or resets. Subtasks ST-1 to ST-8 can be built and tested without it, by moving test appointments to `completed` directly in SQL. The full end-to-end check in ST-9 needs it.
- [#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255) — counter test matrix (completed, no-show, cancel, guests, idempotency). ST-8 covers only the redemption-specific cases and must not duplicate it.
- [#249](https://github.com/Jesus-Velazquez-mx/Barberia/issues/249) / [#260](https://github.com/Jesus-Velazquez-mx/Barberia/issues/260) — walk-in flow. ST-6 reuses its UI where staff create a walk-in.

**Suggested order**: (ST-1, ST-2 in parallel) → ST-3 → ST-4 → (ST-5, ST-6, ST-7 in parallel, ST-8 alongside ST-3) → ST-9.

---

## ST-1 — Database guard for reward appointments

**Label:** `backend` · **Depends on:** none · **Blocks:** ST-3, ST-8

**Suggested title (ES):** Trigger de validación para citas con recompensa

**Description**
Add a trigger to `backend/database/init_database.sql` so the database itself enforces the rules, whichever code path inserts the row. The schema is the single source of truth and there is no migration tool, so edit the file directly.

- `BEFORE INSERT` on `appointments` when `NEW.is_reward_redemption` is true:
  - Reject if `client_id IS NULL` (guest or deleted client).
  - Lock the client row (`SELECT … FROM clients WHERE user_id = NEW.client_id FOR UPDATE`) to serialize concurrent bookings of the same client.
  - Reject if `completed_services_count < 6`.
  - Reject if the client already has another appointment with `is_reward_redemption` in `scheduled`, `rescheduled` or `checked_in`.
- `BEFORE UPDATE` when `OLD.is_reward_redemption IS DISTINCT FROM NEW.is_reward_redemption`: reject (the flag is immutable, D4).
- Do not re-validate the count on other updates (edit, cancel, check-in, no-show, completion): the counter legitimately stays ≥ 6 until completion.

**Acceptance criteria**
- [ ] Inserting a reward appointment for a client with count < 6 fails.
- [ ] Inserting a reward appointment for a guest or with `client_id` NULL fails.
- [ ] A second open reward appointment for the same client fails, including when two inserts run concurrently (exactly one succeeds).
- [ ] After the first reward appointment is `cancelled`, `completed` or `no_show`, a new one is allowed if the count still qualifies (after `cancelled` the counter is untouched, so the client keeps the reward).
- [ ] Changing `is_reward_redemption` on an existing row fails in both directions.
- [ ] Editing, cancelling, checking in, completing or marking no-show on a reward appointment still works and still triggers the existing loyalty triggers unchanged.
- [ ] `mock_data.sql` and any test fixtures that insert reward appointments are updated so they satisfy the new guard (for example, set the counter first). The CI schema load (`backend-tests`) passes.
- [ ] The trigger errors can be told apart (distinct error messages or codes) so ST-3 can map them to the error contract in §3.

---

## ST-2 — Loyalty status service and endpoint

**Label:** `backend` · **Depends on:** none · **Blocks:** ST-3, ST-4, ST-8

**Suggested title (ES):** Servicio y endpoint de estado de lealtad del cliente

**Description**
Add a single place that answers "where does this client stand?", used by both the new endpoint and the create-appointment validation (ST-3), so the rule is not duplicated.

- Constant `LOYALTY_REWARD_THRESHOLD = 6` in the backend (one definition).
- `getLoyaltyStatus(clientId)` returns: `completedServicesCount`, `threshold`, `appointmentsUntilReward` (`max(0, threshold − count)`), `rewardAvailable` (count ≥ threshold), `hasOpenRewardAppointment` (D3) and `canRedeem` (`rewardAvailable && !hasOpenRewardAppointment`).
- Endpoint `GET /api/clients/:id/loyalty` (the exact path follows the existing client routes). Authorization follows the existing scope rules: a client can read only their own status; a receptionist or manager can read the status of a client for use in their shops. Document it with the JSDoc OpenAPI annotation like the other routes.

**Acceptance criteria**
- [ ] Count 0, 5, 6 and 9 return the correct `appointmentsUntilReward`, `rewardAvailable` and `canRedeem`.
- [ ] A client holding an open reward appointment gets `rewardAvailable: true` and `canRedeem: false`.
- [ ] A client reading another client's status gets `403`; an unknown client gets `404`; a missing or invalid token gets `401`.
- [ ] The threshold is returned by the API so no client app hard-codes it.
- [ ] Response uses the standard `{ data, message, error }` envelope and is listed in `/api-docs`.

---

## ST-3 — Create an appointment with a reward redemption (API)

**Label:** `backend` · **Depends on:** ST-1, ST-2 · **Blocks:** ST-4, ST-8, ST-9

**Suggested title (ES):** Permitir agendar citas con canjeo de recompensa (POST /api/appointments)

**Description**
Make `is_reward_redemption` settable at creation, the only place it can be set (D4).

- `createAppointmentSchema` (`appointmentController.ts`): add optional `isRewardRedemption: boolean`. `updateAppointmentSchema` stays `strictObject`, so the flag stays rejected on edit; add a test that proves it.
- `registerAppointment` (`appointmentService.ts`): when the flag is true, resolve the client the same way as today (a client books for themselves; staff pass `clientId`), reject `guestClientName` (400), and check `canRedeem` through the ST-2 service (409 if not). It applies to walk-ins too (D6), where only staff can create them.
- `createAppointmentWithServices` (`appointmentRepository.ts`): add the column to the `INSERT`, and translate the ST-1 trigger errors into `ApiError` codes following the error contract in §3.
- Leave `price_at_booking` snapshots untouched (D2).
- Update the OpenAPI annotation in `appointmentRoutes.ts` (request field, error responses).

**Acceptance criteria**
- [ ] A client with count ≥ 6 and no open reward appointment can book with `isRewardRedemption: true`; the response has `isRewardRedemption: true` and the appointment shows the badge in the web app.
- [ ] A client with count < 6 gets `409` and no appointment is created.
- [ ] A second reward booking while one is open gets `409`.
- [ ] `isRewardRedemption: true` together with `guestClientName` returns `400`.
- [ ] Staff (receptionist in their shop, manager in their shops) can redeem on behalf of a registered client, including a walk-in; staff outside their scope get `403`.
- [ ] A client cannot redeem for another client (existing `canCreateAppointment` rules still apply).
- [ ] `PUT /api/appointments/:id` with `isRewardRedemption` still returns `400` (strict schema), and editing time, barber, services or notes on a reward appointment keeps the flag.
- [ ] Cancelling a reward appointment leaves the counter and the flag unchanged, and the client can book a new reward appointment afterwards.
- [ ] Concurrent create requests for the same client produce a single reward appointment.
- [ ] `price_at_booking` and `duration_minutes_at_booking` snapshots on a reward appointment are the real catalog values.

---

## ST-4 — Frontend service layer and types for loyalty

**Label:** `frontend` · **Depends on:** ST-2, ST-3 (API contract) · **Blocks:** ST-5, ST-6, ST-7

**Suggested title (ES):** Servicios y tipos del frontend para lealtad

**Description**
Prepare the web app to call the new API.

- New `frontend/src/services/loyaltyService.ts` with `getLoyaltyStatus(token, clientId)` built on `apiClient`.
- A `LoyaltyStatus` type in `frontend/src/types/`.
- `createAppointment` in `services/appointmentService.ts`: accept and send `isRewardRedemption`.
- Map the new error cases (`409` not eligible, `409` open reward) to readable Spanish messages, in the same style as the existing booking errors.

**Acceptance criteria**
- [ ] `getLoyaltyStatus` returns a typed result and throws the standard `ApiError` on failure.
- [ ] `createAppointment` sends `isRewardRedemption` only when requested; existing callers still compile and behave the same.
- [ ] Not-eligible and open-reward rejections produce distinct user-facing messages.
- [ ] `npm run build`, lint and the Prettier check pass (the CI `frontend-tests` job).

---

## ST-5 — Client loyalty progress view

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** ST-9

**Suggested title (ES):** Vista de progreso de lealtad para el cliente

**Description**
Show the client where they stand: for example "4 de 6 citas completadas" with a progress indicator, and a clear "tienes un corte gratis disponible" state with a button that goes to booking with the reward option on (ST-6). Place it on the client home and/or profile page.

The progress must come from `getLoyaltyStatus`, **not** from `user.completedServicesCount` in `AuthContext`: that user object is persisted to `localStorage` at login and goes stale after every completed appointment.

**Acceptance criteria**
- [ ] Count 0–5 shows the number completed and how many are left; count ≥ 6 shows the reward-available state.
- [ ] When the client already has an open reward appointment, the view says so and does not offer a second redemption.
- [ ] The value shown is correct after an appointment is completed or marked no-show, without logging out and back in.
- [ ] The text explains the rules the client needs: each completed appointment counts as 1, a cancelled reward appointment keeps the reward, a no-show loses it, and the count resets to 0 after the free appointment (D5).
- [ ] Works at phone width, consistent with the existing Tailwind styling.
- [ ] The view loads and fails gracefully (error state, no crash) when the request fails.

---

## ST-6 — "Use free haircut" option in the booking flow

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** ST-9

**Suggested title (ES):** Opción de canjear corte gratis al agendar

**Description**
Add the option to `BookAppointmentContainer.tsx`, which is shared by clients, receptionists and managers.

- Client: after loading their loyalty status, show a "Usar mi corte gratis" toggle, enabled only when `canRedeem`. When disabled, say why (not enough completed appointments, or a reward appointment is already open).
- Staff: once a registered client is selected, load that client's status and show the same toggle. Hide it when the booking is for a guest. Clear it when the selected client changes.
- The booking summary marks the appointment as a reward redemption, and on success the appointment appears with the existing `RewardBadge`.
- Reuse the same booking form for walk-ins if the walk-in flow (#260) shares it.

**Acceptance criteria**
- [ ] The toggle is enabled for an eligible client and disabled, with an explanation, for an ineligible one.
- [ ] For staff, the toggle appears only for a selected registered client; switching to guest mode hides it and resets it; changing the selected client reloads the status and resets the toggle.
- [ ] Submitting with the toggle on sends `isRewardRedemption: true`, and the new appointment shows the reward badge.
- [ ] If the server rejects the redemption (status changed in the meantime), the user sees the specific error and the form is not left in a broken state.
- [ ] The normal (non-reward) booking flow is unchanged.
- [ ] Lint, build and Prettier pass.

---

## ST-7 — Loyalty progress for staff (optional)

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** none

**Suggested title (ES):** Visibilidad del progreso de lealtad para el personal

**Description**
Replace the raw "Servicios" number in `ClientTableComponent.tsx` (it currently shows `completedServicesCount`) with a readable progress such as "4/6" and a "Recompensa disponible" marker, so receptionists and managers can tell at the front desk who can redeem. If the client list can't use the per-client endpoint efficiently, derive it from the count and the threshold returned by the API, without hard-coding 6.

**Acceptance criteria**
- [ ] The staff client table shows progress toward the next reward and marks clients who have one available.
- [ ] The threshold is not hard-coded in the frontend.
- [ ] The staff client list's existing behavior (search, pagination, actions) is unchanged.

---

## ST-8 — Backend integration tests for redemption

**Label:** `backend` · **Depends on:** ST-1, ST-2, ST-3 · **Blocks:** ST-9

**Suggested title (ES):** Pruebas de integración del canjeo de recompensas

**Description**
Add Jest/Supertest tests under `backend/tests/` for the redemption-specific behavior. Do **not** repeat the counter matrix already planned in [#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255) (increment, reset, no-show, guests, idempotency). Because the completion job (#253) may not exist yet, move test appointments to `completed` and `no_show` with direct SQL updates.

**Acceptance criteria**
- [ ] Eligibility: count 5 rejected (409), count 6 accepted, count above 6 accepted.
- [ ] Guest and unauthorized-role cases return the codes in the error contract (400, 403).
- [ ] One open reward appointment at a time, and a second one allowed after the first is cancelled, completed or marked no-show.
- [ ] Concurrent booking of two reward appointments for one client yields one `201` and one `409`.
- [ ] The flag cannot be changed through `PUT /api/appointments/:id`, and editing or rescheduling keeps it.
- [ ] Redemption works for a walk-in created by staff and is refused for a client creating their own walk-in.
- [ ] Loyalty status endpoint: values and authorization cases from ST-2.
- [ ] A full cycle: reach 6, redeem, complete → counter 0 and the client must earn again; and reach 6, redeem, no-show → counter 0.
- [ ] The suite passes in the CI `backend-tests` job against `init_database.sql`.

---

## ST-9 — Final documentation update and end-to-end verification

**Label:** `task` · **Depends on:** ST-3, ST-5, ST-6, ST-8 · **External:** #253 for the full-cycle check · **Blocks:** closing #281

**Suggested title (ES):** Actualizar documentación y verificar el canjeo de punta a punta

**Description**
The decisions are already in the docs. This task updates them from "decided, pending" to "implemented", and verifies the whole feature once appointments can be completed.

- `docs/architecture.md`: §1.2 "Implementation status" and loyalty side effects, §1.4 "Loyalty" (the "decided, not yet implemented" note), §2 "Redeeming a loyalty reward" (change it from "partially implemented" to implemented), §5 loyalty questions. Fix the statements that still say there are no check-in, no-show or walk-in endpoints, if not already fixed.
- `docs/barbershop-app-overview.md`: confirm §3.3 and the "Redeeming a loyalty reward" journey in §4 match the final behavior.
- Update the two SQL comments that still say "paid services" (`init_database.sql` lines near the counter column and the loyalty trigger) to "completed appointments".
- Manual walkthrough on a local stack with real data (see the acceptance criteria below).

**Acceptance criteria**
- [ ] Docs describe the implemented flow, the endpoint, the guard, the error contract and the threshold constant, with no remaining statement that redemption cannot be set through the API.
- [ ] End-to-end walkthrough passes: a client reaches 6 completed appointments, sees the reward-available state, books with the reward, sees the badge, the appointment is checked in and completed, and the counter returns to 0 (requires #253).
- [ ] Walkthrough of the other paths passes: cancel a reward appointment (reward kept, counter unchanged, can rebook), and no-show a reward appointment (reward lost, counter 0).
- [ ] A staff user redeems on behalf of a registered client at the front desk, and a guest booking never offers the option.
- [ ] All CI jobs (`backend-tests`, `frontend-tests`) are green on the final PR.

---

## 5. Risks and notes

- **Without #253, redemption cannot complete.** The counter only moves when an appointment becomes `completed`. Until that job exists, the feature can be built and tested but not demonstrated end to end.
- **Counter above 6 (D5).** The counter keeps growing while a reward is unused and then resets to 0, which silently discards surplus. That is the decided behavior, but it should be visible to the client (ST-5 text).
- **Stale counter in the browser.** `AuthContext` caches the user, including `completedServicesCount`, in `localStorage`. All new UI must read loyalty data from the new endpoint.
- **Reporting.** With no ledger, "loyalty redemption rate" reports can only be approximated from `is_reward_redemption` and appointment timestamps.
- **Android** has no booking or loyalty screens, so it is intentionally excluded from this feature.
