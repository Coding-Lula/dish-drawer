import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoreEnabledCategory {
  id: string;
  store_id: string;
  category: string;
  created_at: string;
}

export function useStoreCategories(storeId: string | null) {
  const [enabledCategories, setEnabledCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEnabledCategories = useCallback(async () => {
    if (!storeId) {
      setEnabledCategories([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('store_enabled_categories')
      .select('category')
      .eq('store_id', storeId);

    if (error) {
      toast({ title: 'Error fetching enabled categories', description: error.message, variant: 'destructive' });
    } else {
      setEnabledCategories(data?.map(item => item.category) || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const toggleCategory = async (category: string, isEnabled: boolean) => {
    if (!storeId) return false;

    if (isEnabled) {
      // Enable category (add to table)
      const { error } = await supabase
        .from('store_enabled_categories')
        .insert({ store_id: storeId, category });

      if (error) {
        toast({ title: 'Error enabling category', description: error.message, variant: 'destructive' });
        return false;
      }
      setEnabledCategories(prev => [...prev, category]);
    } else {
      // Disable category (remove from table)
      const { error } = await supabase
        .from('store_enabled_categories')
        .delete()
        .eq('store_id', storeId)
        .eq('category', category);

      if (error) {
        toast({ title: 'Error disabling category', description: error.message, variant: 'destructive' });
        return false;
      }
      setEnabledCategories(prev => prev.filter(cat => cat !== category));
    }

    return true;
  };

  const setCategories = async (categories: string[]) => {
    if (!storeId) return false;

    // This is a bit more complex, we might want to just replace all entries
    // But for simplicity and RLS, let's just do it individually or with a clever query if possible.
    // Actually, let's just delete all and insert new ones for this store.

    const { error: deleteError } = await supabase
      .from('store_enabled_categories')
      .delete()
      .eq('store_id', storeId);

    if (deleteError) {
      toast({ title: 'Error updating categories', description: deleteError.message, variant: 'destructive' });
      return false;
    }

    if (categories.length > 0) {
      const { error: insertError } = await supabase
        .from('store_enabled_categories')
        .insert(categories.map(category => ({ store_id: storeId, category })));

      if (insertError) {
        toast({ title: 'Error updating categories', description: insertError.message, variant: 'destructive' });
        return false;
      }
    }

    setEnabledCategories(categories);
    toast({ title: 'Store categories updated' });
    return true;
  };

  useEffect(() => {
    fetchEnabledCategories();
  }, [fetchEnabledCategories]);

  return {
    enabledCategories,
    loading,
    toggleCategory,
    setCategories,
    refetch: fetchEnabledCategories
  };
}
