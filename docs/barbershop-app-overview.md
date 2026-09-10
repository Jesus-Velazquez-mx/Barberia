# Barbershop App — Business Overview

## 1. Product Overview

This project consists of building an app for a barber shop, available on web and mobile (Android). Its main focus is managing appointments. Other core functionalities are:

- Give clients haircut suggestions based on their facial structure and preferences
- Implement a fidelity program for clients to get free haircuts
- Send reminders for appointments through WhatsApp and/or email

The experience should be consistent across web and mobile — clients, barbers, and managers/assistants each get a view suited to their role, regardless of which platform they're on.

## 2. User Roles

- **Clients**: book appointments, receive haircut recommendations, track and redeem loyalty rewards, receive reminders.
- **Barbers**: manage their own schedule and appointments; may want a lightweight view while on the go.
- **Receptionists**: manage day-to-day appointments at their shop — booking, check-in, walk-ins, cancellations/reschedules — as a dedicated role distinct from managers/assistants.
- **Managers / Assistants**: manage the shared services catalog, oversee each shop's supplies inventory, staffing and availability, and review reporting/analytics. Each shop has exactly one manager, but a manager can oversee multiple shops.

## 3. Core Features

### 3.1 Appointment Booking & Scheduling

Clients book appointments against a barber's availability. Barbers manage their calendar and see upcoming bookings — one appointment at a time per barber (no multiple chairs). Every barber is assigned to one of two fixed shifts — morning (8:00–16:00) or afternoon (12:00–20:00) — and works Monday through Saturday; only a manager can set or change a barber's shift assignment. Scheduling policy (cancellations, no-shows, reschedules, waitlists) still needs to be defined — see open questions.

### 3.2 Haircut Recommendations

Clients submit a photo and/or facial-structure attributes, stated preferences, and possibly hair type/texture, and receive suggested haircuts (with an explanation or confidence level). This is an assistive feature — it informs the client's choice but doesn't restrict what they can book.

### 3.3 Loyalty / Fidelity Program

Clients accumulate credit toward free haircuts: every 6 paid services earns a 7th one free. Each client has a running count of paid services since their last free redemption; it resets to 0 once the free service is completed. Rewards are global — earned and redeemable at any shop, not tied to a specific barber.

### 3.4 Appointment Reminders

Clients are reminded ahead of their appointment via WhatsApp and/or email, to reduce no-shows and missed visits.

### 3.5 Reporting (for Managers)

Managers need visibility into business performance — for example revenue, most-booked services, barber utilization, client retention/churn, and loyalty redemption rates. The exact set of reports needed is still to be defined.

### 3.6 Shop Supplies (Internal)

Each shop maintains its own inventory of the supplies used to deliver services (scissors, shampoo, conditioner, etc.) — these are never sold to clients and aren't part of any customer-facing catalog. Managers/assistants track stock levels per shop. Unlike the services menu, which is shared and identical across all shops, supplies inventory is independent per location. Each supply can have a reorder threshold; once stock drops to or below that threshold it's automatically flagged for reorder, and the flag clears automatically once it's restocked above the threshold.

## 4. Example User Journeys

- **Booking an appointment**: a client picks a barber, service, and time slot within that barber's availability, confirms the booking, and receives a confirmation plus scheduled reminders ahead of the visit.
- **Getting a haircut recommendation**: a client submits a photo and/or preferences and receives suggested haircut styles to consider before or while booking.
- **Receiving a reminder**: a client is reminded ahead of their appointment through their preferred channel(s).
- **Redeeming a loyalty reward**: a client (or a barber/manager on their behalf) redeems accumulated loyalty credit against an appointment, which is then marked as reward-redeemed for reporting purposes.

## 5. Open Business Questions

These decisions materially affect the product and need to be settled up front.

**Business scope**
- Is this for a single barbershop location, or should the platform support multiple locations/franchises from day one (multi-tenancy)?
- Are walk-ins supported, or is it appointment-only?

**Shops & staffing**
- Each shop has exactly one manager, assigned at shop creation, and a manager may oversee multiple shops (decided).
- A manager can't be deleted while still managing any shop — their shops must first be reassigned to another manager (decided).

**Fidelity/loyalty program**
- The rule is visit-based: every 6 paid services earns a free 7th, tracked as a running count that resets on redemption (decided). Does it vary by service type or price, or is every service worth the same toward the count?
- Do rewards expire? Rewards are global — usable at any shop (decided), not tied to a specific barber.
- Can rewards be combined with other promotions?

**Appointments & scheduling**
- Barbers work one of two fixed shifts — 8:00–16:00 or 12:00–20:00 — Monday through Saturday; shift assignment is set only by managers (decided).
- Shop hours are effectively 8:00–20:00, Monday through Saturday (closed Sunday), based on the two shift windows (decided) — still need to confirm whether every shop staffs both shifts.
- One appointment at a time per barber, no multiple chairs (decided).
- How are cancellations/no-shows/reschedules handled — cutoff windows, penalties, waitlists?

**Notifications**
- Can clients choose/opt out of channel (WhatsApp vs. email vs. both)? Required for consent/compliance either way.
- Reminder timing — e.g., 24h and 2h before, configurable per shop?
- Who owns the WhatsApp Business account/verification — has that process been started, since approval can take time?

**Reporting**
- What reports does the manager actually need — revenue, most-booked services, barber utilization, client retention/churn, loyalty redemption rates?

**Payments**
- Is payment/deposit handled in-app, or purely in-person at the shop?

For the technical implications of these decisions (schema design, infrastructure sizing, integration choices), see [`architecture.md`](./architecture.md).
