# Plan: OCR-to-Expense Pipeline

## TL;DR

Connect the existing OCR extraction output (`ExtractedReceipt`) to the expense creation flow so that scanning a receipt auto-creates a draft expense, persists OCR data on the receipt record, and tracks extraction status — closing the gap between the `extract-receipt` endpoint and the existing CRUD.

## Current State

- `POST /trips/:tripId/expenses/extract-receipt` calls `OcrExtractionService.extractFromImage()` and returns raw JSON to the client. Nothing is persisted.
- `uploadReceipt()` fires OCR in the background but never saves results (`rawOcrJson`, `confidenceScore` on Receipt are never populated; `extractionStatus` on Expense stays `none`).
- Sample results (`result1.json`, `result2.json`) prove the Gemini extraction is working and returns high-confidence data.
- `ExpenseSource.Ocr` and `ExtractionStatus` enums exist but are unused.

## Steps

### Phase 1 — Persist OCR results on receipt upload (backend wiring)

1. **Update `uploadReceipt()` in `expenses.service.ts`** (lines ~207-247)
   - Set `expense.extractionStatus = ExtractionStatus.Pending` before firing OCR.
   - In the `.then()` callback: save `receipt.rawOcrJson = extracted`, `receipt.confidenceScore` (map `high→1.0`, `medium→0.5`, `low→0.2`), and update `expense.extractionStatus = ExtractionStatus.Success`.
   - In the `.catch()` callback: set `expense.extractionStatus = ExtractionStatus.Failed`, log the error.

2. **Add a new endpoint `POST /trips/:tripId/expenses/create-from-receipt`** in `expenses.controller.ts`
   - Accepts multipart `receipt` file (same as `extract-receipt`).
   - Calls a new service method `createFromReceipt(tripId, file, userId)`.
   - Returns `ExpenseResponseDto` (the newly created expense with attached receipt).

3. **Implement `createFromReceipt()` in `expenses.service.ts`**
   - Call `ocrService.extractFromImage(file.buffer, file.mimetype)`.
   - Map `ExtractedReceipt` → `CreateExpenseDto`:
     - `occurredAt` ← `extracted.date` (fallback to `new Date().toISOString()`)
     - `merchantName` ← `extracted.merchantName`
     - `amount` ← `extracted.totalAmount` (require non-null, else throw BadRequest)
     - `currency` ← `extracted.currency` (require non-null, else throw BadRequest)
     - `paymentMethod` ← map `extracted.paymentMethod` to `PaymentMethod` enum (fallback `Other`)
     - `category` ← `ExpenseCategory.Other` (cannot be inferred from receipt)
     - `source` ← `ExpenseSource.Ocr`
     - `notes` ← auto-generate from line items summary if available
   - Create expense via existing `create()` flow (gets currency conversion for free).
   - Set `expense.extractionStatus = ExtractionStatus.Success` (or `NeedsReview` if confidence is `low`).
   - Create receipt record with `fileUrl`, `rawOcrJson = extracted`, `confidenceScore`.
   - Return the full `ExpenseResponseDto`.

4. **Create a mapping helper** `mapOcrToExpenseDto()` — private method in `ExpensesService`
   - Maps `ExtractedReceipt.paymentMethod` string → `PaymentMethod` enum.
   - Validates required fields, throws `BadRequestException` if `totalAmount` or `currency` is null.

### Phase 2 — DTO & Swagger updates

5. **Create `CreateExpenseFromReceiptResponseDto`** or reuse `ExpenseResponseDto`
   - Include an `extractedData` field (the raw `ExtractedReceipt`) so the client can show a review UI.
   - Alternatively, return `{ expense: ExpenseResponseDto, extractedData: ExtractedReceipt }`.

6. **Add Swagger decorators** on the new endpoint
   - `@ApiOperation({ summary: 'Create expense from receipt image via OCR' })`
   - `@ApiConsumes('multipart/form-data')`, `@ApiBody` with file schema
   - `@ApiCreatedResponse({ type: ExpenseResponseDto })`

### Phase 3 — Confirm/review flow (optional but recommended)

7. **Add `PATCH /trips/:tripId/expenses/:id/confirm-ocr`** endpoint
   - Allows user to review and override OCR-extracted fields before finalizing.
   - Accepts `UpdateExpenseDto` + sets `extractionStatus = ExtractionStatus.Success`.
   - Initially OCR expenses could be created with `ExtractionStatus.NeedsReview` to force user review.

### Phase 4 — Cleanup

8. **Remove duplicate `ReceiptOcrService`** in `src/receipts/receipt-ocr.service.ts` — it's identical to `OcrExtractionService`.
9. **Use `ConfigService`** instead of `process.env.GEMINI_API_KEY` in `OcrExtractionService` (per project conventions).

## Relevant Files

| File | Change |
|------|--------|
| `src/expenses/expenses.service.ts` | Add `createFromReceipt()`, `mapOcrToExpenseDto()`, fix `uploadReceipt()` |
| `src/expenses/expenses.controller.ts` | Add `create-from-receipt` endpoint, Swagger decorators |
| `src/expenses/services/ocr-extraction.service.ts` | Inject `ConfigService` instead of `process.env` |
| `src/expenses/dto/create-expense.dto.ts` | Reference for field mapping |
| `src/expenses/enums/expense.enums.ts` | `ExtractionStatus`, `ExpenseSource` enum values |
| `src/expenses/entities/receipt.entity.ts` | `rawOcrJson`, `confidenceScore` fields to populate |
| `src/expenses/entities/expense.entity.ts` | `extractionStatus`, `source` fields to set |
| `src/receipts/receipt-ocr.service.ts` | Duplicate to remove |
| `src/expenses/services/ocr-result/result1.json` | Sample data for testing mapping logic |

## Verification

1. Upload a receipt image to `POST /trips/:tripId/expenses/create-from-receipt` → verify expense created with correct `amount`, `currency`, `merchantName`, `occurredAt`, `source=ocr`
2. Verify receipt record has `rawOcrJson` populated and `confidenceScore` set
3. Verify expense `extractionStatus` is `success` or `needs_review` based on confidence
4. Verify currency conversion runs when receipt currency ≠ trip baseCurrency
5. Verify `POST /trips/:tripId/expenses/:expenseId/receipts` (existing upload) now persists OCR results on the receipt record
6. Run `npm run test` and `npm run lint` to validate no regressions
7. Run `npm run swagger:generate` and verify the new endpoint appears in `openapi.json`

## Decisions

- OCR expenses are created immediately (not as drafts) with `ExtractionStatus.NeedsReview` when confidence < high, so users can correct them.
- `category` defaults to `Other` since receipts don't reliably indicate expense category.
- Phase 3 (confirm/review flow) is optional — the `update` endpoint already allows editing all fields.
- The `extract-receipt` endpoint is kept as-is for clients that want raw OCR data without creating an expense.

## Further Considerations

1. **File storage**: Receipt files are currently saved to a local path string but never actually written to disk. Should we add local disk write or integrate cloud storage (S3/GCS)? **Recommendation**: Start with local disk write using `multer` diskStorage for now.
2. **Background processing**: Should `createFromReceipt` be synchronous (simpler, user waits 2-5s) or async (returns draft, processes in background)? **Recommendation**: Synchronous for now — Gemini is fast and the user expects immediate feedback.
3. **Line items storage**: OCR returns `lineItems[]` but there's no line item entity. Store in `rawOcrJson` for now, or create a `LineItem` entity? **Recommendation**: Keep in `rawOcrJson` — avoid schema changes unless there's a UI that queries individual line items.
