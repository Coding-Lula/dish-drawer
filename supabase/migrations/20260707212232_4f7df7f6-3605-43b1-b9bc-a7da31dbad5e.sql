
-- Helper: use existing has_store_access(uuid, uuid) and has_role(uuid, app_role)

-- ==========================================================
-- Replace "Public access to X" policies with scoped policies
-- ==========================================================

-- credits (store-scoped)
DROP POLICY IF EXISTS "Public access to credits" ON public.credits;
CREATE POLICY "Store members manage credits" ON public.credits
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- daily_summaries (store-scoped)
DROP POLICY IF EXISTS "Public access to daily_summaries" ON public.daily_summaries;
CREATE POLICY "Store members manage daily_summaries" ON public.daily_summaries
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- expenses (store-scoped)
DROP POLICY IF EXISTS "Public access to expenses" ON public.expenses;
CREATE POLICY "Store members manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- financial_transactions (store-scoped)
DROP POLICY IF EXISTS "Public access to financial_transactions" ON public.financial_transactions;
CREATE POLICY "Store members manage financial_transactions" ON public.financial_transactions
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- income_allocations (store-scoped)
DROP POLICY IF EXISTS "Public access to income_allocations" ON public.income_allocations;
CREATE POLICY "Store members manage income_allocations" ON public.income_allocations
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- monthly_budgets (store-scoped)
DROP POLICY IF EXISTS "Public access to monthly_budgets" ON public.monthly_budgets;
CREATE POLICY "Store members manage monthly_budgets" ON public.monthly_budgets
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- transactions (store-scoped)
DROP POLICY IF EXISTS "Public access to transactions" ON public.transactions;
CREATE POLICY "Store members manage transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- transaction_items (via parent transaction)
DROP POLICY IF EXISTS "Public access to transaction_items" ON public.transaction_items;
CREATE POLICY "Store members manage transaction_items" ON public.transaction_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND public.has_store_access(auth.uid(), t.store_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND public.has_store_access(auth.uid(), t.store_id)
  ));

-- store_stock (store-scoped)
DROP POLICY IF EXISTS "Public access to store_stock" ON public.store_stock;
CREATE POLICY "Store members manage store_stock" ON public.store_stock
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- inventory_logs (store-scoped)
DROP POLICY IF EXISTS "Public access to inventory_logs" ON public.inventory_logs;
CREATE POLICY "Store members manage inventory_logs" ON public.inventory_logs
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- inventory_transfers (both sides must be accessible)
DROP POLICY IF EXISTS "Public access to inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "Store members manage inventory_transfers" ON public.inventory_transfers
  FOR ALL TO authenticated
  USING (
    public.has_store_access(auth.uid(), from_store_id)
    AND public.has_store_access(auth.uid(), to_store_id)
  )
  WITH CHECK (
    public.has_store_access(auth.uid(), from_store_id)
    AND public.has_store_access(auth.uid(), to_store_id)
  );

-- production_logs (store-scoped)
DROP POLICY IF EXISTS "Public access to production_logs" ON public.production_logs;
CREATE POLICY "Store members manage production_logs" ON public.production_logs
  FOR ALL TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

-- month_locks: read by store members, write by managers only
DROP POLICY IF EXISTS "Public access to month_locks" ON public.month_locks;
CREATE POLICY "Store members read month_locks" ON public.month_locks
  FOR SELECT TO authenticated
  USING (public.has_store_access(auth.uid(), store_id));
CREATE POLICY "Managers write month_locks" ON public.month_locks
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers update month_locks" ON public.month_locks
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers delete month_locks" ON public.month_locks
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::app_role));

-- stores: any authenticated user can read, managers only write
DROP POLICY IF EXISTS "Public access to stores" ON public.stores;
CREATE POLICY "Authenticated read stores" ON public.stores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert stores" ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers update stores" ON public.stores
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers delete stores" ON public.stores
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::app_role));

-- suppliers: authenticated read/write
DROP POLICY IF EXISTS "Public access to suppliers" ON public.suppliers;
CREATE POLICY "Authenticated manage suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ==========================================================
-- user_roles: remove self-insert privilege-escalation policy
-- ==========================================================
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
-- Only managers may insert new roles (already have update/delete/view)
CREATE POLICY "Managers insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));

-- ==========================================================
-- Data integrity CHECK constraints (input validation)
-- ==========================================================
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_amount_positive,
  ADD CONSTRAINT expenses_amount_positive CHECK (amount >= 0 AND amount <= 100000000);

ALTER TABLE public.dishes
  DROP CONSTRAINT IF EXISTS dishes_selling_price_non_negative,
  ADD CONSTRAINT dishes_selling_price_non_negative CHECK (selling_price >= 0 AND selling_price <= 10000000),
  DROP CONSTRAINT IF EXISTS dishes_name_length,
  ADD CONSTRAINT dishes_name_length CHECK (char_length(name) BETWEEN 1 AND 200);

ALTER TABLE public.store_stock
  DROP CONSTRAINT IF EXISTS store_stock_non_negative,
  ADD CONSTRAINT store_stock_non_negative CHECK (current_quantity >= 0);

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_non_negative,
  ADD CONSTRAINT transactions_amount_non_negative CHECK (total_amount >= 0 AND total_amount <= 100000000);

ALTER TABLE public.transaction_items
  DROP CONSTRAINT IF EXISTS transaction_items_qty_positive,
  ADD CONSTRAINT transaction_items_qty_positive CHECK (quantity > 0 AND quantity <= 100000),
  DROP CONSTRAINT IF EXISTS transaction_items_price_non_negative,
  ADD CONSTRAINT transaction_items_price_non_negative CHECK (unit_price >= 0);

ALTER TABLE public.credits
  DROP CONSTRAINT IF EXISTS credits_sale_amount_non_negative,
  ADD CONSTRAINT credits_sale_amount_non_negative CHECK (sale_amount >= 0),
  DROP CONSTRAINT IF EXISTS credits_customer_name_length,
  ADD CONSTRAINT credits_customer_name_length CHECK (char_length(customer_name) BETWEEN 1 AND 200);

-- ==========================================================
-- Revoke EXECUTE on SECURITY DEFINER functions from anon
-- ==========================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_store_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_stores(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deduct_stock(uuid, uuid, numeric) FROM PUBLIC, anon;
