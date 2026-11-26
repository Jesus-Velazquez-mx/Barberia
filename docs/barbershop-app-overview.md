# Barbershop App — Business Overview

## 1. Product Overview

This project consists of building an app for a barber shop, available on web and mobile (Android, clients only). Its main focus is managing appointments. Other core functionalities are:

- Give clients haircut suggestions based on their facial structure and preferences
- Implement a fidelity program for clients to get free haircuts
- Send reminders for appointments through Telegram

The web app serves every role — clients, receptionists, and managers/assistants each get a view suited to their role. The mobile (Android) app is **client-facing only** (decided): receptionist and manager functionality, such as check-in and walk-in registration, is web-only and out of scope for mobile.

## 2. User Roles

- **Clients**: book appointments, receive haircut recommendations, track their loyalty progress and receive loyalty rewards, receive reminders.
- **Barbers**: not users of the system and have no account. Their schedule is managed by their shop's manager, and their appointments are managed by receptionists and managers (see §3.1).
- **Receptionists**: manage day-to-day appointments at their shop — booking, check-in, walk-ins, cancellations/reschedules — as a dedicated role distinct from managers/assistants. They can only create, edit, and cancel appointments booked in their assigned shop.
- **Managers / Assistants**: manage the shared services catalog, oversee each shop's supplies inventory, staffing and availability, and review reporting/analytics. Each shop has exactly one manager, but a manager can oversee multiple shops. They can create, edit, and cancel appointments in any of the shops they manage (and in no others), and they manage the schedule of those shops' barbers.

Self-service sign-up always creates a **client** account (decided) — receptionist and manager accounts are provisioned by staff, not through public registration. Barbers have no account at all (see above).

Deleting a user is immediate and permanent (decided) — there is no deactivation or "soft delete" state. Deleting a client keeps their past appointments as history, but detaches them from the account; the appointments remain identifiable as having belonged to a registered client (see §3.1).

## 3. Core Features

### 3.1 Appointment Booking & Scheduling

Clients book appointments against a barber's availability. Walk-ins are also supported alongside scheduled bookings — the shop isn't appointment-only (decided). Barbers are not system users, so their calendar is managed by their shop's manager — one appointment at a time per barber (no multiple chairs). An appointment's duration is the sum of the individual durations of all its booked services. Every barber is assigned to one shift (initially morning 8:00–16:00 or afternoon 12:00–20:00; managers can define others) and works Monday through Saturday; only a manager can set or change a barber's shift assignment. The policy for editing and cancelling appointments is defined in "Editing and cancelling appointments" below; waitlists are still undefined — see open questions.

Appointments can also be booked for **unregistered clients** (decided): staff record only the client's name, with no account, phone, or email. Every appointment is therefore either for a registered client or for a guest, and this is recorded explicitly so the two can always be told apart in reporting — even if a registered client's account is later deleted, their past appointments still count as registered-client appointments. Guest appointments don't earn loyalty credit and don't get reminders, since there is no account or contact info to attach them to. A guest appointment can never be converted to a registered-client appointment, nor the reverse.

#### Editing and cancelling appointments

All rules below are decided.

**Who can create, edit, and cancel**
- Clients, receptionists, and managers can all create, edit, and cancel appointments. Barbers cannot, since they are not system users.
- Receptionists can only act on appointments booked in their assigned shop. Managers can act on appointments in any of the shops they manage.
- Clients can edit or cancel an appointment only while 8 hours or more remain before the booked time. Under 8 hours, they can do neither. This cutoff applies only to clients; receptionists and managers are not subject to it (they are still bound by the status rule below).

**What "editing" means and what can be edited**
- Editing covers rescheduling and re-assigning the appointment to another barber.
- Editable fields: date and time, barber, services, and notes.
- The client cannot be edited. To change the shop of an appointment, the user must cancel it and create a new one.

**When an appointment can be edited**
- Only future appointments, with status scheduled or rescheduled, can be edited. Once an appointment is checked in, it can no longer be edited.

**Rescheduling**
- The new date must fall within the window running from the date the appointment was booked until 30 days after that date.
- It can move to an earlier or later day than the original, or stay on the same day at an earlier or later time.
- The new slot must still satisfy the availability and no-overlap rules above (barber's shift, Monday–Saturday, one appointment at a time per barber).

**Barber re-assignment**
- A reschedule may re-assign the appointment to another barber only if that barber works in the same shop as the original one.
- Whether to keep the same barber or switch is up to the user making the change.

**Changing services**
- Since the duration is the sum of the services' durations, changing services can change the duration.
- If the barber is unchanged and the new total duration is longer than the original, the system must check that the barber has enough free time after the appointment to fit it. Appointments with the same barber can never overlap.

**Limits and traceability**
- There is currently no limit on how many times an appointment can be cancelled or rescheduled.
- There is currently no audit trail of changes to appointments.

**Loyalty rewards and no-shows**
- If an appointment that includes a loyalty reward is cancelled, by the client or by staff, the client keeps the reward: it is applied again, automatically, to the next appointment they book.
- The reward is lost only when the appointment is marked as a no-show (see §3.3).

**Notifications**
- Reminders are implemented through Telegram (see §3.4). The system does not send a confirmation when an appointment is booked, nor a notification when it is edited or cancelled (decided).

### 3.2 Haircut Recommendations

Clients submit a photo and/or facial-structure attributes, stated preferences, and possibly hair type/texture, and receive suggested haircuts (with an explanation or confidence level). This is an assistive feature — it informs the client's choice but doesn't restrict what they can book.

### 3.3 Loyalty / Fidelity Program

Clients accumulate credit toward free services: every 6 completed appointments earns a free service on the next appointment they book (the 7th). Each client has a running count of completed appointments since their last free service. The count is flat (decided): each completed appointment adds exactly 1, regardless of which services it included or what they cost. Rewards never expire, and no other promotions exist or are planned, so there is nothing to combine a reward with.

**Receiving a reward** (all decided):
- The reward is applied **automatically**. Nobody requests, chooses or confirms it, and it can't be declined. When a registered client whose count has reached 6 books an appointment, that appointment is created as a reward appointment, whether the client books it themselves or a receptionist or manager books it for them.
- The reward covers **one service**: the cheapest one in the appointment. If the appointment has a single service, that service is free, so the whole appointment is free. If it has several, the client pays for all of them except the cheapest. When two services tie for the lowest price, the discount is the same whichever is picked.
- The appointment keeps the real catalog prices as a record. The system handles no payments, so it only shows which service is free and how much is left to pay.
- A client can hold only **one open reward appointment** (scheduled, rescheduled or checked in) at a time. While one is open, any other appointment the client books is a normal one.
- Eligibility is checked **when the appointment is created**, never afterwards, and it is not retroactive: appointments booked before the client reached 6 stay normal, even if they are completed later. Editing an appointment never adds or removes the reward.
- If the services of a reward appointment are edited, the free service is recalculated: it is always the cheapest of the services the appointment ends up with.
- When a reward appointment is completed, 6 are subtracted from the count and any progress above 6 is kept. For example, a client with 8 completed appointments is left with 2. A client left with 6 or more qualifies again on their next booking.
- Receptionists and managers book for a registered client within their shops, including a walk-in, and the reward applies on its own; they have nothing to activate. Guests never get a reward, and clients can't create walk-ins themselves. Rewards are global — earned and used at any shop, not tied to a specific barber. Only registered clients participate: appointments for unregistered clients never count toward a reward.
- If a client doesn't show up to an appointment that included a free service, and it is marked as a no-show, they lose that free service and their count restarts from 0, **including any progress above 6**. This is intentional: it gives clients a stronger incentive not to miss an appointment. Cancelling such an appointment, whether by the client or by staff, does not forfeit the reward: the client keeps it, and it is applied to the next appointment they book.

### 3.4 Appointment Reminders

Reminders are **implemented**, and **Telegram is the only messaging channel**. Clients are reminded ahead of their appointment to reduce no-shows and missed visits: one reminder about 24 hours before and another about 4 hours before the appointment.

- A client enables reminders by linking their Telegram account once: the **Recordatorios** page of the web app shows a QR code that opens the Mr. Barber bot in Telegram, where the client presses *Start*. There is no option to unlink the account.
- Reminders apply to registered clients only; appointments for unregistered clients have no contact info and are skipped. Walk-ins and appointments that are no longer scheduled or rescheduled (cancelled, checked in, completed, no-show) do not get reminders. A client who has not linked Telegram receives nothing, and the failed attempt is logged.
- Rescheduling an appointment re-times its reminders to the new date and time; cancelling it stops them.
- The system does **not** send a confirmation when an appointment is booked, nor a notification when it is edited or cancelled (decided).

### 3.5 Reporting (for Managers)

Managers need visibility into business performance — for example revenue, most-booked services, barber utilization, client retention/churn, and loyalty redemption rates. The exact set of reports needed is still to be defined; the first one implemented is the barber performance report.

**Barber performance report (implemented).** A manager picks one of their shops and a date range, and optionally a first and/or last name; with no name, every barber of the shop is evaluated. For each barber it shows first name, last name, email, assigned shop, completed vs. booked appointments, completed vs. booked services, and the percentage of booked services that were completed.

- A donut chart (all evaluated barbers or one of them, with an equivalent table) breaks down the booked services into completed, pending (no outcome yet), cancelled and no-show, so a low percentage can be told apart from services that simply have not happened yet.
- A manager can only report on the shops they manage (active or inactive). Receptionists and clients have no access.
- An appointment counts on the business-timezone day of its scheduled start. "Booked" is every appointment in the range regardless of status (including cancelled, no-show and not-yet-attended ones); "completed" is only the `completed` ones. A range that includes future days therefore lowers the percentage.
- Only appointments held at the evaluated shop count. A barber reassigned to another shop of the same manager, or soft-deleted, still appears if they had appointments at that shop within the range.
- The report is not generated if there are no completed services in the range.

### 3.6 Shop Supplies (Internal)

Each shop maintains its own inventory of the supplies used to deliver services (scissors, shampoo, conditioner, etc.) — these are never sold to clients and aren't part of any customer-facing catalog. Managers/assistants track stock levels per shop. Unlike the services menu, which is shared and identical across all shops, supplies inventory is independent per location. Each supply can have a reorder threshold; once stock drops to or below that threshold it's automatically flagged for reorder, and the flag clears automatically once it's restocked above the threshold.

Every stock entry (e.g. a purchase) and exit (e.g. usage, damaged items) is also recorded as a movement in a permanent history log, with the quantity, an optional unit cost and reason, and who performed it. Every movement is made by a staff user — the system never records movements on its own. The log keeps the person's name and role as they were at the time of the movement, so it's still clear who did what after that person's account has been deleted (with the limitation that former employees with the same name can't be told apart).

## 4. Example User Journeys

- **Booking an appointment**: a client picks a barber, service, and time slot within that barber's availability, and confirms the booking. No confirmation message is sent, but the client receives Telegram reminders ahead of the visit if they linked their account (see §3.4).
- **Getting a haircut recommendation**: a client submits a photo and/or preferences and receives suggested haircut styles to consider before or while booking.
- **Receiving a reminder**: a client who linked their Telegram account is reminded about 24 hours and 4 hours before their appointment.
- **Receiving a loyalty reward**: once their count reaches 6, the next appointment a client books (or a receptionist/manager books for them) automatically includes a free service: the cheapest one in the appointment. The appointment is marked as a reward appointment for reporting purposes. Completing it subtracts 6 from the count and keeps any surplus; cancelling it keeps the reward; a no-show loses it and resets the count to 0 (see §3.3).

## 5. Open Business Questions

These decisions materially affect the product and need to be settled up front.

**Business scope**
- Is this for a single barbershop location, or should the platform support multiple locations/franchises from day one (multi-tenancy)?

**Shops & staffing**
- Each shop has exactly one manager, assigned at shop creation, and a manager may oversee multiple shops (decided).
- A manager can't be deleted while still managing any shop — their shops must first be reassigned to another manager (decided).
- Users are deleted immediately rather than deactivated (decided). Deleting a client keeps their appointments as history.
- A barber can't be deleted while they have pending appointments — a manager or receptionist must first cancel, re-assign, and/or reschedule all of them, and only then can the barber be deleted (decided, not yet implemented).

**Fidelity/loyalty program**
- The rule is visit-based: every 6 completed appointments earns a free service on the next appointment booked, tracked as a running count from which 6 are subtracted when the reward appointment is completed (decided).
- The count does not vary by service type or price: each completed appointment adds 1, whatever services it included (decided).
- Rewards do not expire (decided). They are global — usable at any shop (decided), not tied to a specific barber.
- No other promotions are considered for the business, so reward/promotion combination rules are not needed (decided).
- No redemption ledger is part of the scope (decided). Redemptions are identified only by the `is_reward_redemption` flag on the appointment.
- The reward is applied automatically when a qualifying registered client books an appointment; there is no option to choose and no way to decline it (decided).
- The reward covers the cheapest service of the appointment, and the appointment keeps the real catalog prices as a record (decided). A single-service appointment is therefore fully free.
- A client can have only one open reward appointment at a time (decided). Whether an appointment is a reward appointment is decided when it is created, never changed afterwards, and not applied retroactively to appointments booked earlier. Editing the services of a reward appointment recalculates which service is free (decided).
- On completion of a reward appointment, 6 are subtracted from the count and any progress above 6 is kept (decided).
- A no-show on a reward appointment resets the count to 0, including any progress above 6, as an incentive to attend (decided).
- Staff booking for a registered client, including a walk-in, get the automatic reward with no extra step. Guests never get a reward (decided).

**Appointments & scheduling**
- Shifts are defined by managers: each lasts exactly 4, 6 or 8 hours, overlaps are allowed, exact duplicate time ranges are not; receptionists can view them. A shift can't be deleted if it's the only one or has staff assigned. Barbers work one shift Monday through Saturday; shift assignment is set only by managers (decided).
- Shop hours are effectively 8:00–20:00, Monday through Saturday (closed Sunday), based on the seeded shift windows (decided) — still need to confirm whether every shop staffs both shifts, and how shop hours follow once managers add other shifts.
- One appointment at a time per barber, no multiple chairs (decided).
- Cancellations and reschedules are decided (see §3.1): clients have an 8-hour cutoff, there is no cancellation/reschedule limit, a cancelled reward appointment keeps the reward, and a no-show on a free-service appointment forfeits it and resets the count (§3.3). Waitlists, and any penalties for no-shows beyond that, are still undefined.

**Notifications**
- The only channel is Telegram, and reminders are sent 24 hours and 4 hours before the appointment (decided, implemented).
- Booking confirmations and notifications for edits and cancellations are not sent (decided).
- Clients cannot unlink Telegram or opt out from the app today. Whether that is needed for consent/compliance is still open.

**Reporting**
- What reports does the manager need besides barber performance — revenue, most-booked services, client retention/churn, loyalty redemption rates?

**Payments**
- Payment is always done in person at the barbershop; the system does not handle payments or deposits (decided).

For the technical implications of these decisions (schema design, infrastructure sizing, integration choices), see [`architecture.md`](./architecture.md).
