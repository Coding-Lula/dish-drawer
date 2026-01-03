-- Add is_processed flag to ingredients table to mark processed ingredients
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;

-- Create ingredient_recipes table for sub-recipes (how to make processed ingredients from raw materials)
CREATE TABLE public.ingredient_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processed_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  raw_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_required numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(processed_ingredient_id, raw_ingredient_id)
);

-- Enable RLS
ALTER TABLE public.ingredient_recipes ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to ingredient_recipes" ON public.ingredient_recipes
FOR ALL USING (true) WITH CHECK (true);

-- Create inventory_transfers table to track stock transfers between stores
CREATE TABLE public.inventory_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  to_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  notes text,
  transferred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to inventory_transfers" ON public.inventory_transfers
FOR ALL USING (true) WITH CHECK (true);

-- Create production_logs table to track internal production
CREATE TABLE public.production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  processed_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_produced numeric NOT NULL,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  produced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to production_logs" ON public.production_logs
FOR ALL USING (true) WITH CHECK (true);

-- Create production_log_items table to track which raw materials were used
CREATE TABLE public.production_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_log_id uuid NOT NULL REFERENCES public.production_logs(id) ON DELETE CASCADE,
  raw_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_used numeric NOT NULL,
  unit_cost numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_log_items ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to production_log_items" ON public.production_log_items
FOR ALL USING (true) WITH CHECK (true);