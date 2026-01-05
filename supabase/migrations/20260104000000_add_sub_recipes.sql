-- Create sub_recipes table for named sub-recipes
CREATE TABLE public.sub_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  processed_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_recipes ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to sub_recipes" ON public.sub_recipes
FOR ALL USING (true) WITH CHECK (true);

-- Create sub_recipe_items table for the ingredients of a sub-recipe
CREATE TABLE public.sub_recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_recipe_id uuid NOT NULL REFERENCES public.sub_recipes(id) ON DELETE CASCADE,
  raw_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_required numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_recipe_items ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Public access to sub_recipe_items" ON public.sub_recipe_items
FOR ALL USING (true) WITH CHECK (true);

-- Drop the old ingredient_recipes table
DROP TABLE public.ingredient_recipes;