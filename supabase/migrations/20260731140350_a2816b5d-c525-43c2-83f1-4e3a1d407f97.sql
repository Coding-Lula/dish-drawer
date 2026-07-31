-- 1. Global master data: authenticated read, manager write
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dishes','recipes','ingredients','ingredient_recipes','dish_bundles','bundle_components','sub_recipes','sub_recipe_items','sub_recipe_outputs','expense_categories','expense_parent_categories','allocation_categories','split_configs','income_sources']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Public access to '||t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "Authenticated read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Managers insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''manager''))', t);
    EXECUTE format('CREATE POLICY "Managers update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''manager'')) WITH CHECK (public.has_role(auth.uid(), ''manager''))', t);
    EXECUTE format('CREATE POLICY "Managers delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''manager''))', t);
  END LOOP;
END $$;

-- 2. Store-scoped tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['store_dish_prices','store_bundle_prices','store_enabled_categories','restaurant_tables']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Public access to '||t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "Store members manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_store_access(auth.uid(), store_id)) WITH CHECK (public.has_store_access(auth.uid(), store_id))', t);
  END LOOP;
END $$;

-- 3. production_log_items scoped through its parent log
DROP POLICY IF EXISTS "Public access to production_log_items" ON public.production_log_items;
REVOKE ALL ON public.production_log_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_log_items TO authenticated;
GRANT ALL ON public.production_log_items TO service_role;
CREATE POLICY "Store members manage production_log_items"
ON public.production_log_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.production_logs pl WHERE pl.id = production_log_id AND public.has_store_access(auth.uid(), pl.store_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.production_logs pl WHERE pl.id = production_log_id AND public.has_store_access(auth.uid(), pl.store_id)));

-- 4. Harden deduct_stock with an in-function access check
CREATE OR REPLACE FUNCTION public.deduct_stock(p_store_id uuid, p_ingredient_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_qty numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_store_access(auth.uid(), p_store_id) THEN
    RAISE EXCEPTION 'Access denied for store';
  END IF;

  UPDATE store_stock
  SET current_quantity = GREATEST(0, current_quantity - p_amount)
  WHERE store_id = p_store_id AND ingredient_id = p_ingredient_id
  RETURNING current_quantity INTO new_qty;

  RETURN COALESCE(new_qty, -1);
END;
$function$;

-- 5. Revoke execute on internal-only definer functions
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_stores(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.deduct_stock(uuid, uuid, numeric) FROM anon, public;