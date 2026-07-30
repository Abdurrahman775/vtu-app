# Transaction Receipts

Client-side only — there's no receipt-generation route on the backend.
`GET /api/transactions/[id]` already returns everything a receipt needs
(amount, provider, reference, status, `meta`); the mobile app turns that
into a PDF locally and hands it to the OS share/save sheet.

## Flow

1. On `TransactionDetailScreen`
   (`mobile/lib/src/features/transactions/screens/transaction_detail_screen.dart`),
   "Download Receipt" calls `buildReceiptPdf()`
   (`mobile/lib/src/core/pdf/pdf_builder.dart`), which renders a one-page
   PDF: type/provider/date header, amount, status, reference, provider
   reference, and every other `meta` key generically rendered as a
   "Label: value" line (skipping `baseAmountNaira`/`marginPercent`,
   which are internal pricing details, not customer-facing).
2. The PDF bytes are handed to `Printing.sharePdf()` (`printing`
   package), which triggers the native share sheet on Android/iOS or a
   browser download on web — no platform-specific file-writing code
   needed.

This replaced an earlier plain-text implementation
(`_buildReceiptText` + `share_plus` + a `receipt_downloader*.dart`
conditional-import trio) that only worked on web — the native "Save"
path threw `UnsupportedError` unconditionally since no native
file-writing was ever implemented. Those files have been deleted.

## Status

- [x] PDF receipt generation + share/download, cross-platform (mobile
      web and native, via `printing`)
- [ ] No server-side copy/audit trail of generated receipts (fine for
      now — the underlying `Transaction` row is the source of truth)
