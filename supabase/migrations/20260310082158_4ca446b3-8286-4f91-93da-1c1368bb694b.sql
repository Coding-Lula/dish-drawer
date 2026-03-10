CREATE OR REPLACE FUNCTION public.deduct_stock(p_store_id uuid, p_ingredient_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_qty numeric;
BEGIN
  UPDATE store_stock
  SET current_quantity = GREATEST(0, current_quantity - p_amount)
  WHERE store_id = p_store_id AND ingredient_id = p_ingredient_id
  RETURNING current_quantity INTO new_qty;
  
  RETURN COALESCE(new_qty, -1);
END;
$$;