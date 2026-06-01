## Plan: Trip Cost Splitter Feature ✅ Implemented

Extend the existing expenses module with trip participant management, expense splitting metadata, and settlement calculation. Add a new frontend page for the full cost-splitting workflow. Participants are named people (no app account required) with stay dates, enabling fair expense splitting by equal shares or by stay-day proportions.

**Key Decisions**: Named participants (no user accounts), extend expenses module, reuse existing expense entities with new nullable columns, full stack (API + frontend). Existing `ExpenseCategory` enum is reused as-is.

**Status**: Fully shipped and deployed. See `docs/expenses-module.md` for authoritative documentation.

---

### Phase 1: Database Schema (Migration) ✅

**File**: `src/migrations/1780400000000-AddCostSplitterTables.ts`

- **New table `trip_participants`**: id (uuid PK), tripId (FK→trips, CASCADE), name (varchar 100), stayStart (date), stayEnd (date), createdAt, updatedAt
- **Alter `expenses`**: added nullable columns — `paidByParticipantId` (FK→trip_participants, SET NULL), `splitMode` (varchar 20), `expenseEndDate` (date)
- **New junction table `expense_included_participants`**: id (uuid PK), expenseId (FK→expenses, CASCADE), participantId (FK→trip_participants, CASCADE), unique on (expenseId, participantId)

---

### Phase 2: Entities & Module Registration ✅

1. `src/expenses/entities/trip-participant.entity.ts` — ManyToOne → Trip
2. `src/expenses/entities/expense-included-participant.entity.ts` — ManyToOne → Expense + TripParticipant
3. `src/expenses/entities/expense.entity.ts` — added `paidByParticipantId`, `splitMode`, `expenseEndDate` + relations
4. `src/trips/entities/trip.entity.ts` — added OneToMany → TripParticipant
5. `src/expenses/expenses.module.ts` — all new entities registered

---

### Phase 3: DTOs ✅

Created in `src/expenses/dto/`:

- `create-participant.dto.ts` — name, stayStart, stayEnd (stayEnd > stayStart validation)
- `update-participant.dto.ts` — PartialType of create
- `participant-response.dto.ts` — full fields including id
- `set-expense-split.dto.ts` — paidByParticipantId, splitMode (`equal` | `by_stay_days`), includedParticipantIds (uuid[])
- `settlement-response.dto.ts` — `ParticipantBalanceDto` (paid/share/net), `SettlementPaymentDto` (from/to/amount), `SettlementResponseDto`

Updated:

- `expense-response.dto.ts` — added `paidByParticipant`, `splitMode`, `expenseEndDate`, `includedParticipants: ParticipantResponseDto[]`

---

### Phase 4: Service Layer ✅

1. `src/expenses/services/participant.service.ts` — CRUD with trip ownership validation; cascade-aware delete (nullifies paidByParticipantId on related expenses)
2. `src/expenses/services/settlement.service.ts` — per-expense share computation (equal + stay-day overlap), per-participant aggregation, greedy settlement minimisation, fallback to equal split when overlap = 0
3. `src/expenses/expenses.service.ts` — added `setSplit()`; updated `findAll()` query to join `paidByParticipant` and `includedParticipants` relations; response mapper updated

> **Bug fixed**: `findAll` originally only joined `receipts`. Added `leftJoinAndSelect` for `paidByParticipant` and `includedParticipants/eip.participant` so split data is returned on list calls.

---

### Phase 5: Controller & API Endpoints ✅

All routes in `src/expenses/expenses.controller.ts`:

| Method | Route                                                 | Description             |
| ------ | ----------------------------------------------------- | ----------------------- |
| POST   | `/trips/:tripId/expenses/participants`                | Create participant      |
| GET    | `/trips/:tripId/expenses/participants`                | List participants       |
| GET    | `/trips/:tripId/expenses/participants/:participantId` | Get participant         |
| PATCH  | `/trips/:tripId/expenses/participants/:participantId` | Update participant      |
| DELETE | `/trips/:tripId/expenses/participants/:participantId` | Delete participant      |
| PUT    | `/trips/:tripId/expenses/:id/split`                   | Set/update split config |
| GET    | `/trips/:tripId/expenses/settlements`                 | Calculate settlements   |

> **Bug fixed**: Static routes (`participants`, `settlements`, `summary`, etc.) were originally declared after `@Get(':id')`, causing NestJS to match e.g. `GET /participants` as `/:id = "participants"` → `QueryFailedError: invalid input syntax for type uuid`. Fixed by moving all static GET routes before the `/:id` wildcard.

---

### Phase 6: Frontend ✅

**`web/cost-splitter.html`** — four sections:

1. **Trip Info** — trip name + base currency
2. **Participants & Stay Dates** — add form + table with remove action
   - ✅ **Enhancement**: Date pickers constrained to trip duration via `min`/`max` attributes + client-side guard
3. **Expenses with splits** — table with Set Split / ✏ Edit Split panel (payer chips, included-participant chips, split mode toggle)
4. **Summary & Settlements** — per-participant balance table + settlement payment instructions
   - ✅ **Enhancement**: Each balance row has **▶ Details** toggle showing per-expense breakdown (Date · Description · Total · Individual share · `(paid)` badge). Share calculation mirrors server logic client-side using the already-loaded `expenses` array.

> **Bug fixed**: `computeExpenseShares` was using `eip.participantId` but `includedParticipants` in the response are `ParticipantResponseDto` objects with an `id` field. Also `e.paidByParticipantId` → `e.paidByParticipant?.id`. Fixed both field references.

---

### Phase 7: Swagger & OpenAPI ✅

All new endpoints and DTOs annotated. Run `yarn swagger:generate` to regenerate `openapi.json`.

---

### Relevant Files

**Created**: `1780400000000-AddCostSplitterTables.ts`, `trip-participant.entity.ts`, `expense-included-participant.entity.ts`, `create-participant.dto.ts`, `update-participant.dto.ts`, `participant-response.dto.ts`, `set-expense-split.dto.ts`, `settlement-response.dto.ts`, `participant.service.ts`, `settlement.service.ts`, `cost-splitter.html`

**Modified**: `expense.entity.ts`, `trip.entity.ts`, `expenses.module.ts`, `expenses.controller.ts`, `expenses.service.ts`, `expense-response.dto.ts`, `trip-dashboard.html`

---

### Phase 1: Database Schema (Migration)

**New file**: `src/migrations/<timestamp>-AddCostSplitterTables.ts`

- **New table `trip_participants`**: id (uuid PK), tripId (FK→trips, CASCADE), name (varchar 100), stayStart (date), stayEnd (date), createdAt, updatedAt
- **Alter `expenses`**: add nullable columns — `paidByParticipantId` (FK→trip_participants, SET NULL), `splitMode` (varchar 20), `expenseEndDate` (date)
- **New junction table `expense_included_participants`**: id (uuid PK), expenseId (FK→expenses, CASCADE), participantId (FK→trip_participants, CASCADE), unique on (expenseId, participantId)

---

### Phase 2: Entities & Module Registration

1. Create `src/expenses/entities/trip-participant.entity.ts` — ManyToOne → Trip
2. Create `src/expenses/entities/expense-included-participant.entity.ts` — ManyToOne → Expense + TripParticipant
3. Update `src/expenses/entities/expense.entity.ts` — add `paidByParticipantId`, `splitMode`, `expenseEndDate` columns + ManyToOne and OneToMany relations
4. Update `src/trips/entities/trip.entity.ts` — add OneToMany → TripParticipant
5. Update `src/expenses/expenses.module.ts` — register new entities in `TypeOrmModule.forFeature()`

---

### Phase 3: DTOs

Create these new files in `src/expenses/dto/`:

- `create-participant.dto.ts` — name, stayStart, stayEnd (with stayEnd > stayStart validation)
- `update-participant.dto.ts` — PartialType of create
- `participant-response.dto.ts` — full fields
- `set-expense-split.dto.ts` — paidByParticipantId, splitMode ('equal' | 'by_stay_days'), includedParticipantIds (uuid[])
- `settlement-response.dto.ts` — `ParticipantBalanceDto` (paid/share/net), `SettlementPaymentDto` (from/to/amount), `SettlementResponseDto`

Update existing DTOs:

- `create-expense.dto.ts` — add optional paidByParticipantId, splitMode, expenseEndDate
- `expense-response.dto.ts` — add paidByParticipant, splitMode, expenseEndDate, includedParticipants

---

### Phase 4: Service Layer

1. **New** `src/expenses/services/participant.service.ts` — CRUD for trip participants with trip ownership validation; cascade-aware delete (clears paidByParticipantId on related expenses) _(parallel with step 2)_
2. **New** `src/expenses/services/settlement.service.ts` — core calculation logic:
   - Per-expense share computation (equal split vs. stay-day proportional split with overlap-night calculation)
   - Per-participant aggregation (paid, share, net)
   - Greedy settlement minimization (creditor/debtor matching per doc §5.2)
   - Fallback to equal split when total overlap nights = 0
3. **Update** `src/expenses/expenses.service.ts` — add `setSplit()` method; validate participant exists when split fields provided; update response mapper to include split data _(depends on steps 1-2)_
4. **Register** new services in `expenses.module.ts`

---

### Phase 5: Controller & API Endpoints

Update `src/expenses/expenses.controller.ts` with new routes:

| Method | Route                                                 | Description             |
| ------ | ----------------------------------------------------- | ----------------------- |
| POST   | `/trips/:tripId/expenses/participants`                | Create participant      |
| GET    | `/trips/:tripId/expenses/participants`                | List participants       |
| GET    | `/trips/:tripId/expenses/participants/:participantId` | Get participant         |
| PATCH  | `/trips/:tripId/expenses/participants/:participantId` | Update participant      |
| DELETE | `/trips/:tripId/expenses/participants/:participantId` | Delete participant      |
| PUT    | `/trips/:tripId/expenses/:id/split`                   | Set/update split config |
| GET    | `/trips/:tripId/expenses/settlements`                 | Calculate settlements   |

All with `JwtAuthGuard`, `@CurrentUser()`, full Swagger annotations.

---

### Phase 6: Frontend

**New** `web/cost-splitter.html` — single page with four sections:

1. **Trip Info** — trip name + base currency (read-only from API)
2. **Participants** — add form + table (name, stay dates, remove action)
3. **Expenses with splits** — table showing split-configured expenses (date, description, baseAmount, paidBy, split mode); "Set Split" button opens a panel with payer chip selection, included-participant pills, split mode toggle
4. **Summary & Settlements** — per-participant balance table (paid, share, net) + settlement instructions ("A pays B $X")

Add API helpers in `web/js/api.js` or a dedicated JS file. Add navigation link from `web/trip-dashboard.html`.

---

### Phase 7: Swagger & OpenAPI

Annotate all new endpoints/DTOs per project conventions. Run `yarn swagger:generate` to update `openapi.json`.

---

### Relevant Files

**Create**: migration, 2 entities, 5 DTOs, 2 services, 1 HTML page (11 files)
**Modify**: `expense.entity.ts`, `trip.entity.ts`, `expenses.module.ts`, `expenses.controller.ts`, `expenses.service.ts`, `create-expense.dto.ts`, `expense-response.dto.ts`, `trip-dashboard.html`, `api.js` (9 files)

**Reference patterns**: `currency-converter.service.ts` (sub-service pattern), `expenses.html` (frontend pattern)

---

### Verification

1. Run migration — verify tables created, columns added to expenses
2. **Unit test** `settlement.service.spec.ts`: equal split (3 people), by-stay-days split (different periods), settlement minimization, 0-overlap fallback
3. **Unit test** `participant.service.spec.ts`: CRUD + cascade delete
4. **Integration test**: create trip → add participants → create expense → set split → get settlements
5. Run `yarn swagger:generate` — verify new endpoints in openapi.json
6. **Manual**: open cost-splitter page, test 3 participants with mixed split modes

---

### Scope

**Included**: Participant CRUD, expense split config, settlement calculation, frontend page, migration, Swagger docs

**Excluded**: Multi-trip splitting, real-time collaboration, participant auth, email notifications, PDF/CSV settlement export
