ALTER TABLE public.financial_transactions
ADD COLUMN transfer_to_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.financial_transactions.transfer_to_store_id IS 'Destination store ID for inter-store fund transfers';
