# Issue #281 — Implementar canjeo de puntos de fidelidad: subtasks

Parent issue: [#281](https://github.com/Jesus-Velazquez-mx/Barberia/issues/281) (label `feature`, no body). It belongs to the loyalty-program epic [#69](https://github.com/Jesus-Velazquez-mx/Barberia/issues/69). The sub-issues created so far are #284 to #292 (see §4).

This plan is based on the loyalty analysis of the current code and docs (`docs/barbershop-app-overview.md` §3.3 and §5, `docs/architecture.md` §1.2, §1.4, §2 and §5). Each subtask is sized to become one sub-issue of #281, labeled `backend`, `frontend` or `task` to match the repo's convention.

> **Revision (automatic redemption).** The first version of this plan modeled redemption as something the client *requests* (an `isRewardRedemption` field, a "Use free haircut" toggle, `409` rejections) and as a benefit over the *whole appointment*. That does not match the business rule. The rule is:
>
> 1. Redemption is **automatic**. Nobody asks for it, chooses it or confirms it.
> 2. Once a registered client reaches **6 completed appointments**, the next appointment they book (the 7th) includes **one free service**.
> 3. If the appointment has several services, the free one is **the cheapest**.
>
> This changes the API contract, the database guard, the tests and the UI of the sub-issues. §4 lists the effect on each one.

## 1. Goal

Make the system apply the loyalty reward on its own: when a registered client with `completed_services_count >= 6` and no open reward appointment books an appointment, the system flags it as a reward appointment and marks its cheapest service as free. The system then shows that benefit end to end (booking summary, appointment views, progress view, staff views).

**Decided rules this feature builds on**

- Every **6 completed appointments** earns a free service on the 7th. Each completed appointment adds exactly 1 to `clients.completed_services_count`, whatever services it had and whatever they cost.
- The reward is applied **automatically at booking time**, with no opt-in and no opt-out.
- The free service is the **cheapest service of the appointment**. An appointment with a single service has that service free, so the whole appointment is free. With several services, only the cheapest is free and the client pays the rest.
- Rewards do not expire, are global (usable at any shop) and are never combined with other promotions (there are none).
- Only registered clients participate. Guest appointments never earn or receive rewards.
- Cancelling a reward appointment keeps the reward: the next booking gets it again. A `no_show` on a reward appointment forfeits it (counter reset to 0, already implemented by `trg_appointments_reward_no_show`).
- Completing a reward appointment **subtracts 6** from the counter, so progress above 6 is kept (decided; today `update_client_loyalty_count()` resets to 0, and ST-11 changes it).
- No redemption ledger: a redemption is identified only by `appointments.is_reward_redemption`.
- Payment is always made in person and the system handles no payments. "Free" is information the system shows (which service is free and what is left to pay), not a charge it makes.

## 2. Current state (what exists and what is missing)

| Piece | State |
|---|---|
| Counter column, increment/reset trigger on `completed`, reset trigger on reward `no_show` | Implemented (`init_database.sql`) |
| `is_reward_redemption` column and its exposure in API responses | Implemented |
| Counter behavior when a reward appointment completes | **Must change**: the trigger resets to 0; the decided rule is to subtract 6 and keep the surplus (ST-11) |
| Web `RewardBadge`, cancel-modal note, no-show-modal warning | Implemented |
| Job that moves appointments to `completed` ([#253](https://github.com/Jesus-Velazquez-mx/Barberia/issues/253)), no-show job, walk-in auto check-in | Implemented (merged) |
| Counter test matrix ([#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255)) | Done (closed) |
| Walk-in UI ([#260](https://github.com/Jesus-Velazquez-mx/Barberia/issues/260)) | Done (closed) |
| Business docs describing the rules | Aligned with the revised rules (automatic reward, cheapest service, carry-over, no-show reset). They describe the target as "decided, not yet implemented" until ST-9 |
| Automatic eligibility check at booking (counter ≥ 6 and no open reward appointment), server side | **Missing** |
| Setting `is_reward_redemption` on the appointment that gets the reward | **Missing**: the repository `INSERT` never writes the column |
| Choosing and exposing the free service (cheapest) and the amount left to pay | **Missing**: responses expose only the raw `priceAtBooking` per service; web totals add them all up |
| Guard against one reward being used on several appointments | **Missing** |
| Loyalty progress endpoint or UI for the client | **Missing** (the counter is only a raw number in the login payload and the staff client table) |
| Booking and appointment views that show the free service | **Missing** |
| Android loyalty screens | Out of scope: Android has no booking and is client-only for now |

## 3. Decisions

All decisions are confirmed and recorded in `docs/barbershop-app-overview.md` §3.3 and §5 and in `docs/architecture.md` §1.4, §2 and §5. D1, D2 and D7 come directly from the business rule; D4 and D6 are adjusted to it; D8 to D10 and the derived mechanism of D2 close the gaps the rule left open.

| # | Question | Decision | Status |
|---|---|---|---|
| D1 | What does the reward cover? | **One service**: the cheapest one of the appointment (a single-service appointment is therefore fully free). It does not cover the whole appointment. | Revised, confirmed |
| D2 | Are `price_at_booking` snapshots zeroed? | **No.** Snapshots keep the real catalog price. The free service is **derived**, not stored: `is_reward_redemption = true` plus "cheapest service of the appointment". The API exposes the result (`rewardDiscount`, `amountDue`). Alternatives rejected: zeroing the snapshot loses the real price; a stored per-service marker has to be kept in sync whenever the services are edited. | Revised, confirmed |
| D3 | How many reward appointments can a client hold at once? | **One** open reward appointment (`scheduled`, `rescheduled` or `checked_in`). While one is open, any other appointment the client books is a normal one (no error). | Unchanged |
| D4 | Who sets the flag, and can it change? | **Only the system, at creation.** No client, staff member or request field can set it, and it is immutable afterwards. To switch, cancel and rebook; a cancelled reward appointment keeps the reward, so the rebooked appointment gets it again if the client still qualifies. | Revised |
| D5 | What if the counter is above 6 when the reward appointment completes? | The counter **drops by 6** (never below 0) and the surplus is **kept**. Example: 8 → 2. A client left with 6 or more qualifies again on their next booking. The no-show of a reward appointment is different on purpose: it still resets the counter to 0 and the surplus is lost, as an incentive to attend (see §6). | Revised, confirmed |
| D6 | Staff and walk-ins | The reward is applied to a registered client's appointment whoever books it: the client, or a receptionist/manager on their behalf, including a walk-in. Staff have nothing to activate. Guests, and walk-ins for guests, never get it. Clients cannot create walk-ins. | Revised |
| D7 | Can the client opt out? | **No.** The reward applies to the first booking made once the client qualifies. | New, confirmed |
| D8 | When is eligibility evaluated? | **At creation only**, not retroactively. Appointments already booked before the client reached 6 stay normal even if they are completed after the client qualifies. Editing an appointment never changes the flag. | New, confirmed |
| D9 | What happens to the free service when a reward appointment's services are edited? | It is **recalculated**: the cheapest of the new set (kept services keep their snapshot price; new ones use the catalog price). Because it is derived (D2), nothing is stored or synced. | New, confirmed |
| D10 | Tie on the lowest price | Deterministic rule: lowest price, then lowest `service_id`. Equal prices mean the same discount amount, so only which service is labeled free depends on it. | New, confirmed |

**API contract changes**

- `POST /api/appointments` has **no** reward field. A body that includes `isRewardRedemption` has no effect (the create schema is not strict, so unknown keys are dropped). There are **no new error codes**: not qualifying, a guest booking or an already open reward appointment simply produce a normal appointment.
- `PUT /api/appointments/:id` keeps rejecting `isRewardRedemption` with `400` (strict schema).
- Appointment responses (client and staff variants, create, get and list) gain `rewardDiscount` (`{ serviceId, amount }` or `null`) and `amountDue` (sum of the snapshots minus the discount).
- `GET /api/clients/:id/loyalty` returns the progress and whether the **next booking** will carry the reward (`rewardAppliesOnNextBooking`).

**Threshold**: one backend constant, `LOYALTY_REWARD_THRESHOLD = 6`, returned by the API so no client application hard-codes it.

## 4. Impact on the existing sub-issues

| Subtask | Issue | Change | Action on the issue |
|---|---|---|---|
| ST-11 Counter carry-over | none | **New**: reward completion subtracts 6 instead of resetting to 0 | Create |
| ST-1 DB guard | [#284](https://github.com/Jesus-Velazquez-mx/Barberia/issues/284) | Kept as a safety net. Trigger errors are no longer part of the public error contract. Tests that set the flag through `UPDATE` must be fixed. | Edit body |
| ST-2 Loyalty status | [#285](https://github.com/Jesus-Velazquez-mx/Barberia/issues/285) | `canRedeem` becomes `rewardAppliesOnNextBooking`; the eligibility rule is a pure function shared with the booking transaction. | Edit body |
| ST-3 Create appointment | [#286](https://github.com/Jesus-Velazquez-mx/Barberia/issues/286) | **Rewritten.** No request field, no 409/400 rejections. The server decides inside the booking transaction, and responses expose the free service and amount due. | Retitle and rewrite body |
| ST-4 Frontend services | [#287](https://github.com/Jesus-Velazquez-mx/Barberia/issues/287) | No `isRewardRedemption` in `createAppointment`, no new error messages. Add the new response fields. | Edit body |
| ST-5 Progress view | [#289](https://github.com/Jesus-Velazquez-mx/Barberia/issues/289) | The button just goes to booking (no option to turn on). Rules text updated, including that surplus progress is kept. | Edit body |
| ST-6 Booking option | [#290](https://github.com/Jesus-Velazquez-mx/Barberia/issues/290) | **Replaced.** There is no toggle. The booking summary shows the benefit that will be applied. #290 is closed as "not planned": reopen and rewrite it, or open a new sub-issue. | Reopen or create |
| ST-7 Staff visibility | [#291](https://github.com/Jesus-Velazquez-mx/Barberia/issues/291) | Wording only ("next booking has a free service"). | Edit body |
| ST-8 Tests | [#288](https://github.com/Jesus-Velazquez-mx/Barberia/issues/288) | **Rewritten.** The 409/400 cases disappear; automatic application, cheapest service, concurrency and edit recalculation appear. | Rewrite body |
| ST-9 Docs and E2E | [#292](https://github.com/Jesus-Velazquez-mx/Barberia/issues/292) | The business docs were already aligned with the revised rules (done); this task only moves them to "implemented". #253 is no longer a blocker. | Edit body |
| ST-10 Free service in appointment views | none | **New**: show which service is free and the amount due wherever appointments are shown | Create |

## 5. Dependency overview

```
ST-11 (counter carry-over) ── independent; must land before ST-8 and ST-9

ST-1 (DB guard) ──────┐
                      ├─► ST-3 (auto reward on create) ─┬─► ST-8 (API tests)
ST-2 (status service) ┤                                 │
                      └────────────────────────────────┬┴─► ST-4 (frontend service) ─┬─► ST-5 (client progress UI)
                                                                                      ├─► ST-6 (booking summary)
                                                                                      ├─► ST-7 (staff visibility, optional)
                                                                                      └─► ST-10 (free service in views)

ST-3, ST-5, ST-6, ST-8, ST-10, ST-11 ──► ST-9 (docs → implemented + end-to-end QA)
```

ST-1 and ST-2 have no dependencies and can be built in parallel. ST-4 depends on the API contract of ST-2 and ST-3, so it can start from the OpenAPI annotations once those are agreed.

**External dependencies**: none are open anymore. [#253](https://github.com/Jesus-Velazquez-mx/Barberia/issues/253) (completion job), [#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255) (counter test matrix) and [#260](https://github.com/Jesus-Velazquez-mx/Barberia/issues/260) (walk-in UI) are closed, so the full cycle can be checked end to end in ST-9. ST-8 still covers only the redemption-specific cases and must not duplicate #255.

**Suggested order**: ST-11 and (ST-1, ST-2 in parallel) → ST-3 → ST-4 → (ST-5, ST-6, ST-7, ST-10 in parallel, ST-8 alongside ST-3) → ST-9.

---

## ST-1 — Database guard for reward appointments

**Label:** `backend` · **Depends on:** none · **Blocks:** ST-3, ST-8

**Suggested title (ES):** Trigger de validación para citas con recompensa

**Description**
Add a trigger to `backend/database/init_database.sql` so the database itself enforces the invariants, whichever code path inserts the row. The schema is the single source of truth and there is no migration tool, so edit the file directly.

This is now a **safety net**, not the place where the reward is decided. ST-3 decides inside the booking transaction and sets the flag only when the client qualifies, so in normal operation the trigger never rejects anything. Its job is to stop any other path (a script, a future endpoint, a mistake) from creating an invalid reward appointment.

- `BEFORE INSERT` on `appointments` when `NEW.is_reward_redemption` is true:
  - Reject if `client_id IS NULL` (guest or deleted client).
  - **Inside the trigger function (PL/pgSQL)**, lock the client row (`SELECT completed_services_count FROM clients WHERE user_id = NEW.client_id FOR UPDATE`) and keep the result in a variable. This serializes concurrent bookings of the same client and must happen **before** the two checks below, so they read state nobody else can change. It is SQL only: no file under `backend/src/` changes in this subtask.
  - ST-3 takes the same lock from TypeScript (`createAppointmentWithServices` in `appointmentRepository.ts`) earlier in the same transaction, so the trigger's lock is a re-lock and cannot deadlock. The trigger still needs its own lock because it covers the paths that do not go through ST-3. Lock order across the transaction: barber row, then client row.
  - Reject if `completed_services_count < 6`.
  - Reject if the client already has another appointment with `is_reward_redemption` in `scheduled`, `rescheduled` or `checked_in`.
- `BEFORE UPDATE` when `OLD.is_reward_redemption IS DISTINCT FROM NEW.is_reward_redemption`: reject (the flag is immutable, D4).
- Do not re-validate the count on other updates (edit, cancel, check-in, no-show, completion): the counter legitimately stays ≥ 6 until completion.
- Use distinct custom SQLSTATEs, following the `BB001` / `BM001` pattern already in the file. They are for tests and logs; they are **not** part of the public error contract anymore.

**Existing tests and data that this breaks (fix in this subtask)**
The immutability rule rejects tests that turn the flag on with an `UPDATE`: `tests/appointmentCancel.test.ts` (around line 189), `tests/appointmentCheckIn.test.ts` (around lines 420 and 551) and `tests/completeAppointmentsJob.test.ts` (around line 270). Change them to create the appointment with the flag already set after raising the client's counter (a small test helper is enough). `database/mock_data.sql` inserts reward appointments in three places and needs the same treatment.

**Acceptance criteria**
- [ ] Inserting a reward appointment for a client with count < 6 fails.
- [ ] Inserting a reward appointment for a guest or with `client_id` NULL fails.
- [ ] A second open reward appointment for the same client fails, including when two inserts run concurrently (exactly one succeeds).
- [ ] After the first reward appointment is `cancelled`, `completed` or `no_show`, a new one is allowed if the count still qualifies (after `cancelled` the counter is untouched, so the client keeps the reward).
- [ ] Changing `is_reward_redemption` on an existing row fails in both directions.
- [ ] Editing, cancelling, checking in, completing or marking no-show on a reward appointment still works and still triggers the existing loyalty triggers unchanged.
- [ ] `mock_data.sql` and the three test files above are updated and pass; the CI schema load (`backend-tests`) passes.
- [ ] The trigger errors can be told apart by SQLSTATE.

---

## ST-11 — Keep surplus progress when a reward appointment completes

**Label:** `backend` · **Depends on:** none · **Blocks:** ST-8, ST-9

**Suggested title (ES):** Conservar el progreso sobrante al completar una cita con recompensa

**Description**
Change `update_client_loyalty_count()` in `backend/database/init_database.sql` so completing a reward appointment subtracts the threshold instead of resetting to 0 (D5): `completed_services_count = GREATEST(completed_services_count - 6, 0)`. The `GREATEST` is a safety net for the `CHECK (>= 0)`; the counter cannot normally be below 6 at that point. Non-reward completions still add 1.

- Keep the threshold in SQL as a single literal inside this function, with a comment pointing to `LOYALTY_REWARD_THRESHOLD` in the backend (ST-2) and to the guard trigger (ST-1), which also uses 6. Both SQL places and the backend constant must change together.
- Update the comment above the function ("resets the count back to 0") and the column comment near `completed_services_count` ("resets to 0 on redemption").
- Do **not** touch `reset_client_loyalty_count_on_no_show()`: a no-show on a reward appointment keeps resetting the counter to 0 on purpose (see §6).
- Existing tests that assert the reset to 0 on reward completion must change: `tests/completeAppointmentsJob.test.ts` (the case around line 263, "con recompensa ... reinicia el contador del cliente a 0") and any case of the counter matrix from #255 with the same expectation.

**Acceptance criteria**
- [ ] Completing a reward appointment with count 6 leaves the counter at 0.
- [ ] Completing a reward appointment with count 8 leaves the counter at 2; with count 12 it leaves 6, and the client qualifies again.
- [ ] Completing a non-reward appointment still adds 1, and the trigger still fires only on the transition to `completed` (no double counting).
- [ ] The `no_show` behavior and the cancel behavior are unchanged: a no-show on a reward appointment with count 8 still leaves 0.
- [ ] The updated tests pass in the CI `backend-tests` job.

---

## ST-2 — Loyalty status service and endpoint

**Label:** `backend` · **Depends on:** none · **Blocks:** ST-3, ST-4, ST-8

**Suggested title (ES):** Servicio y endpoint de estado de lealtad del cliente

**Description**
Add a single place that answers "where does this client stand?". The **rule** lives in one pure function so the endpoint and the booking transaction (ST-3) cannot disagree.

- Constant `LOYALTY_REWARD_THRESHOLD = 6` in the backend (one definition).
- Pure function `evaluateReward(count, hasOpenRewardAppointment)` that returns `rewardAvailable` (count ≥ threshold) and `rewardAppliesOnNextBooking` (`rewardAvailable && !hasOpenRewardAppointment`).
- `getLoyaltyStatus(clientId)` for the endpoint, returning: `completedServicesCount`, `threshold`, `appointmentsUntilReward` (`max(0, threshold − count)`), `rewardAvailable`, `hasOpenRewardAppointment` and `rewardAppliesOnNextBooking`.
- Two readers in `backend/src/repositories/clientRepository.ts`: one for the endpoint (`pool.query`, no lock) and an in-transaction one, e.g. `getLoyaltyStateForUpdate(client: PoolClient, userId)`, that receives the **open transaction connection** and, on it, runs `SELECT completed_services_count FROM clients WHERE user_id = $1 FOR UPDATE` plus the open-reward-appointment check, returning `{ completedServicesCount, hasOpenRewardAppointment }`. `getClientByUserId` cannot be reused: it uses `pool.query` (another connection), so its lock would be released immediately. The new function opens no transaction; ST-3's `createAppointmentWithServices` calls it right after locking the barber and before the `INSERT`. This subtask delivers the function and does not modify `appointmentRepository.ts`.
- Endpoint `GET /api/clients/:id/loyalty` (the exact path follows the existing client routes). Authorization follows the existing scope rules: a client can read only their own status; a receptionist or manager can read the status of a client for use in their shops. Document it with the JSDoc OpenAPI annotation like the other routes.

`rewardAppliesOnNextBooking` replaces the old `canRedeem`: nothing is redeemed by request anymore, so the name now says what it means (the next appointment this client books will carry the reward).

**Acceptance criteria**
- [ ] Count 0, 5, 6 and 9 return the correct `appointmentsUntilReward`, `rewardAvailable` and `rewardAppliesOnNextBooking`.
- [ ] A client holding an open reward appointment gets `rewardAvailable: true` and `rewardAppliesOnNextBooking: false`.
- [ ] A client reading another client's status gets `403`; an unknown client gets `404`; a missing or invalid token gets `401`.
- [ ] The threshold is returned by the API so no client app hard-codes it.
- [ ] Response uses the standard `{ data, message, error }` envelope and is listed in `/api-docs`.

---

## ST-3 — Apply the reward automatically when creating an appointment (API)

**Label:** `backend` · **Depends on:** ST-1, ST-2 · **Blocks:** ST-4, ST-8, ST-9

**Suggested title (ES):** Aplicar automáticamente la recompensa al agendar (POST /api/appointments)

**Description**
When a registered client books and qualifies, the appointment is created as a reward appointment and the response says which service is free. The request does not change.

- **Request**: no new field. `createAppointmentSchema` stays as is; an `isRewardRedemption` key in the body is ignored. `updateAppointmentSchema` stays `strictObject`, so the flag stays rejected on edit; add a test that proves it.
- **Decision point**: `createAppointmentWithServices` (`appointmentRepository.ts`), **inside the existing transaction**. After the barber-row lock, and only when `clientId` is not null: call **`getLoyaltyStateForUpdate(client, clientId)`** (`clientRepository.ts`, delivered by ST-2) with the transaction's connection. It locks the client row `FOR UPDATE` (lock order: barber first, then client, always the same) and returns `{ completedServicesCount, hasOpenRewardAppointment }`; then call `evaluateReward` and add `is_reward_redemption` to the `INSERT` with `rewardAppliesOnNextBooking`. Do not read the loyalty state through `getClientByUserId` or `pool.query`: that is another connection and the lock would protect nothing. The decision must **not** be made in `registerAppointment` before the transaction: two concurrent bookings would both see "no open reward appointment" and both get the reward.
- `registerAppointment` (`appointmentService.ts`): no reward logic. It keeps resolving the client as today (a client books for themselves; staff pass `clientId`). Guests and guest walk-ins get a normal appointment without any error.
- **Free service (D1, D9, D10)**: pure function `getRewardDiscount(services)` returning `{ serviceId, amount }` for the cheapest snapshot (tie: lowest `service_id`), or `null`. The mapper (`utils/appointmentMapper.ts`) uses it for every response variant (`toAppointmentResponse` and `toClientAppointmentResponse`, so create, get and list all carry it) when `is_reward_redemption` is true, and adds `rewardDiscount` and `amountDue`. Nothing about the discount is stored.
- **Edit path**: `updateAppointment` / `updateAppointmentWithServices` keep the flag untouched. Because the discount is derived, a services edit recalculates the free service on its own; no change to those functions beyond a test.
- Leave `price_at_booking` snapshots untouched (D2).
- Update the OpenAPI annotations in `appointmentRoutes.ts`: remove nothing from the request, add `rewardDiscount` and `amountDue` to the appointment response schemas (the two `priceAtBooking` blocks near lines 83 and 191), and document that the reward is applied automatically.
- No new `ApiError` codes.

**Acceptance criteria**
- [ ] A registered client with count ≥ 6 and no open reward appointment books and gets `isRewardRedemption: true`, the cheapest service in `rewardDiscount` and the correct `amountDue`; the appointment shows the badge in the web app.
- [ ] With a single service, that service is the free one and `amountDue` is 0.
- [ ] With several services, only the cheapest is free; with a tie on price the result is deterministic.
- [ ] A client with count < 6 gets a normal appointment (`isRewardRedemption: false`, `rewardDiscount: null`, `amountDue` equal to the sum). No error.
- [ ] A client who already has an open reward appointment gets a normal appointment for any further booking. No error.
- [ ] Guest bookings, and walk-ins for guests, are always normal.
- [ ] A receptionist or manager booking for a qualifying registered client, including a walk-in, gets the reward. Existing scope rules (`canCreateAppointment`, `canManageShopWalkIns`) still apply, and a client still cannot create walk-ins.
- [ ] A request body with `isRewardRedemption: true` from a non-qualifying client does not create a reward appointment.
- [ ] `PUT /api/appointments/:id` with `isRewardRedemption` still returns `400`, and editing time, barber, services or notes on a reward appointment keeps the flag; after a services edit `rewardDiscount` points to the new cheapest service.
- [ ] Cancelling a reward appointment leaves the counter and the flag unchanged, and the client's next booking carries the reward again.
- [ ] Two concurrent bookings for the same qualifying client produce exactly one reward appointment (the other is normal), and neither fails.
- [ ] `price_at_booking` and `duration_minutes_at_booking` snapshots on a reward appointment are the real catalog values.

---

## ST-4 — Frontend service layer and types for loyalty

**Label:** `frontend` · **Depends on:** ST-2, ST-3 (API contract) · **Blocks:** ST-5, ST-6, ST-7, ST-10

**Suggested title (ES):** Servicios y tipos del frontend para lealtad

**Description**
Prepare the web app to call the new API and to read the new appointment fields. Nothing needs to be *sent* for the reward anymore.

- New `frontend/src/services/loyaltyService.ts` with `getLoyaltyStatus(token, clientId)` built on `apiClient`.
- A `LoyaltyStatus` type in `frontend/src/types/`.
- Extend the appointment type (`types/appointmentType.ts`) and the response mapping in `services/appointmentService.ts` (around line 189, where decimals are converted with `Number(...)`) with `rewardDiscount` and `amountDue`.
- A pure helper in `utils/appointmentUtils.ts` that previews the discount for a set of selected services and prices (cheapest, same rule as the backend), used by ST-6 and ST-10. It is a preview: the server response is the authority.
- `createAppointment` does **not** change. There are no new error cases to map.

**Acceptance criteria**
- [ ] `getLoyaltyStatus` returns a typed result and throws the standard `ApiError` on failure.
- [ ] Appointments returned by the service include `rewardDiscount` and `amountDue` as numbers, and `null` / the plain total when there is no reward.
- [ ] `createAppointment` and its existing callers are unchanged.
- [ ] `npm run build`, lint and the Prettier check pass (the CI `frontend-tests` job).

---

## ST-5 — Client loyalty progress view

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** ST-9

**Suggested title (ES):** Vista de progreso de lealtad para el cliente

**Description**
Show the client where they stand: for example "4 de 6 citas completadas" with a progress indicator. At 6, a clear state such as "Tu próxima cita incluye un servicio gratis" with a button that goes to booking. The button only navigates; there is nothing to switch on. Place it on the client home and/or profile page.

The progress must come from `getLoyaltyStatus`, **not** from `user.completedServicesCount` in `AuthContext`: that user object is persisted to `localStorage` at login and goes stale after every completed appointment.

**Acceptance criteria**
- [ ] Count 0–5 shows the number completed and how many are left; count ≥ 6 shows the reward-available state.
- [ ] When the client already has an open reward appointment, the view says so and does not promise a second free service.
- [ ] The value shown is correct after an appointment is completed or marked no-show, without logging out and back in.
- [ ] The text explains the rules the client needs: each completed appointment counts as 1; the reward is applied automatically to the next appointment you book, on its cheapest service; you can have one reward appointment at a time; a cancelled reward appointment keeps the reward; a no-show loses it **and resets all your progress to 0**; and after the free appointment 6 are subtracted from the count and any progress above 6 is kept (D5), for example 8 becomes 2.
- [ ] Works at phone width, consistent with the existing Tailwind styling.
- [ ] The view loads and fails gracefully (error state, no crash) when the request fails.

---

## ST-6 — Show the automatic reward in the booking summary

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** ST-9

**Suggested title (ES):** Mostrar la recompensa automática en el resumen de agendado

**Description**
**Replaces** "Use free haircut option". There is no toggle and nothing for the user to decide. The booking flow (`BookAppointmentContainer.tsx`, shared by clients, receptionists and managers) only has to tell the user what will happen, so nobody is surprised at the counter.

- Client: after loading their loyalty status, if `rewardAppliesOnNextBooking` is true, the summary shows a notice such as "Esta cita incluye un servicio gratis: {servicio} (−$X)" and the amount due, computed with the ST-4 preview helper from the selected services. It updates as services are added or removed, since the cheapest one can change.
- Staff: once a registered client is selected, load that client's status and show the same notice. Show nothing for a guest. Reload when the selected client changes.
- The reward notice is informative. The server decides, and after booking the confirmation and the appointment use `rewardDiscount` / `amountDue` from the response and the existing `RewardBadge`.
- The same form is reused by the walk-in flow (#260), so the notice appears there too.

**Acceptance criteria**
- [ ] An eligible client sees the notice and the amount due, and no control to enable or disable it.
- [ ] A client who is not eligible, or who already has an open reward appointment, sees no notice and the normal total.
- [ ] Changing the selected services changes which service is shown as free and the amount due.
- [ ] For staff the notice appears only for a selected registered client; guest mode hides it; changing the selected client reloads the status.
- [ ] If the status changed between the preview and the booking (the server applies a different outcome), the confirmation shows what the server returned, with no broken state.
- [ ] The normal (non-reward) booking flow is unchanged.
- [ ] Lint, build and Prettier pass.

---

## ST-7 — Loyalty progress for staff (optional)

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** none

**Suggested title (ES):** Visibilidad del progreso de lealtad para el personal

**Description**
Replace the raw "Servicios" number in `ClientTableComponent.tsx` (it currently shows `completedServicesCount`) with a readable progress such as "4/6" and a marker such as "Próxima cita con servicio gratis", so receptionists and managers know at the front desk that the reward will apply when they book for that client. If the client list can't use the per-client endpoint efficiently, derive it from the count and the threshold returned by the API, without hard-coding 6.

**Acceptance criteria**
- [ ] The staff client table shows progress toward the next reward and marks clients whose next booking will carry the reward.
- [ ] The threshold is not hard-coded in the frontend.
- [ ] The staff client list's existing behavior (search, pagination, actions) is unchanged.

---

## ST-8 — Backend integration tests for the automatic reward

**Label:** `backend` · **Depends on:** ST-1, ST-2, ST-3, ST-11 · **Blocks:** ST-9

**Suggested title (ES):** Pruebas de integración de la recompensa automática

**Description**
Add Jest/Supertest tests under `backend/tests/` for the reward-specific behavior. Do **not** repeat the counter matrix already covered by [#255](https://github.com/Jesus-Velazquez-mx/Barberia/issues/255) (increment, reset, no-show, guests, idempotency). Move test appointments to `completed` and `no_show` with direct SQL updates where that is simpler than running the jobs.

**Acceptance criteria**
- [ ] Eligibility: count 5 gives a normal appointment; count 6 and count above 6 give a reward appointment. No test expects `409` for these cases.
- [ ] Cheapest service: single service is free (`amountDue` 0); several services free only the cheapest; a price tie is deterministic; `amountDue` equals the sum minus the discount.
- [ ] Guest bookings, and walk-ins for guests, never get the reward; a receptionist or manager booking for a registered client (also a walk-in) does; a client cannot create a walk-in.
- [ ] One open reward appointment at a time: a second booking while one is open is normal; after the first is cancelled, completed or marked no-show, the next booking can get the reward if the count still qualifies (after `cancelled` it does).
- [ ] Concurrent bookings of two appointments for one qualifying client produce exactly one reward appointment and two `201` responses.
- [ ] The flag cannot be set from the request (a body with `isRewardRedemption: true` from a non-qualifying client is ignored) and cannot be changed through `PUT /api/appointments/:id` (`400`). Editing or rescheduling keeps it, and a services edit recalculates `rewardDiscount`.
- [ ] Appointments booked before the client reached 6 stay normal even after the client qualifies (D8).
- [ ] Loyalty status endpoint: values and authorization cases from ST-2.
- [ ] A full cycle: reach 6, book (reward applied), complete → counter 0 and the next booking is normal until the client earns again; and reach 6, book, no-show → counter 0.
- [ ] Carry-over: reach 8, book (reward applied), complete → counter 2; reach 12, complete the reward appointment → counter 6 and the next booking gets the reward again. Counter assertions that belong to the matrix of #255 are not repeated here beyond these cases.
- [ ] The suite passes in the CI `backend-tests` job against `init_database.sql`.

---

## ST-9 — Final documentation update and end-to-end verification

**Label:** `task` · **Depends on:** ST-3, ST-5, ST-6, ST-8, ST-10, ST-11 · **Blocks:** closing #281

**Suggested title (ES):** Actualizar documentación y verificar la recompensa automática de punta a punta

**Description**
The rules were already corrected in the docs (overview §3.3, §4, §5; architecture §1.4, §2, §5; `R-LO-*` in `epic-appointment-status-business-rules.md`). This task updates them from "decided, not yet implemented" to "implemented" and verifies the whole feature on a local stack. There is no external dependency left: appointments can be completed by the job from #253.

- `docs/architecture.md`: §1.2 "Implementation status" and loyalty side effects, §1.4 "Loyalty" (the "decided, not yet implemented" note), §2 "Redeeming a loyalty reward" (from "partially implemented" to implemented, describing the automatic flow, the transactional decision, the guard trigger, the response fields and the status endpoint) and the loyalty questions in §5. Fix the statements that still say there are no check-in, no-show or walk-in endpoints, if not already fixed.
- `docs/barbershop-app-overview.md`: confirm §3.3 and the loyalty journey in §4 match the final behavior.
- Update the two SQL comments that still say "paid services" (`init_database.sql` lines near the counter column and the loyalty trigger) to "completed appointments". Coordinate with ST-11, which edits the same comments.
- Manual walkthrough on a local stack with real data (see the acceptance criteria below).

**Acceptance criteria**
- [ ] Docs describe the implemented flow, the endpoint, the guard, the response fields and the threshold constant, with no remaining statement that redemption cannot be set through the API or that the client chooses it.
- [ ] End-to-end walkthrough passes: a client completes 6 appointments, sees the reward state, books an appointment with several services, sees the cheapest one marked free and the amount due, the appointment is checked in and completed, and the counter drops by 6 (to 0, or to the surplus if the client had more than 6).
- [ ] Other paths pass: cancel a reward appointment (reward kept, counter unchanged, the rebooked appointment gets it again) and no-show a reward appointment (reward lost, counter 0).
- [ ] A staff user books for a qualifying registered client at the front desk, including a walk-in, and sees the reward applied; a guest booking never shows it.
- [ ] All CI jobs (`backend-tests`, `frontend-tests`) are green on the final PR.

---

## ST-10 — Show the free service in appointment views

**Label:** `frontend` · **Depends on:** ST-4 · **Blocks:** ST-9

**Suggested title (ES):** Mostrar el servicio gratis y el monto a pagar en las vistas de citas

**Description**
Today the web shows `priceAtBooking` per service and adds them up, so a reward appointment would look fully charged, and nobody could tell which service is free. Wherever an appointment's services or total are shown, use `rewardDiscount` and `amountDue` from the API instead of recomputing.

- Service rows in `AppointmentDetailContentComponent` and `AppointmentDetailModalComponent` (they print `priceAtBooking`): mark the free service ("Gratis") and keep its real price visible (struck through or as a note).
- Totals: `appointmentUtils.ts` (the sum around line 157) and `CancelAppointmentModalComponent` (the `total` around line 73) must show `amountDue`, with the original total available when there is a discount.
- `EditAppointmentModalComponent`: when services change on a reward appointment, show the recalculated free service and amount due (ST-4 preview helper) before saving.
- `RewardBadge`: its text/tooltip should say that it includes a free service, not that the whole appointment is free.
- `CancelAppointmentModalComponent` and `MarkNoShowModalComponent` keep their reward notes; revisit the wording so it speaks of the free service. The no-show warning must say that the reward **and all accumulated progress** are lost (the counter goes back to 0).

**Acceptance criteria**
- [ ] A reward appointment shows which service is free in the detail views (client and staff) and the amount due everywhere a total is shown.
- [ ] Non-reward appointments render exactly as before.
- [ ] Editing the services of a reward appointment shows the new free service and amount due before confirming.
- [ ] No component outside the shared helper recomputes the discount from scratch.
- [ ] Lint, build and Prettier pass.

---

## 6. Risks, notes and open questions

- **Surplus progress is kept (D5, decided).** A client who completes extra appointments while a reward appointment is still open, or who completed appointments booked before reaching 6 (D8), no longer loses them: completing the reward appointment subtracts 6 and the rest stays. A client left with 6 or more qualifies again on the next booking, which is consistent with D3 (the next one is only blocked while a reward appointment is open). The threshold now lives in three places that must change together: the backend constant, the guard trigger (ST-1) and the carry-over trigger (ST-11).
- **No-show on a reward appointment resets to 0 (decided).** The approved rule (`R-LO-3`) stays: the counter goes to 0 and any surplus is lost too. This is intentional, to give clients a stronger incentive not to miss an appointment. It is deliberately asymmetric with completion (which keeps the surplus), so the client-facing text (ST-5 rules, `MarkNoShowModalComponent` warning) must say that a no-show loses the reward **and all accumulated progress**. `reset_client_loyalty_count_on_no_show()` does not change.
- **No opt-out (D7).** A client cannot postpone using the reward or save it for a more expensive service: it applies to the next booking. They can shape the benefit by choosing which services go in that appointment, and cancelling and rebooking (which keeps the reward) is the only way to start over. The ST-5 text and the ST-6 notice should make this visible.
- **The free service is derived, not stored (D2).** Reports that need the discount (revenue, redemption rate) must repeat the rule "cheapest snapshot of an `is_reward_redemption` appointment" in SQL. If the rule ever changes, the history of past appointments would be recomputed under the new rule. If that is not acceptable, store the discount at creation (and on edit) instead; it costs a column and the sync logic ST-3 avoids today.
- **Concurrency depends on lock order.** ST-3 takes barber → client row locks in that order, and ST-1 re-takes the client lock inside the same transaction. The loyalty triggers update `clients` rows too (on completion by the job). Keep the order and the tests in ST-8 for concurrent bookings.
- **Stale counter in the browser.** `AuthContext` caches the user, including `completedServicesCount`, in `localStorage`. All new UI must read loyalty data from the new endpoint.
- **Reporting.** With no ledger, "loyalty redemption rate" reports can only be approximated from `is_reward_redemption` and appointment timestamps.
- **Android** has no booking or loyalty screens, so it is intentionally excluded. The new response fields are additive, so it is not affected.
