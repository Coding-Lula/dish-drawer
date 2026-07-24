## Goal
Prevent the POS cart from being lost on refresh or accidental navigation by persisting it to `localStorage`, scoped per store + per user.

## Approach
Add a small persistence layer inside `src/pages/POS.tsx` (where the `cart` state lives) using a `useEffect` pair:

1. **Load on mount / when store or user changes**
   - Key: `pos_cart::<userId>::<storeId>`
   - Parse JSON from `localStorage`; hydrate `cart` state if valid.
   - Guard against malformed data (try/catch, schema check on shape).

2. **Save on every cart change**
   - Serialize `cart` to the same key whenever it changes.
   - If cart is empty, remove the key to avoid clutter.

3. **Clear on checkout**
   - After a successful sale/split-bill (existing `clearCart` / setCart([]) paths), the empty-cart effect above naturally removes the key.

4. **Scope isolation**
   - Different store → different key, so switching stores doesn't leak items.
   - Different user (logout/login) → different key.
   - If `userId` or `storeId` isn't available yet, skip hydration until they are.

## Out of scope
- Selected table, category filter, search term, split-bill draft (per user's answer: cart only).
- Cross-device sync (no DB table).
- `beforeunload` warnings.

## Technical notes
- Only `src/pages/POS.tsx` changes. No schema, no new hooks required.
- Storage key format: `pos_cart::${userId}::${storeId}`.
- Wrap `JSON.parse` in try/catch; on failure, remove the key and start fresh.
- Persist only serializable fields already on `CartItem` (dish + quantity + any bundle/notes metadata already stored).
