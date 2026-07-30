## Goal
Replace the per-debtor Excel download on the Devedores page with a minimal, beige, invoice-style PDF matching the reference.

## Dependencies
Yes, two small ones are needed (no PDF engine exists today, only `xlsx`):
- `jspdf` — creates the PDF file
- `html2canvas` — renders a styled HTML invoice (so we get the cursive script font, beige paper, exact spacing) into the PDF

This is the only reliable way to get a cursive/script typeface; pure jsPDF text would require embedding a TTF manually.

## Design (matches the reference)
- Beige/off-white page background (`#F7F4EF`), dark ink text
- Large cursive script title top-left: **Conta Corrente** (Google font, e.g. Great Vibes / Dancing Script)
- Top-right meta block: **Data** only
- **Para:** debtor name (replaces "Billed To")
- **De:** store name
- Itemized table, centered on the page: DESCRIÇÃO · DATA · QTD · TOTAL — one row per bill/item, with dates
- Thin rules above/below the table, generous whitespace
- **SUBTOTAL** and **SALDO** rows (negative = dívida)
- **FORMAS DE PAGAMENTO:** Emola — 87 398 8847 (only)
- Cursive **Obrigado!** bottom-right

## Implementation
1. Add `src/components/DebtorReceipt.tsx` — off-screen HTML invoice template (fixed A4 width, inline styling).
2. Add `src/utils/pdfReceipt.ts` — renders that node with html2canvas at 2x scale and writes an A4 PDF via jsPDF, filename `Conta_Corrente_<Nome>_<data>.pdf`.
3. In `src/pages/Debtors.tsx`, point the existing per-debtor download button at the new PDF export, passing the debtor's bills (with dates, qty, value) and payments. Keep the global Excel export as-is.
4. Load the script font via an `@import` in `index.css` so html2canvas captures it; wait for `document.fonts.ready` before rendering.

## Verification
Generate a receipt for a real debtor, convert to image, and visually check for clipping, missing font, and correct totals.
