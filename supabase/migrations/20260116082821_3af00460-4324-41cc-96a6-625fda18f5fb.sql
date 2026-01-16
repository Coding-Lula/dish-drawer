-- Create dish_bundles table for parent bundle items (like "Breakfast")
CREATE TABLE public.dish_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC NOT NULL DEFAULT 0,
  cost_of_production NUMERIC NOT NULL DEFAULT 20,
  category TEXT DEFAULT 'Bundle',
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for bundle components (the sub-dishes that can be selected)
CREATE TABLE public.bundle_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.dish_bundles(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  max_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, dish_id)
);

-- Create table for store-specific bundle prices (similar to store_dish_prices)
CREATE TABLE public.store_bundle_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.dish_bundles(id) ON DELETE CASCADE,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, bundle_id)
);

-- Enable Row Level Security
ALTER TABLE public.dish_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_bundle_prices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to dish_bundles" ON public.dish_bundles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to bundle_components" ON public.bundle_components FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to store_bundle_prices" ON public.store_bundle_prices FOR ALL USING (true) WITH CHECK (true);