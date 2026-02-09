
CREATE TABLE public.store_enabled_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, category)
);

ALTER TABLE public.store_enabled_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to store_enabled_categories"
  ON public.store_enabled_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);
