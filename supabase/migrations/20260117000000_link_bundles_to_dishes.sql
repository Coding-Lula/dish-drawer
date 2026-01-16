-- Add dish_id to dish_bundles to link them with a placeholder dish in the dishes table
ALTER TABLE public.dish_bundles ADD COLUMN dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL;

-- Index for better join performance
CREATE INDEX idx_dish_bundles_dish_id ON public.dish_bundles(dish_id);
