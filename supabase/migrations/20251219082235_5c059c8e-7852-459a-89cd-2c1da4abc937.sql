-- Create credits table for debt tracking
CREATE TABLE public.credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  customer_name TEXT NOT NULL,
  sale_amount NUMERIC NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'unsettled' CHECK (status IN ('unsettled', 'settled')),
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Public access to credits" ON public.credits FOR ALL USING (true) WITH CHECK (true);

-- Create allocation_categories table for dynamic revenue allocation cards
CREATE TABLE public.allocation_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  percent NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT 'border-l-gray-500',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allocation_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Public access to allocation_categories" ON public.allocation_categories FOR ALL USING (true) WITH CHECK (true);

-- Insert default allocation categories
INSERT INTO public.allocation_categories (name, percent, icon, color, display_order, is_system) VALUES
  ('Salaries', 25, 'users', 'border-l-purple-500', 1, true),
  ('Restock Fund', 30, 'package', 'border-l-green-500', 2, true),
  ('Tax Vault', 10, 'building2', 'border-l-blue-500', 3, true),
  ('Miscellaneous', 5, 'more-horizontal', 'border-l-amber-500', 4, false);