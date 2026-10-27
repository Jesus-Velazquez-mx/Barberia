# Barbershop App — Business Overview

## 1. Product Overview

This project consists of building an app for a barber shop, available on web and mobile (Android). Its main focus is managing appointments. Other core functionalities are:

- Give clients haircut suggestions based on their facial structure and preferences
- Implement a fidelity program for clients to get free haircuts
- Send reminders for appointments through WhatsApp and/or email

The experience should be consistent across web and mobile — clients, receptionists, and managers/assistants each get a view suited to their role, regardless of which platform they're on.

## 2. User Roles

- **Clients**: book appointments, receive haircut recommendations, track and redeem loyalty rewards, receive reminders.
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
- If an appointment that includes a loyalty reward redemption is cancelled, by the client or by staff, the client keeps the reward and can use it on another appointment.
- The reward is lost only when the appointment is marked as a no-show (see §3.3).

**Notifications**
- Confirmations, reminders, and notifications for appointment operations (booking, editing, cancelling) are pending implementation — see §3.4.

### 3.2 Haircut Recommendations

Clients submit a photo and/or facial-structure attributes, stated preferences, and possibly hair type/texture, and receive suggested haircuts (with an explanation or confidence level). This is an assistive feature — it informs the client's choice but doesn't restrict what they can book.

### 3.3 Loyalty / Fidelity Program

Clients accumulate credit toward free haircuts: every 6 paid services earns a 7th one free. Each client has a running count of paid services since their last free redemption; it resets to 0 once the free service is completed. Rewards are global — earned and redeemable at any shop, not tied to a specific barber. Only registered clients participate: appointments for unregistered clients never count toward a reward. If a client doesn't show up to an appointment that included a free service earned through this program, and it is marked as a no-show, they lose that free service and their count restarts from 0. Cancelling such an appointment, whether by the client or by staff, does not forfeit the reward: the client keeps it and can redeem it on another appointment.

### 3.4 Appointment Reminders

Clients are reminded ahead of their appointment via WhatsApp and/or email, to reduce no-shows and missed visits. Reminders apply to registered clients only; appointments for unregistered clients have no contact info and are skipped. Reminders, confirmations, and notifications for all appointment operations are pending implementation.

### 3.5 Reporting (for Managers)

Managers need visibility into business performance — for example revenue, most-booked services, barber utilization, client retention/churn, and loyalty redemption rates. The exact set of reports needed is still to be defined.

### 3.6 Shop Supplies (Internal)

Each shop maintains its own inventory of the supplies used to deliver services (scissors, shampoo, conditioner, etc.) — these are never sold to clients and aren't part of any customer-facing catalog. Managers/assistants track stock levels per shop. Unlike the services menu, which is shared and identical across all shops, supplies inventory is independent per location. Each supply can have a reorder threshold; once stock drops to or below that threshold it's automatically flagged for reorder, and the flag clears automatically once it's restocked above the threshold.

Every stock entry (e.g. a purchase) and exit (e.g. usage, damaged items) is also recorded as a movement in a permanent history log, with the quantity, an optional unit cost and reason, and who performed it. Every movement is made by a staff user — the system never records movements on its own. The log keeps the person's name and role as they were at the time of the movement, so it's still clear who did what after that person's account has been deleted (with the limitation that former employees with the same name can't be told apart).

## 4. Example User Journeys

- **Booking an appointment**: a client picks a barber, service, and time slot within that barber's availability, confirms the booking, and is meant to receive a confirmation plus scheduled reminders ahead of the visit (pending implementation, see §3.4).
- **Getting a haircut recommendation**: a client submits a photo and/or preferences and receives suggested haircut styles to consider before or while booking.
- **Receiving a reminder**: a client is reminded ahead of their appointment through their preferred channel(s).
- **Redeeming a loyalty reward**: a client (or a receptionist/manager on their behalf) redeems accumulated loyalty credit against an appointment, which is then marked as reward-redeemed for reporting purposes.

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
- The rule is visit-based: every 6 paid services earns a free 7th, tracked as a running count that resets on redemption (decided). Does it vary by service type or price, or is every service worth the same toward the count?
- Do rewards expire? Rewards are global — usable at any shop (decided), not tied to a specific barber.
- Can rewards be combined with other promotions?

**Appointments & scheduling**
- Shifts are defined by managers: each lasts exactly 4, 6 or 8 hours, overlaps are allowed, exact duplicate time ranges are not; receptionists can view them. A shift can't be deleted if it's the only one or has staff assigned. Barbers work one shift Monday through Saturday; shift assignment is set only by managers (decided).
- Shop hours are effectively 8:00–20:00, Monday through Saturday (closed Sunday), based on the seeded shift windows (decided) — still need to confirm whether every shop staffs both shifts, and how shop hours follow once managers add other shifts.
- One appointment at a time per barber, no multiple chairs (decided).
- Cancellations and reschedules are decided (see §3.1): clients have an 8-hour cutoff, there is no cancellation/reschedule limit, a cancelled reward appointment keeps the reward, and a no-show on a free-service appointment forfeits it (§3.3). Waitlists, and any penalties for no-shows beyond that, are still undefined.

**Notifications**
- Can clients choose/opt out of channel (WhatsApp vs. email vs. both)? Required for consent/compliance either way.
- Reminder timing — e.g., 24h and 2h before, configurable per shop?
- Who owns the WhatsApp Business account/verification — has that process been started, since approval can take time?

**Reporting**
- What reports does the manager actually need — revenue, most-booked services, barber utilization, client retention/churn, loyalty redemption rates?

**Payments**
- Payment is always done in person at the barbershop; the system does not handle payments or deposits (decided).

For the technical implications of these decisions (schema design, infrastructure sizing, integration choices), see [`architecture.md`](./architecture.md).
