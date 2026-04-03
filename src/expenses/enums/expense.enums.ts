export enum ExpenseCategory {
  Food = 'food',
  Transport = 'transport',
  Accommodation = 'accommodation',
  Shopping = 'shopping',
  TicketsActivities = 'tickets_activities',
  Cash = 'cash',
  Other = 'other',
}

export enum PaymentMethod {
  CreditCard = 'credit_card',
  DebitCard = 'debit_card',
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  Other = 'other',
}

export enum ExtractionStatus {
  None = 'none',
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
  NeedsReview = 'needs_review',
}

export enum ExpenseSource {
  Manual = 'manual',
  Ocr = 'ocr',
  QuickAdd = 'quick_add',
  Draft = 'draft',
}
