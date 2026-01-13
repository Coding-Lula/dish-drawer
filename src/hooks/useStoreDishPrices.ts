import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoreDishPrice {
  id: string;
  store_id: string;
  dish_id: string;
  custom_price: number;
  created_at: string;
  updated_at: string;
}

export function useStoreDishPrices(storeId: string | null) {
  const [prices, setPrices] = useState<StoreDishPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPrices = useCallback(async () => {
    if (!storeId) {
      setPrices([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('store_dish_prices')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      toast({ title: 'Error fetching store prices', description: error.message, variant: 'destructive' });
    } else {
      setPrices(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const getEffectivePrice = useCallback((dishId: string, defaultPrice: number): number => {
    const override = prices.find(p => p.dish_id === dishId);
    return override ? Number(override.custom_price) : Number(defaultPrice);
  }, [prices]);

  const hasOverride = useCallback((dishId: string): boolean => {
    return prices.some(p => p.dish_id === dishId);
  }, [prices]);

  const getOverridePrice = useCallback((dishId: string): number | null => {
    const override = prices.find(p => p.dish_id === dishId);
    return override ? Number(override.custom_price) : null;
  }, [prices]);

  const setOverridePrice = async (dishId: string, customPrice: number): Promise<boolean> => {
    if (!storeId) return false;

    const existing = prices.find(p => p.dish_id === dishId);

    if (existing) {
      // Update existing override
      const { error } = await supabase
        .from('store_dish_prices')
        .update({ custom_price: customPrice, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Error updating price override', description: error.message, variant: 'destructive' });
        return false;
      }

      setPrices(prev => prev.map(p => 
        p.id === existing.id ? { ...p, custom_price: customPrice, updated_at: new Date().toISOString() } : p
      ));
    } else {
      // Create new override
      const { data, error } = await supabase
        .from('store_dish_prices')
        .insert({ store_id: storeId, dish_id: dishId, custom_price: customPrice })
        .select()
        .single();

      if (error) {
        toast({ title: 'Error creating price override', description: error.message, variant: 'destructive' });
        return false;
      }

      setPrices(prev => [...prev, data]);
    }

    toast({ title: 'Price override saved' });
    return true;
  };

  const removeOverridePrice = async (dishId: string): Promise<boolean> => {
    if (!storeId) return false;

    const existing = prices.find(p => p.dish_id === dishId);
    if (!existing) return true;

    const { error } = await supabase
      .from('store_dish_prices')
      .delete()
      .eq('id', existing.id);

    if (error) {
      toast({ title: 'Error removing price override', description: error.message, variant: 'destructive' });
      return false;
    }

    setPrices(prev => prev.filter(p => p.id !== existing.id));
    toast({ title: 'Price override removed' });
    return true;
  };

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    getEffectivePrice,
    hasOverride,
    getOverridePrice,
    setOverridePrice,
    removeOverridePrice,
    refetch: fetchPrices
  };
}
