-- Add new columns to expenses table for enhanced expense tracking
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS invoice_no text,
ADD COLUMN IF NOT EXISTS is_iva_deductible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method text;

-- Create sub_recipes table to allow recipes to produce multiple items
CREATE TABLE IF NOT EXISTS public.sub_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sub_recipe_outputs table for multiple outputs per recipe
CREATE TABLE IF NOT EXISTS public.sub_recipe_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_recipe_id uuid NOT NULL REFERENCES public.sub_recipes(id) ON DELETE CASCADE,
  processed_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id),
  quantity_produced numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sub_recipe_items table for raw materials
CREATE TABLE IF NOT EXISTS public.sub_recipe_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_recipe_id uuid NOT NULL REFERENCES public.sub_recipes(id) ON DELETE CASCADE,
  raw_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id),
  quantity_required numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.sub_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_recipe_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_recipe_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub_recipes
CREATE POLICY "Public access to sub_recipes" ON public.sub_recipes
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for sub_recipe_outputs
CREATE POLICY "Public access to sub_recipe_outputs" ON public.sub_recipe_outputs
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for sub_recipe_items
CREATE POLICY "Public access to sub_recipe_items" ON public.sub_recipe_items
  FOR ALL USING (true) WITH CHECK (true);