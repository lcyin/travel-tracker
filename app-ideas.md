You can design this as a “trip agent” app built around a timeline: it guides you from planning (T-60 days, T-30…) through each day of the trip, with tasks, bookings, and smart reminders tied to time and location.

Product vision
Goal: One place where you define a trip and the app:

Suggests everything you need to do (flights, insurance, visa, packing, SIM, money, etc.).

Helps you design daily itineraries.

Tracks your real-time status during the trip and tells you what’s next.

Think “TripIt (itinerary) + packing/checklist app + reminders + light navigation” in one opinionated flow.

Core user flows
1. Create a new trip
Input:

Destination(s), dates, trip type (business, leisure, road trip, etc.).

Travelers (solo, couple, family/friends).

From this, auto-generate:

A pre-trip checklist (flights, insurance, visa, accommodation, packing). Templates like Asana’s travel planner and airline checklists emphasize these as top tasks.

A skeleton day-by-day itinerary (Day 1–N) ready for the user to fill attractions/activities.
​

2. Pre-trip checklist “agent”
Categories (you can use templates and let user customize):

Travel logistics:

Book flights

Book accommodation

Book local transport (JR Pass, rental car, airport transfer, train passes, etc.).

Apply for visa / e-visa (if needed).

Buy travel insurance.

Money & documents:

Exchange cash / prepare credit cards.

Upload passport photo, e-visa PDFs, boarding passes to the trip (TripIt lets users attach PDFs/QR codes to itineraries, demonstrating the UX pattern).
​

Communication:

Buy eSIM / SIM / portable Wi‑Fi.

Save emergency contacts and hotel addresses in local language.

Packing:

Auto-generate packing checklist based on destination, dates, activities, and expected weather (like PackPoint and similar apps).

User can tick off items as they pack.

Logic:

Each task has:

Due date (absolute or relative: “T-30 days”, “T-7 days”).

Priority.

Optional dependencies (e.g., “Buy insurance” after “Confirm flights”).

3. Itinerary builder
For each day:

Add “blocks” such as:

Sightseeing spots (POIs).

Meals (breakfast / lunch / dinner places).

Transfers (train, bus, taxi, walking).

Free time.

Each block has:

Place (name + address + link + coordinates).

Planned start and end time.

Notes (e.g., tickets needed, opening hours).

You can draw inspiration from itinerary apps like Wanderlog and TripIt that combine itinerary + maps in one view.

4. On-trip assistant
Once the trip starts, the app switches to “Today” mode:

Timeline of today’s plan:

Current activity

Next activity

Travel time between them

Real-time reminders:

Time-based: “Leave hotel at 09:15 to reach Tokyo Skytree by 10:00.”

Location-based: “You’re near the ramen place you saved yesterday.” Many reminder apps already use location-triggered alerts for stops and places.

Tasks during trip:

Check off “Arrived at spot”, “Finished lunch”, etc.

If running late, suggest adjusting the rest of the day (skip a spot, shorten stay, move dinner later).

MVP feature set
Must-have (v1)
Trip creation:

Basic metadata for the trip.

Pre-trip checklist:

Template-based tasks (flights, insurance, visa, accommodation, packing).

Custom tasks.

Due dates + notifications.

Itinerary:

Day-by-day list, manual add of activities and locations.

Reminders:

Time-based notifications (before due dates; before each activity).

Attachments:

Upload or link PDFs/images (tickets, confirmations).
​

Nice-to-have (v2+)
Smart packing suggestions based on weather and activities.

Integration with email to auto-import bookings like TripIt.

Map view of the whole trip (all POIs laid out on a map).

Location-based alerts for saved spots.

Budget tracking per trip.

Sharing itineraries with travel companions.

Feature table
Area	Feature	Purpose
Trip setup	Create trip + dates	Anchor all checklists & timelines
Checklist	Templates for flights/insurance	Ensure essentials aren’t forgotten
Packing	Auto packing list by destination	Reduce manual thinking before travel
Itinerary	Day timeline with activities	Clear plan per day
Reminders	Time-based notifications	Nudge user at right moments
On-trip view	“Today” schedule + next step	Keep user on-track during travel
Attachments	Store tickets/docs in app	One place for all travel documents
Data model sketch
Highly simplified, but enough to start building:

User

id, name, email, locale, timezone

Trip

id, user_id, name, destination_city, country, start_date, end_date, trip_type

TripTask (pre-trip checklist)

id, trip_id, title, category (logistics/docs/money/packing/other)

due_date (or offset_days from start_date)

status (pending, done, skipped)

dependency_task_id (optional)

ItineraryDay

id, trip_id, date, notes

ItineraryItem

id, itinerary_day_id

type (sightseeing, meal, transfer, other)

place_id (optional)

title, notes

start_time, end_time

order_index

Place

id, name, address, lat, lng, url, opening_hours (optional)

Reminder

id, related_to_type (TripTask / ItineraryItem)

related_to_id

trigger_type (time, relative_time, location)

trigger_time, offset_minutes, geo_radius, geo_lat, geo_lng

status (scheduled, fired, cancelled)

This maps nicely to relational DB (PostgreSQL) and plays well with NestJS.

Reminder & automation logic
Some simple rules you can implement:

Pre-trip:

Generate default tasks on trip creation.

For each default task:

Set due date by offset: e.g. “Book flights” at T‑60 days, “Buy insurance” at T‑30, “Pack luggage” at T‑1.

Nightly job (or background worker) that:

Schedules push or local notifications for tasks due soon (e.g. at 10:00 and 20:00 in user’s timezone).

During trip:

“Today” screen:

Query all ItineraryItems where date = today, order by time.

Before each item:

Notification at start_time − travel_time_estimate (simplified as configurable minutes for v1).

Location-based (later):

If device enters geo-fence around Place, fire reminder for that item – similar to generic location-based reminder patterns people already use for transit stops and saved places.

Tech stack (aligned with your skills)
Given your background (NestJS, PostgreSQL, cloud):

Backend:

NestJS REST (or GraphQL) API.

PostgreSQL for relational data.

Background jobs via BullMQ / Redis or a managed queue for reminder scheduling.

Deployed on GCP (Cloud Run + Cloud SQL) or similar.

Client:

Mobile-first:

React Native or Flutter to get notifications and offline support.

Or PWA:

React/Vue SSG + service workers; browser notifications where supported.

Integrations (future):

Email parsing (TripIt-style) to auto-create bookings.

Calendar sync (export trip as calendar).

Third-party APIs for flights and POIs if you want auto-suggestions.

Example: “Tokyo 7-day trip” flow
Create trip:

Destination Tokyo, 7 days, leisure, 2 travelers.

App generates tasks:

Book flights (T‑60), Book hotel (T‑55), Buy insurance (T‑30), Buy eSIM (T‑7), Pack luggage (T‑1), etc.

You build itinerary:

Day 1: Arrival + check-in.

Day 2: Senso‑ji → Tokyo Skytree → Skytree dinner.

Each item has expected start/end time and location.

The app:

Reminds you 30 days before start to buy insurance.

One day before, reminds you to pack priority items from your packing list.

On Day 2, at 09:15, tells you to leave hotel to reach Senso‑ji by 10:00.

When you mark “Arrived at Senso‑ji”, it shows “Next: Go to Tokyo Skytree at 13:00”.

