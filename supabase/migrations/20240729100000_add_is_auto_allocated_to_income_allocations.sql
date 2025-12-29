ALTER TABLE public.income_allocations
ADD COLUMN is_auto_allocated BOOLEAN DEFAULT FALSE;
