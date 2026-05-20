# Travel Tracker – Solo Traveler Pricing & Feature Plan

This document defines pricing tiers and feature gates for solo travelers, mapped to your current backend capabilities. Use it as a checklist to implement and wire up features step by step.[file:2][file:3][file:4]

---

## Tiers Overview

- **Free – Trip Planner**  
  Price: HKD 0  
  Target: Casual travelers (1–2 trips per year) who mainly want planning and organization.

- **Travel Tracker Plus – Monthly**  
  Price: HKD 58 / month (start here; you can test HKD 48–68)  
  Target: Travelers who care about tracking and controlling trip spending.

- **Travel Tracker Plus – Yearly**  
  Price: HKD 428 / year (≈ 26% cheaper than 12× monthly)  
  Target: Frequent travelers who want a yearly pass.

---

## Feature Matrix by Tier

### Free – Trip Planner

**Scope:** Core planning and light expense logging. No OCR, no budgets, no CSV.

#### Trips & Dashboard

- Up to **3 active trips** per account (enforce in backend based on `TripsController.findAll` / grouped trips).[file:2]  
- My Trips screen with Upcoming / Past grouping using `TripsController.findGrouped`.[file:2][file:4]  
- Trip dashboard using `TripDashboardResponseDto`:
  - Trip summary (destination, dates, status).  
  - Pre‑trip task progress (`TaskProgressDto`).  
  - Next pending task (`NextPendingTaskDto`).  
  - Quick links (Checklist, Packing, Itinerary, Documents) via `QuickLinksDto`.[file:2]

#### Checklist

- On trip creation, auto‑generate default checklist items (Book flights, Book accommodation, Buy travel insurance, Check visa, Arrange transport, Buy eSIM, Exchange currency, Prepare travel documents).[file:4]  
- Checklist CRUD via `ChecklistController`:
  - List grouped by overdue/pending/done (`ChecklistGroupedResponseDto`).[file:2]  
  - Add custom tasks (`CreateTripTaskDto`).[file:2][file:4]  
  - Update status and fields (`UpdateTripTaskDto`).[file:2]  
  - Delete tasks.[file:2]  
- Overdue highlighting and filters (All / Pending / Completed / Overdue) per backlog story CHK‑3.[file:4]

#### Packing

- Packing CRUD via `PackingController`:
  - List packing items per trip, with filters by category and isPacked.[file:2]  
  - Create items (`CreatePackingItemDto`).[file:2]  
  - Update (name, quantity, isPacked, category).  
  - Delete packing items.[file:2]
- Packing suggestions:
  - Call `tripstripId/packing/suggestions` to get AI‑based suggestions by trip type, climate, duration (`PackingSuggestionsResponseDto`).[file:2][file:4]  
  - Accept suggestions via `acceptSuggestions` endpoint.[file:2]
- Packing progress bar using `PackingProgressResponseDto` (packed/total/percentage).[file:2]

#### Itinerary & Notifications

- Day‑by‑day itinerary builder:
  - `ItineraryController.getItinerary` to get days auto‑generated from trip date range (`ItineraryDayResponseDto`).[file:2][file:4]  
  - CRUD itinerary items via `createItem`, `updateItem`, `deleteItem` (`ItineraryItemResponseDto`).[file:2][file:4]
- Item fields: type (sightseeing/meal/transfer/other), title, notes, startTime, endTime, orderIndex, status.[file:2][file:4]
- Today view (frontend feature on top of itinerary) with current/next activity and ability to mark items done/skipped per NOTIF/ITIN stories.[file:4]
- Pre‑trip task and activity reminders handled by notification stories (NOTIF‑2, NOTIF‑3) once your backend queue is ready.[file:4]

#### Documents

- Attach documents to a trip per DOC‑1:
  - Upload PDF/image files with label, list under each trip with name/type/upload date, open in viewer, delete.[file:4]
- For Free tier, cap max documents per trip (e.g. 10) at the UI + backend validation level.

#### Expenses (Basic)

- Manual expense entry only:
  - Use `ExpensesController.create` with `CreateExpenseDto` (occurredAt, merchantName, amount, currency, category, paymentMethod, notes).[file:2][file:3]  
- Limits:
  - Up to **30 expenses per trip** (check count via `ExpensesController.findAll` before insert).[file:2][file:3]
- Display:
  - Expense list per trip, filters by category/paymentMethod/date (`findAll` query params).[file:2][file:3]  
  - Simple computed total per trip from `ExpenseSummaryResponseDto.totalSpent`.[file:2][file:3]
- Disabled for Free:
  - Hide or block calls to OCR endpoints (`extract-receipt`, `create-from-receipt`).[file:2][file:3]  
  - Hide budgets and dashboard endpoints from UI (`budget*`, `dashboard`, `exportcsv`).[file:2][file:3]

#### Monetization Hooks

- Attach affiliate links to default checklist tasks (Book flights, accommodation, insurance, eSIM, currency exchange) without changing the backend.[file:4]

---

### Plus – Monthly

**Scope:** Everything in Free, plus full expense engine (OCR, multi‑currency, budgets, analytics, CSV) with a moderate OCR quota.

#### Trips & Storage

- Remove active trip limit (unlimited trips per user).  
- Raise per‑trip document limit (e.g. 100 instead of 10).

#### Smart Expenses with OCR

- Enable receipt‑to‑expense creation:
  - `POST tripstripId/expenses/create-from-receipt` (multipart receipt image) to auto‑create an expense.[file:2][file:3]  
  - Backend flow:
    - Verify trip ownership.  
    - `OcrExtractionService.extractFromImage` → Gemini 2.5 Flash with structured prompt.[file:3]  
    - Map `ExtractedReceipt` → `CreateExpenseDto` (totalAmount → amount, currency, merchantName, date → occurredAt, paymentMethod mapping, category=Other, source=Ocr).[file:3]  
    - Set `extractionStatus` to Success or NeedsReview based on confidence.[file:3]  
    - Create Receipt record with fileUrl, rawOcrJson, confidenceScore.[file:3]
- Enable receipt upload for existing expenses:
  - `POST tripstripId/expenses/expenseId/receipts` to attach an image and run background OCR, updating `extractionStatus` on success/failure.[file:2][file:3]
- Enforce Plus‑only OCR quota:
  - Track number of OCR calls per user per month (app‑specific table).  
  - Allow **100 OCR calls/month** for monthly Plus.

#### Multi‑Currency Conversion

- Ensure `CurrencyConverterService.convert` is used whenever expense.currency ≠ trip.baseCurrency:
  - Check 60‑minute cache for rate.  
  - Fetch from external exchange API on cache miss.  
  - Fallback to rate 1.0 on failure, mark source accordingly.[file:3]
- Store `baseAmount`, `baseCurrency`, `exchangeRate`, `exchangeRateSource`, `exchangeRateAt` for each expense.[file:3]

#### Duplicate Detection

- Call `POST tripstripId/expenses/check-duplicate` before creating an expense (manual or OCR):
  - If `isDuplicate=true`, show candidate to user and allow skip or continue.[file:3]

#### Budgets & Analytics

- Budgets:
  - Enable `GET/POST/PUT/DELETE tripstripId/expenses/budget` to manage per‑trip budget.[file:2][file:3]  
  - Use `BudgetResponseDto` fields: baseCurrency, totalAmount, categoryLimits, warningThreshold, spent, remaining, percentageUsed.[file:2][file:3]
- Expense Dashboard:
  - Use `GET tripstripId/expenses/dashboard` to fetch combined summary + budget in one call (`ExpenseDashboardResponseDto`).[file:2][file:3]  
  - UI should render:
    - Total spent, base currency, transaction count, average per day.[file:2][file:3]  
    - Category breakdown: `ExpenseCategoryBreakdownDto` (category, amount, percentage, count).[file:2][file:3]  
    - Top merchants: `ExpenseMerchantBreakdownDto` (merchantName, amount, count).[file:2][file:3]  
    - Daily spend trend: `DailyTrendDto` (date, amount).  
    - Needs‑review count for OCR expenses (from summary).[file:3]  
    - Budget cards showing spent/remaining/% used, and warning when threshold exceeded.[file:2][file:3]

#### Exports

- Enable `GET tripstripId/expenses/exportcsv`:
  - UI button “Export as CSV” visible only to Plus users.[file:2][file:3]  
  - Allow filters (date range, category) mapped to query params.

#### Gating Logic

- When a Free user tries to:
  - Tap “Scan receipt” → show Plus paywall.  
  - Open “Budget & Insights” → show Plus paywall with blurred dashboard preview.  
  - Tap “Export CSV” → show Plus paywall.

---

### Plus – Yearly

**Scope:** Same as Plus Monthly, but with better limits and positioning for frequent travelers.

#### Features

- All Plus Monthly capabilities (OCR, budgets, analytics, CSV, unlimited trips).[file:2][file:3][file:4]  
- Higher OCR quota:
  - **300–500 OCR calls per month** (decide exact number based on Gemini cost).  
- Priority support:
  - Tag support requests from Yearly users and answer first (managed outside backend spec).
- Early access features:
  - Feature flags in the app to enable beta modules (e.g. shared trips, offline mode) first for Yearly users.

---

## Implementation Roadmap (Step by Step)

Use this sequence to build and ship incrementally.

### Phase 1 – Solid Free Tier

1. Implement trip CRUD + grouped view + dashboard (`TripsController`, `TripDashboardResponseDto`).[file:2][file:4]  
2. Implement checklist module with default tasks, overdue highlighting, and filters.[file:2][file:4]  
3. Implement packing list CRUD, suggestions, and progress.[file:2][file:4]  
4. Implement itinerary days/items + Today view + basic reminders.[file:2][file:4]  
5. Implement document uploads per trip with basic limits.[file:4]  
6. Implement manual expenses (CRUD + simple total). Limit to 30 expenses per trip; keep OCR/budget/dashboard/CSV hidden.[file:2][file:3]

### Phase 2 – Plus Monthly

1. Add subscription flag to users (e.g. plan: free/plus_monthly/plus_yearly) and entitlements in backend.  
2. Implement OCR‑based `create-from-receipt` and `uploadReceipt` flows end to end.[file:2][file:3]  
3. Implement currency conversion and store base amounts.[file:3]  
4. Implement duplicate detection call and UI.[file:3]  
5. Implement budgets and dashboard screens backed by `getBudget` and `getDashboard`.[file:2][file:3]  
6. Implement CSV export UI and backend gating.[file:2][file:3]  
7. Enforce OCR monthly quota for Plus users.

### Phase 3 – Plus Yearly & Refinement

1. Add yearly plan type with different OCR quota and pricing.  
2. Add priority support routing and early‑access flags.  
3. Tune limits (trips, OCR, documents) based on real usage and costs.  
4. Iterate on paywall copy and conversion tracking.

This file should give you a clear, step‑by‑step roadmap from Free planning app to a revenue‑generating solo traveler product built on your existing Travel Tracker API.
