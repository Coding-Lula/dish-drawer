-- ========================================
-- Financial Tracking System Database Schema
-- ========================================

-- 1. Income Sources table (POS, mPesa, Cash, eMola, custom sources)
CREATE TABLE public.income_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT 'bg-blue-500',
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to income_sources"
ON public.income_sources FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default income sources
INSERT INTO public.income_sources (name, icon, color, is_default, display_order) VALUES
  ('POS', 'credit-card', 'bg-blue-500', true, 1),
  ('mPesa', 'smartphone', 'bg-green-500', true, 2),
  ('Cash', 'banknote', 'bg-amber-500', true, 3),
  ('eMola', 'wallet', 'bg-purple-500', true, 4);

-- 2. Income Allocations table (distribute store revenue to sources)
CREATE TABLE public.income_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.income_sources(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_allocations ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to income_allocations"
ON public.income_allocations FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Expense Parent Categories table (hierarchical expense structure)
CREATE TABLE public.expense_parent_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_parent_categories ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to expense_parent_categories"
ON public.expense_parent_categories FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default parent categories
INSERT INTO public.expense_parent_categories (name, display_order) VALUES
  ('OPERATIONAL COST', 1),
  ('FINANCIAL COST', 2),
  ('MARKETING', 3),
  ('OTHER', 4);

-- 4. Add parent_id and monthly_budget to expense_categories
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.expense_parent_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing expense categories or add new child categories
-- First get parent IDs and add child categories
DO $$
DECLARE
  operational_id UUID;
  financial_id UUID;
  marketing_id UUID;
BEGIN
  SELECT id INTO operational_id FROM public.expense_parent_categories WHERE name = 'OPERATIONAL COST' LIMIT 1;
  SELECT id INTO financial_id FROM public.expense_parent_categories WHERE name = 'FINANCIAL COST' LIMIT 1;
  SELECT id INTO marketing_id FROM public.expense_parent_categories WHERE name = 'MARKETING' LIMIT 1;
  
  -- Insert child categories if they don't exist
  INSERT INTO public.expense_categories (name, parent_id, monthly_budget, display_order, is_system) 
  VALUES 
    ('Rent', operational_id, 5000, 1, true),
    ('Utilities', operational_id, 2000, 2, true),
    ('Salaries', operational_id, 15000, 3, true),
    ('Fuel', operational_id, 3000, 4, true),
    ('Bank Fees', financial_id, 500, 1, true),
    ('Loan Interest', financial_id, 1500, 2, true),
    ('Advertising', marketing_id, 3000, 1, true)
  ON CONFLICT DO NOTHING;
END $$;

-- 5. Financial Transactions table (unified expense/transfer/income tracking)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'transfer', 'income')),
  amount NUMERIC NOT NULL,
  supplier TEXT,
  invoice_no TEXT,
  description TEXT,
  source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  transfer_to_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to financial_transactions"
ON public.financial_transactions FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Month Locks table (freeze transactions for month-end)
CREATE TABLE public.month_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, year, month)
);

-- Enable RLS
ALTER TABLE public.month_locks ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to month_locks"
ON public.month_locks FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Monthly Budgets table (track budgets per category per month)
CREATE TABLE public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  expense_category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, expense_category_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Public access policy
CREATE POLICY "Public access to monthly_budgets"
ON public.monthly_budgets FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_allocations_store_date ON public.income_allocations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_store_date ON public.financial_transactions(store_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_month_locks_store ON public.month_locks(store_id, year, month);