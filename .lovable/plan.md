

## Bulk Stock Correction via CSV Upload

### What it does
Adds a "Bulk Correct Stock" button (manager-only) to the Inventory page. Users can:
1. **Download a template** CSV pre-filled with current stock data (ingredient name, unit, current quantity, and a blank "new quantity" column)
2. **Edit the CSV** in Excel/Google Sheets, filling in correct quantities
3. **Upload the corrected CSV** back, review changes in a preview table, then apply all corrections at once

### User Flow

```text
[Download Template] --> Edit in Excel --> [Upload CSV] --> Preview Changes --> [Apply All]
```

### Files to Create/Modify

**1. New file: `src/components/modals/BulkStockCorrectionModal.tsx`**
- Dialog with two tabs/steps:
  - **Step 1**: "Download Template" button that generates a CSV with columns: `Ingredient`, `Unit`, `Current Qty`, `New Qty`
  - **Step 2**: File upload input (accepts .csv, .xlsx). On upload:
    - Parse with `xlsx` library
    - Match rows to ingredients by name (case-insensitive)
    - Show a preview table with: Ingredient | Current Qty | New Qty | Difference
    - Highlight increases in green, decreases in red, unchanged in gray
    - Show unmatched rows as warnings
  - **Submit**: Calls `manualAdjustStock` for each changed item
- Manager-only (already controlled by the page)

**2. Modify: `src/pages/Inventory.tsx`**
- Import and render `BulkStockCorrectionModal` in the manager actions area
- Pass required props: `stocks`, `ingredients`, `manualAdjustStock`, `refetchStocks`

### Technical Details

**Template CSV generation:**
```typescript
// Using xlsx library already installed
import * as XLSX from 'xlsx';

const templateData = stocks.map(stock => {
  const ing = ingredients.find(i => i.id === stock.ingredient_id);
  return {
    'Ingredient': ing?.name || '',
    'Unit': ing?.unit || '',
    'Current Qty': stock.current_quantity,
    'New Qty': '' // user fills this in
  };
});
const ws = XLSX.utils.json_to_sheet(templateData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Stock');
XLSX.writeFile(wb, `stock-correction-${storeName}.xlsx`);
```

**CSV parsing and matching:**
- Parse uploaded file with `XLSX.read()`
- Match "Ingredient" column to `ingredients` by name (case-insensitive, trimmed)
- Only process rows where "New Qty" is a valid number and differs from current
- Each matched row calls `manualAdjustStock(stockId, newQuantity)`

**Preview table columns:**
- Ingredient name
- Current quantity
- New quantity (from CSV)
- Change (+/- with color coding)
- Status (Matched / Not Found)

**Error handling:**
- Skip rows with empty or invalid "New Qty"
- Warn about ingredient names that don't match any store item
- Show success/error count after applying

