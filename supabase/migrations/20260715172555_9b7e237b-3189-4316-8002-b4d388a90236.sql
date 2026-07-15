
CREATE TABLE public.debtor_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT debtor_payments_customer_name_length CHECK (char_length(customer_name) BETWEEN 1 AND 200)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.debtor_payments TO authenticated;
GRANT ALL ON public.debtor_payments TO service_role;

ALTER TABLE public.debtor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can view debtor payments"
  ON public.debtor_payments FOR SELECT TO authenticated
  USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Store users can insert debtor payments"
  ON public.debtor_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Store users can update debtor payments"
  ON public.debtor_payments FOR UPDATE TO authenticated
  USING (public.has_store_access(auth.uid(), store_id))
  WITH CHECK (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Store users can delete debtor payments"
  ON public.debtor_payments FOR DELETE TO authenticated
  USING (public.has_store_access(auth.uid(), store_id));

CREATE INDEX idx_debtor_payments_store_customer ON public.debtor_payments (store_id, lower(customer_name));
