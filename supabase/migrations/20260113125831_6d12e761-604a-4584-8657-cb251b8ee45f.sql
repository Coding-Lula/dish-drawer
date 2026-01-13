-- 1. Create store_dish_prices table for store-specific pricing
CREATE TABLE public.store_dish_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_store_dish UNIQUE (store_id, dish_id)
);

-- Enable RLS on store_dish_prices
ALTER TABLE public.store_dish_prices ENABLE ROW LEVEL SECURITY;

-- Create public access policy for store_dish_prices
CREATE POLICY "Public access to store_dish_prices" 
ON public.store_dish_prices 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add index for better query performance
CREATE INDEX idx_store_dish_prices_store ON public.store_dish_prices(store_id);
CREATE INDEX idx_store_dish_prices_dish ON public.store_dish_prices(dish_id);

-- 2. Add default_price column to dishes table (rename selling_price concept)
-- We'll keep selling_price as the default price for backward compatibility

-- 3. Create restock_history view or we can use inventory_logs with reason='purchase'
-- The inventory_logs table already tracks purchases, so we'll add supplier info
-- First, let's add indexes for better performance on inventory_logs
CREATE INDEX IF NOT EXISTS idx_inventory_logs_store_date ON public.inventory_logs(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_reason ON public.inventory_logs(reason);