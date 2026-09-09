CREATE TABLE public.order_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_number integer NOT NULL DEFAULT 0,
  latest_order_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

GRANT SELECT, INSERT, UPDATE ON public.order_counters TO authenticated;
GRANT ALL ON public.order_counters TO service_role;

ALTER TABLE public.order_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view counters for their stores"
ON public.order_counters FOR SELECT TO authenticated
USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Users can insert counters for their stores"
ON public.order_counters FOR INSERT TO authenticated
WITH CHECK (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Users can update counters for their stores"
ON public.order_counters FOR UPDATE TO authenticated
USING (public.has_store_access(auth.uid(), store_id))
WITH CHECK (public.has_store_access(auth.uid(), store_id));

CREATE OR REPLACE FUNCTION public.next_order_number(p_store_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_number integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_store_access(auth.uid(), p_store_id) THEN
    RAISE EXCEPTION 'Access denied for store';
  END IF;

  INSERT INTO public.order_counters (store_id, order_number, latest_order_date)
  VALUES (p_store_id, 1, CURRENT_DATE)
  ON CONFLICT (store_id) DO UPDATE
    SET order_number = CASE
          WHEN public.order_counters.latest_order_date = CURRENT_DATE
            THEN public.order_counters.order_number + 1
          ELSE 1
        END,
        latest_order_date = CURRENT_DATE,
        updated_at = now()
  RETURNING order_number INTO v_number;

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.next_order_number(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_order_number(uuid) TO authenticated;