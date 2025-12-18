import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types matching our Supabase schema
export interface Store {
  id: string;
  name: string;
  location: string | null;
  manager_id: string | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  average_cost: number;
  category: string | null;
  created_at: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string | null;
  selling_price: number;
  image: string | null;
  cost_of_production: number;
  created_at: string;
}

export interface Recipe {
  id: string;
  dish_id: string;
  ingredient_id: string;
  quantity_required: number;
  created_at: string;
}

export interface StoreStock {
  id: string;
  store_id: string;
  ingredient_id: string;
  current_quantity: number;
  min_threshold: number;
  target_stock: number;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  store_id: string;
  table_number: number;
  name: string | null;
  is_occupied: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  total_amount: number;
  payment_method: string;
  staff_id: string | null;
  store_id: string;
  table_id: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  dish_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_system: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category_id: string | null;
  category: string | null;
  description: string | null;
  is_deducted: boolean;
  store_id: string;
  staff_id: string | null;
  ingredient_id: string | null;
  ingredient_quantity: number | null;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  ingredient_id: string;
  store_id: string;
  supplier_id: string | null;
  change_amount: number;
  purchase_price: number | null;
  unit_cost: number | null;
  date: string;
  reason: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
  created_at: string;
}

export interface SplitConfig {
  id: string;
  name: string;
  restock_percent: number;
  tax_percent: number;
  bank_percent: number;
  ops_percent: number;
  is_default: boolean;
  created_at: string;
}

export interface DailySummary {
  id: string;
  date: string;
  store_id: string;
  grand_total: number;
  salary_amount: number;
  salary_percent: number;
  restock_amount: number;
  restock_percent: number;
  tax_amount: number;
  tax_percent: number;
  misc_amount: number;
  misc_percent: number;
  net_profit: number;
  net_profit_percent: number;
  created_at: string;
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStores = useCallback(async () => {
    const { data, error } = await supabase.from('stores').select('*').order('name');
    if (error) {
      toast({ title: 'Error fetching stores', description: error.message, variant: 'destructive' });
    } else {
      setStores(data || []);
    }
    setLoading(false);
  }, [toast]);

  const addStore = async (name: string, location: string) => {
    const { data, error } = await supabase.from('stores').insert({ name, location }).select().single();
    if (error) {
      toast({ title: 'Error creating store', description: error.message, variant: 'destructive' });
      return null;
    }
    // Add default tables for the new store
    const tables = [1, 2, 3, 4].map(num => ({
      store_id: data.id,
      table_number: num,
      name: `Table ${num}`
    }));
    await supabase.from('restaurant_tables').insert(tables);
    setStores(prev => [...prev, data]);
    toast({ title: 'Store created successfully' });
    return data;
  };

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, addStore, refetch: fetchStores };
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIngredients = useCallback(async () => {
    const { data, error } = await supabase.from('ingredients').select('*').order('name');
    if (error) {
      toast({ title: 'Error fetching ingredients', description: error.message, variant: 'destructive' });
    } else {
      setIngredients(data || []);
    }
    setLoading(false);
  }, [toast]);

  const addIngredient = async (ingredient: { name: string; unit?: string; category?: string; average_cost?: number }) => {
    const { data, error } = await supabase.from('ingredients').insert([ingredient]).select().single();
    if (error) {
      toast({ title: 'Error adding ingredient', description: error.message, variant: 'destructive' });
      return null;
    }
    setIngredients(prev => [...prev, data]);
    toast({ title: 'Ingredient added successfully' });
    return data;
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const { error } = await supabase.from('ingredients').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating ingredient', description: error.message, variant: 'destructive' });
      return false;
    }
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return true;
  };

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return { ingredients, loading, addIngredient, updateIngredient, refetch: fetchIngredients };
}

export function useStoreStock(storeId: string | null) {
  const [stocks, setStocks] = useState<StoreStock[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStocks = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('store_stock')
      .select('*')
      .eq('store_id', storeId);
    if (error) {
      toast({ title: 'Error fetching stock', description: error.message, variant: 'destructive' });
    } else {
      setStocks(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const addStock = async (ingredientId: string, quantity: number, totalCost: number) => {
    if (!storeId) return null;
    
    const unitCost = quantity > 0 ? totalCost / quantity : 0;
    
    // Get current stock and ingredient
    const existingStock = stocks.find(s => s.ingredient_id === ingredientId);
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('average_cost')
      .eq('id', ingredientId)
      .single();
    
    if (existingStock) {
      // Calculate WAC
      const oldQuantity = existingStock.current_quantity;
      const oldCost = ingredient?.average_cost || 0;
      const newQuantity = oldQuantity + quantity;
      const newWAC = newQuantity > 0 
        ? ((oldQuantity * oldCost) + (quantity * unitCost)) / newQuantity 
        : unitCost;
      
      // Update stock quantity
      const { error } = await supabase
        .from('store_stock')
        .update({ current_quantity: newQuantity })
        .eq('id', existingStock.id);
      
      if (error) {
        toast({ title: 'Error updating stock', description: error.message, variant: 'destructive' });
        return null;
      }
      
      // Update ingredient WAC
      await supabase.from('ingredients').update({ average_cost: newWAC }).eq('id', ingredientId);
      
      // Log the inventory change
      await supabase.from('inventory_logs').insert({
        ingredient_id: ingredientId,
        store_id: storeId,
        change_amount: quantity,
        purchase_price: totalCost,
        unit_cost: unitCost,
        reason: 'purchase'
      });
      
      fetchStocks();
      toast({ title: 'Stock added', description: `Added ${quantity} units at ${unitCost.toFixed(2)} MT/unit` });
      return existingStock;
    } else {
      // Create new stock entry
      const { data, error } = await supabase
        .from('store_stock')
        .insert({ 
          store_id: storeId, 
          ingredient_id: ingredientId, 
          current_quantity: quantity,
          min_threshold: 10,
          target_stock: 100
        })
        .select()
        .single();
      
      if (error) {
        toast({ title: 'Error adding stock', description: error.message, variant: 'destructive' });
        return null;
      }
      
      // Update ingredient cost
      await supabase.from('ingredients').update({ average_cost: unitCost }).eq('id', ingredientId);
      
      // Log the inventory change
      await supabase.from('inventory_logs').insert({
        ingredient_id: ingredientId,
        store_id: storeId,
        change_amount: quantity,
        purchase_price: totalCost,
        unit_cost: unitCost,
        reason: 'purchase'
      });
      
      fetchStocks();
      toast({ title: 'Stock added successfully' });
      return data;
    }
  };

  const updateMinThreshold = async (stockId: string, minThreshold: number) => {
    const { error } = await supabase
      .from('store_stock')
      .update({ min_threshold: minThreshold })
      .eq('id', stockId);
    
    if (error) {
      toast({ title: 'Error updating threshold', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setStocks(prev => prev.map(s => s.id === stockId ? { ...s, min_threshold: minThreshold } : s));
    toast({ title: 'Threshold updated' });
    return true;
  };

  const deductStock = async (ingredientId: string, amount: number) => {
    const stock = stocks.find(s => s.ingredient_id === ingredientId);
    if (!stock) return false;
    
    const newQuantity = Math.max(0, stock.current_quantity - amount);
    const { error } = await supabase
      .from('store_stock')
      .update({ current_quantity: newQuantity })
      .eq('id', stock.id);
    
    if (error) return false;
    
    setStocks(prev => prev.map(s => 
      s.id === stock.id ? { ...s, current_quantity: newQuantity } : s
    ));
    
    return true;
  };

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return { stocks, loading, addStock, updateMinThreshold, deductStock, refetch: fetchStocks };
}

export function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDishes = useCallback(async () => {
    const { data, error } = await supabase.from('dishes').select('*').order('name');
    if (error) {
      toast({ title: 'Error fetching dishes', description: error.message, variant: 'destructive' });
    } else {
      setDishes(data || []);
    }
    setLoading(false);
  }, [toast]);

  const addDish = async (dish: { name: string; category?: string; selling_price: number; cost_of_production?: number }) => {
    const { data, error } = await supabase.from('dishes').insert([dish]).select().single();
    if (error) {
      toast({ title: 'Error adding dish', description: error.message, variant: 'destructive' });
      return null;
    }
    setDishes(prev => [...prev, data]);
    toast({ title: 'Dish added successfully' });
    return data;
  };

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  return { dishes, loading, addDish, refetch: fetchDishes };
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    const { data, error } = await supabase.from('recipes').select('*');
    if (error) {
      toast({ title: 'Error fetching recipes', description: error.message, variant: 'destructive' });
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  }, [toast]);

  const addRecipe = async (recipe: { dish_id: string; ingredient_id: string; quantity_required: number }) => {
    const { data, error } = await supabase.from('recipes').insert([recipe]).select().single();
    if (error) {
      toast({ title: 'Error adding recipe', description: error.message, variant: 'destructive' });
      return null;
    }
    setRecipes(prev => [...prev, data]);
    return data;
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, addRecipe, refetch: fetchRecipes };
}

export function useRestaurantTables(storeId: string | null) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTables = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('store_id', storeId)
      .order('table_number');
    if (error) {
      toast({ title: 'Error fetching tables', description: error.message, variant: 'destructive' });
    } else {
      setTables(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { tables, loading, refetch: fetchTables };
}

export function useTransactions(storeId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!storeId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', today)
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching transactions', description: error.message, variant: 'destructive' });
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const addTransaction = async (
    totalAmount: number,
    paymentMethod: string,
    tableId: string | null,
    items: { dishId: string; quantity: number; unitPrice: number }[]
  ) => {
    if (!storeId) return null;
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        store_id: storeId,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        table_id: tableId,
        date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating transaction', description: error.message, variant: 'destructive' });
      return null;
    }
    
    // Add transaction items
    const transactionItems = items.map(item => ({
      transaction_id: transaction.id,
      dish_id: item.dishId,
      quantity: item.quantity,
      unit_price: item.unitPrice
    }));
    
    await supabase.from('transaction_items').insert(transactionItems);
    
    setTransactions(prev => [transaction, ...prev]);
    return transaction;
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, addTransaction, refetch: fetchTransactions };
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    if (error) {
      toast({ title: 'Error fetching categories', description: error.message, variant: 'destructive' });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [toast]);

  const addCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ name, is_system: false })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setCategories(prev => [...prev, data]);
    toast({ title: 'Category created' });
    return data;
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, addCategory, refetch: fetchCategories };
}

export function useExpenses(storeId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching expenses', description: error.message, variant: 'destructive' });
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const addExpense = async (expense: { amount: number; category?: string; category_id?: string; description?: string; ingredient_id?: string; ingredient_quantity?: number }) => {
    if (!storeId) return null;
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, store_id: storeId, date: new Date().toISOString() }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating expense', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setExpenses(prev => [data, ...prev]);
    toast({ title: 'Expense recorded' });
    return data;
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, addExpense, refetch: fetchExpenses };
}

export function useSplitConfigs() {
  const [configs, setConfigs] = useState<SplitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfigs = useCallback(async () => {
    const { data, error } = await supabase
      .from('split_configs')
      .select('*')
      .order('name');
    if (error) {
      toast({ title: 'Error fetching configs', description: error.message, variant: 'destructive' });
    } else {
      setConfigs(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, loading, refetch: fetchConfigs };
}

export function useDailySummaries(storeId: string | null) {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSummaries = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching summaries', description: error.message, variant: 'destructive' });
    } else {
      setSummaries(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const saveSummary = async (summary: { 
    date: string; 
    grand_total: number; 
    salary_amount?: number; 
    salary_percent?: number;
    restock_amount?: number;
    restock_percent?: number;
    tax_amount?: number;
    tax_percent?: number;
    misc_amount?: number;
    misc_percent?: number;
    net_profit?: number;
    net_profit_percent?: number;
  }) => {
    if (!storeId) return null;
    
    const { data, error } = await supabase
      .from('daily_summaries')
      .upsert([{ ...summary, store_id: storeId }], { onConflict: 'date,store_id' })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error saving summary', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setSummaries(prev => {
      const existing = prev.findIndex(s => s.date === data.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data;
        return updated;
      }
      return [data, ...prev];
    });
    
    toast({ title: 'Allocation saved successfully' });
    return data;
  };

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return { summaries, loading, saveSummary, refetch: fetchSummaries };
}
