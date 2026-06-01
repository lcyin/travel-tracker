# Expenses Module — Logic Flow & Functional Requirements

## Overview

The Expenses module tracks trip spending with receipt OCR scanning, automatic currency conversion, budget management, and an analytics dashboard. All endpoints are scoped under `trips/:tripId/expenses` and require JWT authentication.

---

## Data Model

### Expense

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `tripId` | UUID (FK → Trip) | Owning trip |
| `userId` | UUID (FK → User) | Who created it |
| `occurredAt` | timestamp | When the purchase happened |
| `merchantName` | varchar (nullable) | Store / vendor name |
| `amount` | numeric(10,2) | Original transaction amount |
| `currency` | varchar(3) | ISO 4217 code (JPY, USD, etc.) |
| `baseAmount` | numeric(10,2) (nullable) | Converted to trip base currency |
| `baseCurrency` | varchar(3) (nullable) | Trip's base currency |
| `exchangeRate` | numeric(10,6) (nullable) | Rate used for conversion |
| `exchangeRateSource` | varchar (nullable) | API source or `fallback_rate_1` |
| `exchangeRateAt` | timestamp (nullable) | When the rate was fetched |
| `category` | enum | `food`, `transport`, `accommodation`, `shopping`, `tickets_activities`, `cash`, `other` |
| `paymentMethod` | enum | `credit_card`, `debit_card`, `cash`, `bank_transfer`, `other` |
| `notes` | text (nullable) | Free-text notes |
| `source` | enum | `manual`, `ocr`, `quick_add`, `draft` |
| `extractionStatus` | enum | `none`, `pending`, `success`, `failed`, `needs_review` |
| `deletedAt` | timestamp (nullable) | Soft delete |

### Receipt

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `expenseId` | UUID (FK → Expense) | Parent expense (CASCADE delete) |
| `fileUrl` | varchar | Path to uploaded file |
| `thumbnailUrl` | varchar (nullable) | Thumbnail path (not yet generated) |
| `mimeType` | varchar | `image/jpeg`, `image/png`, `image/webp` |
| `fileSize` | int (nullable) | File size in bytes |
| `uploadedAt` | timestamp | When uploaded |
| `rawOcrJson` | JSONB (nullable) | Full Gemini OCR extraction result |
| `confidenceScore` | numeric(4,3) (nullable) | 1.0 (high), 0.5 (medium), 0.2 (low) |

### TripParticipant

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `tripId` | UUID (FK → Trip, CASCADE) | Owning trip |
| `name` | varchar(100) | Display name (no user account required) |
| `stayStart` | date | First day of this person's stay (ISO 8601) |
| `stayEnd` | date | Last day of this person's stay (ISO 8601) |
| `createdAt` | timestamp | — |
| `updatedAt` | timestamp | — |

### ExpenseIncludedParticipant

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `expenseId` | UUID (FK → Expense, CASCADE) | Parent expense |
| `participantId` | UUID (FK → TripParticipant, CASCADE) | Included person |

Unique constraint on `(expenseId, participantId)`.

**Added columns on `expenses`**:

| Column | Type | Description |
|--------|------|-------------|
| `paidByParticipantId` | UUID (FK → TripParticipant, SET NULL, nullable) | Who paid |
| `splitMode` | varchar(20) (nullable) | `equal` or `by_stay_days` |
| `expenseEndDate` | date (nullable) | End date for multi-day expenses (used in stay-day split) |

### Budget

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `tripId` | UUID (FK → Trip, UNIQUE) | One budget per trip |
| `baseCurrency` | varchar(3) | Budget currency |
| `totalAmount` | numeric | Total budget limit |
| `categoryLimits` | JSONB (nullable) | Per-category caps, e.g. `{ "food": 1000 }` |
| `warningThreshold` | int (default 80) | Alert at this % of budget |

---

## API Endpoints

### Expense CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/trips/:tripId/expenses` | List expenses with filters |
| `GET` | `/trips/:tripId/expenses/:id` | Get single expense |
| `POST` | `/trips/:tripId/expenses` | Create expense manually |
| `PUT` | `/trips/:tripId/expenses/:id` | Update an expense |
| `DELETE` | `/trips/:tripId/expenses/:id` | Soft-delete an expense |

**Filter parameters** (on `GET /expenses`): `category`, `paymentMethod`, `currency`, `dateFrom`, `dateTo`, `extractionStatus`

### Receipt & OCR

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/trips/:tripId/expenses/:expenseId/receipts` | Upload receipt image to existing expense |
| `DELETE` | `/trips/:tripId/expenses/receipts/:receiptId` | Delete a receipt |
| `POST` | `/trips/:tripId/expenses/extract-receipt` | OCR-only: extract data, return JSON |
| `POST` | `/trips/:tripId/expenses/create-from-receipt` | OCR + auto-create expense |

### Budget

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/trips/:tripId/expenses/budget/summary` | Get budget with live spent/remaining |
| `POST` | `/trips/:tripId/expenses/budget` | Create budget |
| `PUT` | `/trips/:tripId/expenses/budget` | Update budget |
| `DELETE` | `/trips/:tripId/expenses/budget` | Delete budget |

### Analytics & Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/trips/:tripId/expenses/summary` | Analytics: totals, by-category, by-merchant, daily trend |
| `GET` | `/trips/:tripId/expenses/dashboard` | Combined: summary + budget in one call |
| `GET` | `/trips/:tripId/expenses/export/csv` | Export all expenses as CSV file |
| `POST` | `/trips/:tripId/expenses/check-duplicate` | Heuristic duplicate detection |

### Cost Splitter

> **Route ordering note**: All static sub-paths (`participants`, `settlements`, `summary`, `export/csv`, etc.) are declared **before** the `/:id` wildcard in the controller to prevent NestJS routing conflicts.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/trips/:tripId/expenses/participants` | Add a named participant |
| `GET` | `/trips/:tripId/expenses/participants` | List all participants for the trip |
| `GET` | `/trips/:tripId/expenses/participants/:participantId` | Get a single participant |
| `PATCH` | `/trips/:tripId/expenses/participants/:participantId` | Update participant (name / stay dates) |
| `DELETE` | `/trips/:tripId/expenses/participants/:participantId` | Remove participant (clears split references) |
| `PUT` | `/trips/:tripId/expenses/:id/split` | Set or update split config for an expense |
| `GET` | `/trips/:tripId/expenses/settlements` | Calculate who owes whom |

---

## Core Logic Flows

### 1. Manual Expense Creation

```
POST /trips/:tripId/expenses  (CreateExpenseDto)
│
├── Verify trip ownership (tripId + userId)
├── Create expense record with provided fields
├── If trip.baseCurrency exists AND expense.currency ≠ baseCurrency:
│   └── Call CurrencyConverterService.convert()
│       ├── Check 60-min cache → hit? return cached rate
│       └── Miss? call ExchangeRate API → cache → convert
│       └── Failure? fallback to rate 1.0
├── Else if same currency: set baseAmount = amount, rate = 1.0
└── Save & return ExpenseResponseDto
```

### 2. Create Expense from Receipt (OCR Pipeline)

```
POST /trips/:tripId/expenses/create-from-receipt  (multipart: receipt image)
│
├── Verify trip ownership
├── Call OcrExtractionService.extractFromImage(buffer, mimeType)
│   ├── Send image to Gemini 2.5 Flash with structured prompt
│   ├── Retry up to 2× on 503/429 with exponential backoff (2s, 4s)
│   ├── On persistent failure → throw ServiceUnavailableException (503)
│   └── Parse JSON response → ExtractedReceipt
│
├── Validate: totalAmount AND currency must be non-null
│   └── If null → throw BadRequestException
│
├── Map OCR fields → expense:
│   ├── amount ← extracted.totalAmount
│   ├── currency ← extracted.currency
│   ├── merchantName ← extracted.merchantName
│   ├── occurredAt ← extracted.date (fallback: now)
│   ├── paymentMethod ← map string → PaymentMethod enum (fallback: Other)
│   ├── category ← ExpenseCategory.Other (not inferable)
│   ├── source ← ExpenseSource.Ocr
│   └── extractionStatus ← Success if high confidence, NeedsReview otherwise
│
├── Currency conversion (same as manual flow)
├── Save expense
├── Create Receipt record with rawOcrJson + confidenceScore
└── Return ExpenseResponseDto (with receipt attached)
```

### 3. Upload Receipt to Existing Expense

```
POST /trips/:tripId/expenses/:expenseId/receipts  (multipart: file)
│
├── Verify trip ownership + expense exists
├── Create Receipt record (fileUrl, mimeType, fileSize)
├── Set expense.extractionStatus = Pending
├── Fire-and-forget OCR:
│   ├── Success → save rawOcrJson + confidenceScore on receipt,
│   │            set expense.extractionStatus = Success
│   └── Failure → set expense.extractionStatus = Failed, log error
└── Return receipt metadata immediately (non-blocking)
```

### 4. Dashboard

```
GET /trips/:tripId/expenses/dashboard
│
├── Run in parallel:
│   ├── getSummary(tripId, userId, {})
│   │   ├── Fetch all expenses for trip
│   │   ├── Count expenses with extractionStatus = needs_review
│   │   ├── Compute: totalSpent, averagePerDay
│   │   ├── Build: byCategory[], byMerchant[] (top 10), dailyTrend[]
│   │   └── Return ExpenseSummaryResponseDto + needsReviewCount
│   │
│   └── Find budget for trip (nullable)
│       ├── If exists → compute spent (SUM baseAmount), remaining, percentageUsed
│       └── If not → return null
│
└── Return { summary, budget }
```

### 5. Currency Conversion

```
CurrencyConverterService.convert(amount, fromCurrency, toCurrency)
│
├── Same currency? → return amount with rate 1.0
├── Check in-memory cache (key: "USD_JPY", TTL: 60 min)
│   ├── Hit → use cached rate
│   └── Miss → GET https://api.exchangerate-api.com/v4/latest/{from}
│       ├── Success → cache rate, compute baseAmount
│       └── Failure → fallback to rate 1.0, source = "fallback_rate_1"
└── Return { baseAmount, exchangeRate, source, rateAt }
```

### 6. Cost Splitter — Participant Management

```
POST /trips/:tripId/expenses/participants  (CreateParticipantDto)
│
├── Verify trip ownership
├── Validate stayEnd > stayStart
└── Save TripParticipant → return ParticipantResponseDto

DELETE /trips/:tripId/expenses/participants/:participantId
│
├── Verify trip ownership
├── Nullify paidByParticipantId on all related expenses (cascade-safe)
├── Delete ExpenseIncludedParticipant junction rows
└── Delete TripParticipant
```

### 7. Cost Splitter — Set Expense Split

```
PUT /trips/:tripId/expenses/:id/split  (SetExpenseSplitDto)
│
├── Verify trip ownership + expense exists in trip
├── Verify paidByParticipantId references a participant in this trip
├── Delete existing ExpenseIncludedParticipant rows for this expense
├── Create new junction rows for each includedParticipantId
├── Set expense.paidByParticipantId, splitMode, expenseEndDate
└── Return updated ExpenseResponseDto (with paidByParticipant + includedParticipants)
```

### 8. Cost Splitter — Settlement Calculation

```
GET /trips/:tripId/expenses/settlements
│
├── Verify trip ownership
├── Load all TripParticipants for the trip
├── Load all expenses with splitMode + paidByParticipantId + includedParticipants
│   (only expenses where all three are set are included)
│
├── For each qualifying expense → computeShares():
│   ├── splitMode = 'equal':
│   │   └── share = baseAmount / includedParticipants.length  (per person)
│   └── splitMode = 'by_stay_days':
│       ├── Overlap nights = max(0, min(stayEnd, expEnd) − max(stayStart, expStart))
│       ├── Total nights = Σ overlap nights across included participants
│       ├── share_i = baseAmount × (nights_i / totalNights)
│       └── Fallback to equal split when totalNights = 0
│
├── Aggregate per participant: paid (Σ expenses they paid), share (Σ their shares)
├── Net = paid − share  (positive = owed money back, negative = owes others)
│
├── Minimize settlements (greedy creditor-debtor matching):
│   ├── Sort participants into creditors (net > 0) and debtors (net < 0)
│   └── Greedily match debtor → creditor until all nets reach ~0
│
└── Return SettlementResponseDto { balances[], payments[], currency }
```

**Settlement response shape**:
```json
{
  "currency": "USD",
  "balances": [
    { "participant": { "id": "...", "name": "Alice" }, "paid": 300, "share": 150, "net": 150 },
    { "participant": { "id": "...", "name": "Bob"   }, "paid": 0,   "share": 150, "net": -150 }
  ],
  "payments": [
    { "from": { "name": "Bob" }, "to": { "name": "Alice" }, "amount": 150 }
  ]
}
```

### 9. Duplicate Detection

```
POST /trips/:tripId/expenses/check-duplicate  (CreateExpenseDto)
│
├── Find existing expense where:
│   ├── Same tripId + merchantName + amount + currency
│   └── occurredAt within ±1 day of provided date
├── Found → { isDuplicate: true, candidateId: "..." }
└── Not found → { isDuplicate: false }
```

---

## OCR Extraction Details

**Provider**: Google Gemini 2.5 Flash

**Input**: Receipt image (JPEG, PNG, WebP) as base64

**Output** (`ExtractedReceipt`):

| Field | Type | Description |
|-------|------|-------------|
| `merchantName` | string \| null | Store/vendor name |
| `date` | string \| null | ISO date (YYYY-MM-DD) |
| `totalAmount` | number \| null | Final amount paid |
| `currency` | string \| null | ISO 4217 code |
| `taxAmount` | number \| null | Tax portion |
| `subtotal` | number \| null | Pre-tax amount |
| `paymentMethod` | string \| null | `cash`, `credit_card`, `debit_card`, `contactless` |
| `lineItems` | array | Individual purchased items |
| `confidence` | enum | `high` (all key fields found), `medium` (2 of 3), `low` (≤1) |
| `rawText` | string | OCR-extracted raw text |

**Confidence → Status mapping**:
- `high` → `ExtractionStatus.Success` — expense is ready
- `medium` / `low` → `ExtractionStatus.NeedsReview` — user should verify

**Retry policy**: 2 retries with exponential backoff (2s, 4s) for 503/429 errors. Non-retryable errors fail immediately. Final failure returns HTTP 503 to the client.

---

## Dashboard Response Shape

```json
{
  "summary": {
    "totalSpent": 3500,
    "baseCurrency": "USD",
    "transactionCount": 15,
    "averagePerDay": 350,
    "byCategory": [
      { "category": "food", "amount": 1200, "percentage": 34, "count": 8 }
    ],
    "byMerchant": [
      { "merchantName": "Starbucks", "amount": 45.50, "count": 3 }
    ],
    "dailyTrend": [
      { "date": "2026-04-02", "amount": 250.75 }
    ],
    "needsReviewCount": 2
  },
  "budget": {
    "id": "...",
    "tripId": "...",
    "baseCurrency": "USD",
    "totalAmount": 5000,
    "categoryLimits": { "food": 1000, "transport": 500 },
    "warningThreshold": 80,
    "spent": 3500,
    "remaining": 1500,
    "percentageUsed": 70
  }
}
```

---

## Security & Validation

- All endpoints require JWT auth (`@UseGuards(JwtAuthGuard)`)
- Trip ownership verified on every expense operation (`userId` from JWT `sub` claim)
- DTOs validated via `class-validator` + global `ValidationPipe` (whitelist, forbidNonWhitelisted)
- Currency codes validated with `@IsISO4217CurrencyCode()`
- File uploads handled via `multer` in-memory buffer (no disk persistence yet)
- Parameterized queries throughout (TypeORM query builder)
- Soft deletes on expenses (`deletedAt` column)

## Cost Splitter Frontend (`web/cost-splitter.html`)

Single-page UI with four sections:

1. **Participants & Stay Dates** — Add form (name, stay start, stay end) + table with remove action.
   - Date pickers are constrained to the trip's `startDate`/`endDate` via `min`/`max` attributes.
   - Client-side guard rejects dates outside the trip duration before the API call.

2. **Expenses** — Table of all trip expenses showing split-configured ones first. Each row has a **Set Split / ✏ Edit Split** button that opens a bottom-sheet panel with:
   - Payer chip selection
   - Included participants multi-select chips
   - Split mode toggle (`Equal` / `By stay days`)

3. **Summary & Settlements** — Loaded from `GET /settlements`.
   - **Balances table**: Person · Paid · Share · Net (color-coded positive/negative).
   - Each balance row has a **▶ Details** button that expands an inline sub-table showing every split expense this person is involved in, with: Date · Description · Total amount · Their individual share · `(paid)` badge if they were the payer.
   - Client-side share computation mirrors the server logic (equal or by-stay-days overlap nights) so the breakdown is available without an extra API call.
   - **Settlements list**: `💸 A pays B $X` cards, or "✓ Everyone is settled."

---

## Known Limitations

1. **File storage**: Receipt files generate a `fileUrl` path but are not persisted to disk or cloud storage
2. **No pagination**: `GET /expenses` returns all matching records without `limit/offset`
3. **Budget category limits**: Stored but not enforced — no validation during expense creation
4. **Line items**: Stored in `rawOcrJson` only — no queryable `LineItem` entity
5. **Receipt thumbnails**: `thumbnailUrl` field exists but is never generated
6. **Split currency**: Settlement totals use `trip.baseCurrency`; expenses not converted to base currency are excluded from settlement calculation
