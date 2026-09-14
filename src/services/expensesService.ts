import { supabase } from '@/integrations/supabase/client';
import type { Expense } from '@/hooks/useSupabaseData';

export interface UpdateExpenseInput {
  amount?: number;
  category?: string;
  category_id?: string;
  description?: string;
  ingredient_id?: string;
  ingredient_quantity?: number;
  supplier_id?: string;
  invoice_no?: string;
  is_iva_deductible?: boolean;
  payment_method?: string;
}

/**
 * Service function to update an operational expense in Supabase.
 */
export async function updateOperationalExpense(
  id: string,
  updates: UpdateExpenseInput
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error(error.message);
  }

  return data as Expense;
}
