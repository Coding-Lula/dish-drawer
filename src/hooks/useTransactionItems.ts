import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TransactionItemWithDetails {
  id: string;
  transaction_id: string;
  dish_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  dish_name?: string;
  dish_category?: string;
}

export interface TableSalesBreakdown {
  table_id: string;
  table_name: string;
  items: TransactionItemWithDetails[];
  total: number;
}

export function useTransactionItems(storeId: string | null) {
  const [items, setItems] = useState<TransactionItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!storeId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // First get today's transactions for this store
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, table_id')
      .eq('store_id', storeId)
      .gte('date', today);

    if (txError) {
      toast({ title: 'Error fetching transactions', description: txError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!transactions || transactions.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const transactionIds = transactions.map(t => t.id);

    // Get transaction items
    const { data: txItems, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .in('transaction_id', transactionIds);

    if (itemsError) {
      toast({ title: 'Error fetching transaction items', description: itemsError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Get dish details
    const dishIds = [...new Set((txItems || []).map(i => i.dish_id).filter(Boolean))];
    
    let dishMap: Record<string, { name: string; category: string | null }> = {};
    if (dishIds.length > 0) {
      const { data: dishes } = await supabase
        .from('dishes')
        .select('id, name, category')
        .in('id', dishIds);
      
      if (dishes) {
        dishMap = dishes.reduce((acc, d) => {
          acc[d.id] = { name: d.name, category: d.category };
          return acc;
        }, {} as Record<string, { name: string; category: string | null }>);
      }
    }

    // Enrich items with dish details and table info
    const enrichedItems: TransactionItemWithDetails[] = (txItems || []).map(item => ({
      ...item,
      dish_name: item.dish_id ? dishMap[item.dish_id]?.name : undefined,
      dish_category: item.dish_id ? dishMap[item.dish_id]?.category || undefined : undefined
    }));

    setItems(enrichedItems);
    setLoading(false);
  }, [storeId, toast]);

  const getItemsByTransaction = useCallback((transactionId: string) => {
    return items.filter(i => i.transaction_id === transactionId);
  }, [items]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    getItemsByTransaction,
    refetch: fetchItems
  };
}

export function useTableSalesBreakdown(storeId: string | null) {
  const [breakdown, setBreakdown] = useState<TableSalesBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBreakdown = useCallback(async () => {
    if (!storeId) {
      setBreakdown([]);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's transactions with table info
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, table_id')
      .eq('store_id', storeId)
      .gte('date', today);

    if (txError) {
      toast({ title: 'Error fetching transactions', description: txError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!transactions || transactions.length === 0) {
      setBreakdown([]);
      setLoading(false);
      return;
    }

    // Get table names
    const tableIds = [...new Set(transactions.map(t => t.table_id).filter(Boolean))];
    let tableMap: Record<string, string> = {};
    
    if (tableIds.length > 0) {
      const { data: tables } = await supabase
        .from('restaurant_tables')
        .select('id, name, table_number')
        .in('id', tableIds);
      
      if (tables) {
        tableMap = tables.reduce((acc, t) => {
          acc[t.id] = t.name || `Mesa ${t.table_number}`;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    const transactionIds = transactions.map(t => t.id);

    // Get transaction items
    const { data: txItems, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .in('transaction_id', transactionIds);

    if (itemsError) {
      setLoading(false);
      return;
    }

    // Get dish details
    const dishIds = [...new Set((txItems || []).map(i => i.dish_id).filter(Boolean))];
    let dishMap: Record<string, { name: string; category: string | null }> = {};
    
    if (dishIds.length > 0) {
      const { data: dishes } = await supabase
        .from('dishes')
        .select('id, name, category')
        .in('id', dishIds);
      
      if (dishes) {
        dishMap = dishes.reduce((acc, d) => {
          acc[d.id] = { name: d.name, category: d.category };
          return acc;
        }, {} as Record<string, { name: string; category: string | null }>);
      }
    }

    // Build transaction to table mapping
    const txToTable: Record<string, string | null> = {};
    transactions.forEach(t => {
      txToTable[t.id] = t.table_id;
    });

    // Group items by table
    const tableGroups: Record<string, TransactionItemWithDetails[]> = {};
    
    (txItems || []).forEach(item => {
      const tableId = txToTable[item.transaction_id] || 'no-table';
      if (!tableGroups[tableId]) {
        tableGroups[tableId] = [];
      }
      tableGroups[tableId].push({
        ...item,
        dish_name: item.dish_id ? dishMap[item.dish_id]?.name : undefined,
        dish_category: item.dish_id ? dishMap[item.dish_id]?.category || undefined : undefined
      });
    });

    // Build breakdown
    const result: TableSalesBreakdown[] = Object.entries(tableGroups).map(([tableId, items]) => ({
      table_id: tableId,
      table_name: tableId === 'no-table' ? 'Sem Mesa' : (tableMap[tableId] || `Mesa ${tableId.slice(0, 8)}`),
      items,
      total: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
    }));

    // Sort by table name
    result.sort((a, b) => a.table_name.localeCompare(b.table_name));

    setBreakdown(result);
    setLoading(false);
  }, [storeId, toast]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return {
    breakdown,
    loading,
    refetch: fetchBreakdown
  };
}
