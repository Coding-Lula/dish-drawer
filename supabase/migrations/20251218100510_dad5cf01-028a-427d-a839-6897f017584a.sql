-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.expense_categories (name, is_system) VALUES 
  ('Stock', true),
  ('Ops', true),
  ('Salary', true),
  ('Utilities', true),
  ('Miscellaneous', true);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ingredients table
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'units',
  average_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dishes table
CREATE TABLE public.dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Main',
  selling_price DECIMAL(10,2) NOT NULL,
  image TEXT,
  cost_of_production DECIMAL(10,2) DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipes (technical sheets) table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  quantity_required DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store stock table
CREATE TABLE public.store_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  current_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,3) NOT NULL DEFAULT 10,
  target_stock DECIMAL(10,3) NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, ingredient_id)
);

-- Create restaurant tables
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  table_number INTEGER NOT NULL,
  name TEXT,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, table_number)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  staff_id TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.restaurant_tables(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction items table
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category_id UUID REFERENCES public.expense_categories(id),
  category TEXT,
  description TEXT,
  is_deducted BOOLEAN DEFAULT false,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  staff_id TEXT,
  ingredient_id UUID REFERENCES public.ingredients(id),
  ingredient_quantity DECIMAL(10,3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory logs table (for WAC tracking)
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  change_amount DECIMAL(10,3) NOT NULL,
  purchase_price DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT 'purchase',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create split configs table
CREATE TABLE public.split_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  restock_percent DECIMAL(5,2) NOT NULL DEFAULT 30,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 10,
  bank_percent DECIMAL(5,2) NOT NULL DEFAULT 20,
  ops_percent DECIMAL(5,2) NOT NULL DEFAULT 40,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default split config
INSERT INTO public.split_configs (name, restock_percent, tax_percent, bank_percent, ops_percent, is_default) 
VALUES ('Standard Split', 30, 10, 20, 40, true);

-- Create daily summaries table
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  salary_amount DECIMAL(10,2) DEFAULT 0,
  salary_percent DECIMAL(5,2) DEFAULT 0,
  restock_amount DECIMAL(10,2) DEFAULT 0,
  restock_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  misc_amount DECIMAL(10,2) DEFAULT 0,
  misc_percent DECIMAL(5,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  net_profit_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, store_id)
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create public access policies (since no auth required for now)
CREATE POLICY "Public access to stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to expense_categories" ON public.expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to dishes" ON public.dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to recipes" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to store_stock" ON public.store_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to restaurant_tables" ON public.restaurant_tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to transaction_items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to inventory_logs" ON public.inventory_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to split_configs" ON public.split_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to daily_summaries" ON public.daily_summaries FOR ALL USING (true) WITH CHECK (true);

-- Insert sample stores
INSERT INTO public.stores (id, name, location) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Downtown Branch', 'Main Street, City Center'),
  ('22222222-2222-2222-2222-222222222222', 'Airport Branch', 'Terminal 2, International Airport');

-- Insert sample tables for each store
INSERT INTO public.restaurant_tables (store_id, table_number, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 'Table 1'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Table 2'),
  ('11111111-1111-1111-1111-111111111111', 3, 'Table 3'),
  ('11111111-1111-1111-1111-111111111111', 4, 'Table 4'),
  ('22222222-2222-2222-2222-222222222222', 1, 'Table 1'),
  ('22222222-2222-2222-2222-222222222222', 2, 'Table 2'),
  ('22222222-2222-2222-2222-222222222222', 3, 'Table 3');