import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DishBundle {
  id: string;
  name: string;
  description: string | null;
  default_price: number;
  cost_of_production: number;
  category: string | null;
  image: string | null;
  is_active: boolean;
  dish_id: string | null;
  created_at: string;
}

export interface BundleComponent {
  id: string;
  bundle_id: string;
  dish_id: string;
  is_required: boolean;
  max_quantity: number;
  created_at: string;
}

export interface StoreBundlePrice {
  id: string;
  store_id: string;
  bundle_id: string;
  custom_price: number;
  created_at: string;
  updated_at: string;
}

export interface BundleWithComponents extends DishBundle {
  components: BundleComponent[];
}

export function useBundles() {
  const [bundles, setBundles] = useState<BundleWithComponents[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBundles = useCallback(async () => {
    const { data: bundlesData, error: bundlesError } = await supabase
      .from('dish_bundles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (bundlesError) {
      toast({ title: 'Error fetching bundles', description: bundlesError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: componentsData, error: componentsError } = await supabase
      .from('bundle_components')
      .select('*');

    if (componentsError) {
      toast({ title: 'Error fetching bundle components', description: componentsError.message, variant: 'destructive' });
    }

    const bundlesWithComponents = (bundlesData || []).map(bundle => ({
      ...bundle,
      components: (componentsData || []).filter(c => c.bundle_id === bundle.id)
    }));

    setBundles(bundlesWithComponents);
    setLoading(false);
  }, [toast]);

  const addBundle = async (bundle: {
    name: string;
    description?: string;
    default_price: number;
    cost_of_production?: number;
    category?: string;
  }) => {
    // 1. Create a placeholder dish for the bundle
    const { data: dishData, error: dishError } = await supabase
      .from('dishes')
      .insert([{
        name: bundle.name,
        category: bundle.category || 'Bundle',
        selling_price: bundle.default_price,
        cost_of_production: bundle.cost_of_production || 20,
      }])
      .select()
      .single();

    if (dishError) {
      toast({ title: 'Error creating bundle placeholder', description: dishError.message, variant: 'destructive' });
      return null;
    }

    // 2. Create the bundle and link it to the dish
    const { data, error } = await supabase
      .from('dish_bundles')
      .insert([{
        name: bundle.name,
        description: bundle.description || null,
        default_price: bundle.default_price,
        cost_of_production: bundle.cost_of_production || 20,
        category: bundle.category || 'Bundle',
        dish_id: dishData.id,
      }])
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating bundle', description: error.message, variant: 'destructive' });
      // Cleanup the dish if bundle creation fails
      await supabase.from('dishes').delete().eq('id', dishData.id);
      return null;
    }

    setBundles(prev => [...prev, { ...data, components: [] }]);
    toast({ title: 'Bundle created successfully' });
    return data;
  };

  const addBundleComponent = async (bundleId: string, dishId: string, isRequired = false, maxQuantity = 1) => {
    const { data, error } = await supabase
      .from('bundle_components')
      .insert([{ bundle_id: bundleId, dish_id: dishId, is_required: isRequired, max_quantity: maxQuantity }])
      .select()
      .single();

    if (error) {
      toast({ title: 'Error adding component', description: error.message, variant: 'destructive' });
      return null;
    }

    setBundles(prev => prev.map(b => 
      b.id === bundleId ? { ...b, components: [...b.components, data] } : b
    ));
    return data;
  };

  const removeBundleComponent = async (componentId: string) => {
    const { error } = await supabase
      .from('bundle_components')
      .delete()
      .eq('id', componentId);

    if (error) {
      toast({ title: 'Error removing component', description: error.message, variant: 'destructive' });
      return false;
    }

    setBundles(prev => prev.map(b => ({
      ...b,
      components: b.components.filter(c => c.id !== componentId)
    })));
    return true;
  };

  const deleteBundle = async (bundleId: string) => {
    // Get bundle to find dish_id
    const bundleToDelete = bundles.find(b => b.id === bundleId);

    const { error } = await supabase
      .from('dish_bundles')
      .delete()
      .eq('id', bundleId);

    if (error) {
      toast({ title: 'Error deleting bundle', description: error.message, variant: 'destructive' });
      return false;
    }

    // Cleanup the associated dish if it exists
    if (bundleToDelete?.dish_id) {
      await supabase.from('dishes').delete().eq('id', bundleToDelete.dish_id);
    }

    setBundles(prev => prev.filter(b => b.id !== bundleId));
    toast({ title: 'Bundle deleted' });
    return true;
  };

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  return { bundles, loading, addBundle, addBundleComponent, removeBundleComponent, deleteBundle, refetch: fetchBundles };
}

export function useStoreBundlePrices(storeId: string | null) {
  const [prices, setPrices] = useState<StoreBundlePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPrices = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('store_bundle_prices')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      toast({ title: 'Error fetching bundle prices', description: error.message, variant: 'destructive' });
    } else {
      setPrices(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const getEffectiveBundlePrice = (bundleId: string, defaultPrice: number): number => {
    const override = prices.find(p => p.bundle_id === bundleId);
    return override ? Number(override.custom_price) : Number(defaultPrice);
  };

  const setOverridePrice = async (bundleId: string, customPrice: number) => {
    if (!storeId) return false;

    const existing = prices.find(p => p.bundle_id === bundleId);

    if (existing) {
      const { error } = await supabase
        .from('store_bundle_prices')
        .update({ custom_price: customPrice, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Error updating price', description: error.message, variant: 'destructive' });
        return false;
      }

      setPrices(prev => prev.map(p => 
        p.id === existing.id ? { ...p, custom_price: customPrice } : p
      ));
    } else {
      const { data, error } = await supabase
        .from('store_bundle_prices')
        .insert({ store_id: storeId, bundle_id: bundleId, custom_price: customPrice })
        .select()
        .single();

      if (error) {
        toast({ title: 'Error setting price', description: error.message, variant: 'destructive' });
        return false;
      }

      setPrices(prev => [...prev, data]);
    }

    toast({ title: 'Bundle price updated' });
    return true;
  };

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, loading, getEffectiveBundlePrice, setOverridePrice, refetch: fetchPrices };
}
