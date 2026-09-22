# Temporary client names for POS tables

## Goal
Let staff rename the currently selected table to a client’s name from the POS table selector without changing the saved database name.

## Implementation
- Add session-only table display names to the POS state; do not save them to the database or browser storage.
- Show a pencil control when hovering or focusing the selected table name.
- Clicking the pencil opens a compact name field; Enter or the confirm icon applies it, Escape cancels, and clearing it restores the original table name.
- Use the temporary name consistently in the table selector, cart, table map, split bill, and printed receipt.
- Because names live only in the signed-in POS screen’s memory, logging out or reloading restores the database names automatically.

## Verification
- Rename “Table 1,” switch tables, and confirm the temporary name remains during the current session.
- Confirm the database-backed table name is unchanged after logout or reload.
- Check desktop hover/focus behavior and that POS checkout and printing still use the selected table correctly.
