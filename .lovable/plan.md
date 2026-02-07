

## Plan: Credit Customer Autocomplete + Default Table 1

### 1. Credit Customer Name Autocomplete

**What changes:** When typing a customer name in the Credit Sale modal, a dropdown list of existing debtors (from the `credits` table) will appear, filtered by what the user types. The user can either select an existing name or type a new one.

**Files to modify:**
- **`src/components/modals/CreditCustomerModal.tsx`**
  - Accept a new prop `existingCustomers: string[]` (list of unique debtor names)
  - Add state for showing/hiding the suggestion dropdown
  - As the user types, filter `existingCustomers` and display matching names below the input
  - Clicking a suggestion fills the input field
  - Also fix the typo "Nomde do Cliente" to "Nome do Cliente"

- **`src/pages/POS.tsx`**
  - Extract unique customer names from the existing `credits` data (already fetched via `useCredits`)
  - Pass them as `existingCustomers` prop to `CreditCustomerModal`

- **`src/components/modals/SplitBillModal.tsx`**
  - Same autocomplete logic for the inline credit customer name input in split bill mode
  - Will need the `existingCustomers` prop passed from POS

### 2. Default to Table 1 on POS Load

**What changes:** When the POS page loads, automatically select the first table instead of requiring manual selection.

**File to modify:**
- **`src/pages/POS.tsx`**
  - Add a `useEffect` that sets `selectedTable` to the first table's ID once `tables` data is loaded and no table is currently selected

### Technical Details

**Autocomplete component approach:**
- Simple filtered list rendered as an absolute-positioned div below the input
- Filter is case-insensitive partial match
- List shows up to 5 matching names
- Clicking outside dismisses the list
- Uses existing `credits` data -- no new database queries needed
- Deduplicate customer names with `[...new Set(credits.map(c => c.customer_name))]`

**Default table selection:**
```typescript
useEffect(() => {
  if (tables.length > 0 && !selectedTable) {
    setSelectedTable(tables[0].id);
  }
}, [tables, selectedTable]);
```

