# Barbershop App — Business Overview

## 1. Product Overview

This project consists of building an app for a barber shop, available on web and mobile (both Android and iOS). Its main focus is managing appointments. Other core functionalities are:

- Give clients haircut suggestions based on their facial structure and preferences
- Implement a fidelity program for clients to get free haircuts
- Send reminders for appointments through WhatsApp and/or email

The experience should be consistent across web and mobile — clients, barbers, and managers/assistants each get a view suited to their role, regardless of which platform they're on.

## 2. User Roles

- **Clients**: book appointments, receive haircut recommendations, track and redeem loyalty rewards, receive reminders.
- **Barbers**: manage their own schedule and appointments; may want a lightweight view while on the go.
- **Managers / Assistants**: manage the services/products catalog, oversee staffing and availability, and review reporting/analytics.

## 3. Core Features

### 3.1 Appointment Booking & Scheduling

Clients book appointments against a barber's availability. Barbers manage their calendar and see upcoming bookings. Scheduling policy (cancellations, no-shows, reschedules, waitlists) still needs to be defined — see open questions.

### 3.2 Haircut Recommendations

Clients submit a photo and/or facial-structure attributes, stated preferences, and possibly hair type/texture, and receive suggested haircuts (with an explanation or confidence level). This is an assistive feature — it informs the client's choice but doesn't restrict what they can book.

### 3.3 Loyalty / Fidelity Program

Clients accumulate credit toward free haircuts. The exact earning/redemption rule (visit-based, points-based, tiered) hasn't been decided yet — see open questions.

### 3.4 Appointment Reminders

Clients are reminded ahead of their appointment via WhatsApp and/or email, to reduce no-shows and missed visits.

### 3.5 Reporting (for Managers)

Managers need visibility into business performance — for example revenue, most-booked services, barber utilization, client retention/churn, and loyalty redemption rates. The exact set of reports needed is still to be defined.

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

**Fidelity/loyalty program**
- What's the actual rule — e.g., "1 free haircut after N paid visits," a points system, or tiered rewards? Does it vary by service type or price?
- Do rewards expire? Are they shop-wide or tied to a specific barber?
- Can rewards be combined with other promotions?

**Appointments & scheduling**
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
