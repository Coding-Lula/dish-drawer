import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the next daily order number for a store.
 * Increments while the counter's latest date is today, resets to 1 on a new day.
 */
export async function getNextOrderNumber(storeId: string): Promise<number> {
  const { data, error } = await supabase.rpc('next_order_number', { p_store_id: storeId });
  if (error) throw error;
  return Number(data);
}

export function useOrderNumber() {
  return { getNextOrderNumber };
}
