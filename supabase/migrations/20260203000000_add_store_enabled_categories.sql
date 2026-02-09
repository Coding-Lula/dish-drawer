-- Create store_enabled_categories table
CREATE TABLE IF NOT EXISTS public.store_enabled_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(store_id, category)
);

-- Enable RLS
ALTER TABLE public.store_enabled_categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read store_enabled_categories"
ON public.store_enabled_categories FOR SELECT
TO authenticated
USING (true);

-- Allow managers to manage
CREATE POLICY "Allow managers to manage store_enabled_categories"
ON public.store_enabled_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'manager'
        AND (store_id IS NULL OR store_id = store_enabled_categories.store_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'manager'
        AND (store_id IS NULL OR store_id = store_enabled_categories.store_id)
    )
);
