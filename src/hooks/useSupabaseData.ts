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
  is_processed: boolean;
  created_at: string;
}

export interface SubRecipe {
  id: string;
  name: string;
  processed_ingredient_id: string;
  created_at: string;
  sub_recipe_items: SubRecipeItem[]; // For convenience
}

export interface SubRecipeItem {
  id: string;
  sub_recipe_id: string;
  raw_ingredient_id: string;
  quantity_required: number;
  created_at: string;
}

export interface InventoryTransfer {
  id: string;
  from_store_id: string;
  to_store_id: string;
  ingredient_id: string;
  quantity: number;
  notes: string | null;
  transferred_at: string;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  store_id: string;
  processed_ingredient_id: string;
  quantity_produced: number;
  unit_cost: number;
  total_cost: number;
  produced_at: string;
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

  const deleteStore = async (storeId: string) => {
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) {
      toast({ title: 'Error deleting store', description: error.message, variant: 'destructive' });
      return false;
    }
    setStores(prev => prev.filter(s => s.id !== storeId));
    toast({ title: 'Store deleted successfully' });
    return true;
  };

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, addStore, deleteStore, refetch: fetchStores };
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

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting ingredient', description: error.message, variant: 'destructive' });
      return false;
    }
    setIngredients(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Ingredient deleted successfully' });
    return true;
  };

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return { ingredients, loading, addIngredient, updateIngredient, deleteIngredient, refetch: fetchIngredients };
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

  const addMultipleStock = async (items: { ingredientId: string; quantity: number; totalCost: number }[], storeId: string) => {
    if (!storeId || items.length === 0) return false;
    
    
    const stockUpdates: any[] = [];
    const stockInserts: any[] = [];
    const ingredientCostUpdates: any[] = [];
    const inventoryLogs: any[] = [];

    const ingredientIds = items.map(i => i.ingredientId);



    const { data: existingStocks, error: existingError } = await supabase
      .from('store_stock')
      .select('id, ingredient_id, current_quantity')
      .eq('store_id', storeId)
      .in('ingredient_id', items.map(i => i.ingredientId));

    if (existingError) {
      toast({ title: 'Error fetching existing stock', description: existingError.message, variant: 'destructive' });
      return false;
    }

    const { data: ingredientsData, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id, average_cost')
      .in('id', ingredientIds);

    if (ingredientsError) {
      toast({ title: 'Error fetching ingredients', description: ingredientsError.message, variant: 'destructive' });
      return false;
    }

    for (const item of items) {
      const unitCost = item.quantity > 0 ? item.totalCost / item.quantity : 0;
      const existingStock = existingStocks.find(s => s.ingredient_id === item.ingredientId);
      const ingredient = ingredientsData.find(i => i.id === item.ingredientId);

      if (existingStock && ingredient) {
        const oldQuantity = existingStock.current_quantity;
        const oldCost = ingredient.average_cost || 0;
        const newQuantity = oldQuantity + item.quantity;
        const newWAC = newQuantity > 0
          ? ((oldQuantity * oldCost) + (item.quantity * unitCost)) / newQuantity
          : unitCost;

        stockUpdates.push({ id: existingStock.id, store_id: storeId, ingredient_id: item.ingredientId, current_quantity: newQuantity });
        ingredientCostUpdates.push({ id: item.ingredientId, average_cost: newWAC });
      } else {
        // Delete this
        console.log('DEBUG - Creating NEW stock insert for ingredient:', item.ingredientId);
        console.log('DEBUG - store_id in insert object:', storeId);
        //Stop delete
        stockInserts.push({
          store_id: storeId,
          ingredient_id: item.ingredientId,
          current_quantity: item.quantity,
          min_threshold: 10,
          target_stock: 100
        });
        ingredientCostUpdates.push({ id: item.ingredientId, average_cost: unitCost });
      }

      inventoryLogs.push({
        ingredient_id: item.ingredientId,
        store_id: storeId,
        change_amount: item.quantity,
        purchase_price: item.totalCost,
        unit_cost: unitCost,
        reason: 'purchase'
      });
    }
    //Delete this
     console.log('DEBUG - stockUpdates array:', JSON.stringify(stockUpdates, null, 2));
     //Stop here
    if (stockUpdates.length > 0) {
     
      const { error } = await supabase.from('store_stock').upsert(stockUpdates);
      if (error) {
        //Delete this
        console.log('DEBUG - Error inserting stock:', error);
        console.log('DEBUG - Error details:', JSON.stringify(error, null, 2));
        //
        toast({ title: 'Error updating stock', description: error.message, variant: 'destructive' });
        return false;
      }
    }

    if (stockInserts.length > 0) {
      const { error } = await supabase.from('store_stock').insert(stockInserts);
      if (error) {
        toast({ title: 'Error creating stock', description: error.message, variant: 'destructive' });
        return false;
      }
    }
/*
    if (ingredientCostUpdates.length > 0) {
      const { error } = await supabase.from('ingredients').upsert(ingredientCostUpdates);
       if (error) {
        toast({ title: 'Error updating ingredient costs', description: error.message, variant: 'destructive' });
        return false;
      }
    }
*/

if (ingredientCostUpdates.length > 0) {
  for (const update of ingredientCostUpdates) {
    const { error } = await supabase
      .from('ingredients')
      .update({ average_cost: update.average_cost })
      .eq('id', update.id);
    
    if (error) {
      console.error(`Failed to update ingredient ${update.id}:`, error);
      // Continue with other updates
    }
  }
}
    if (inventoryLogs.length > 0) {
      const { error } = await supabase.from('inventory_logs').insert(inventoryLogs);
       if (error) {
        toast({ title: 'Error creating inventory logs', description: error.message, variant: 'destructive' });
        return false;
      }
    }

    fetchStocks();
    toast({ title: 'Stock updated', description: `${items.length} items have been restocked.` });
    return true;
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

  const updateTargetStock = async (stockId: string, targetStock: number) => {
    const { error } = await supabase
      .from('store_stock')
      .update({ target_stock: targetStock })
      .eq('id', stockId);
    
    if (error) {
      toast({ title: 'Error updating target stock', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setStocks(prev => prev.map(s => s.id === stockId ? { ...s, target_stock: targetStock } : s));
    toast({ title: 'Target stock updated' });
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

  return { stocks, loading, addStock, addMultipleStock, updateMinThreshold, updateTargetStock, deductStock, refetch: fetchStocks };
}

// Inventory Logs hook for fetching last unit costs
export function useInventoryLogs(storeId: string | null) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('store_id', storeId)
      .eq('reason', 'purchase')
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching inventory logs', description: error.message, variant: 'destructive' });
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const getLastUnitCost = (ingredientId: string) => {
    const log = logs.find(l => l.ingredient_id === ingredientId);
    return log?.unit_cost ?? null;
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, getLastUnitCost, refetch: fetchLogs };
}
// Delete this
export const testStoreStockInsert = async (storeId: string, ingredientId: string) => {
  console.log('TEST - storeId:', storeId, 'ingredientId:', ingredientId);
  
  const testData = {
    store_id: storeId,
    ingredient_id: ingredientId,
    current_quantity: 10,
    min_threshold: 10,
    target_stock: 100
  };
  
  console.log('TEST - Inserting:', testData);
  
  const { error } = await supabase.from('store_stock').insert([testData]);
  
  if (error) {
    console.log('TEST - ERROR:', error);
    return false;
  } else {
    console.log('TEST - SUCCESS');
    return true;
  }
};
//Stop here
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

  const createConfig = async (config: { name: string; tax_percent?: number; bank_percent?: number; restock_percent?: number; ops_percent?: number; is_default?: boolean }) => {
    const { data, error } = await supabase
      .from('split_configs')
      .insert([config])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating config', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setConfigs(prev => [...prev, data]);
    toast({ title: 'Configuration created' });
    return data;
  };

  const updateConfig = async (id: string, updates: Partial<SplitConfig>) => {
    const { error } = await supabase
      .from('split_configs')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error updating config', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase
      .from('split_configs')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting config', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setConfigs(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Configuration deleted' });
    return true;
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, loading, createConfig, updateConfig, deleteConfig, refetch: fetchConfigs };
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

// Credits hook for debt tracking
export interface Credit {
  id: string;
  store_id: string;
  customer_name: string;
  sale_amount: number;
  transaction_id: string | null;
  date: string;
  status: 'unsettled' | 'settled';
  settled_at: string | null;
  created_at: string;
}

export function useCredits(storeId: string | null) {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCredits = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching credits', description: error.message, variant: 'destructive' });
    } else {
      setCredits((data as Credit[]) || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const addCredit = async (credit: { customer_name: string; sale_amount: number; transaction_id?: string }) => {
    if (!storeId) return null;
    
    const { data, error } = await supabase
      .from('credits')
      .insert([{ ...credit, store_id: storeId }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating credit', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setCredits(prev => [data as Credit, ...prev]);
    return data;
  };

  const settleCredit = async (creditId: string) => {
    const { error } = await supabase
      .from('credits')
      .update({ status: 'settled', settled_at: new Date().toISOString() })
      .eq('id', creditId);
    
    if (error) {
      toast({ title: 'Error settling credit', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setCredits(prev => prev.map(c => 
      c.id === creditId ? { ...c, status: 'settled' as const, settled_at: new Date().toISOString() } : c
    ));
    toast({ title: 'Credit marked as settled' });
    return true;
  };

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, loading, addCredit, settleCredit, refetch: fetchCredits };
}

// Allocation Categories hook
export interface AllocationCategory {
  id: string;
  name: string;
  percent: number;
  icon: string;
  color: string;
  display_order: number;
  is_system: boolean;
  created_at: string;
}

export function useAllocationCategories() {
  const [categories, setCategories] = useState<AllocationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('allocation_categories')
      .select('*')
      .order('display_order');
    if (error) {
      toast({ title: 'Error fetching allocation categories', description: error.message, variant: 'destructive' });
    } else {
      setCategories((data as AllocationCategory[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addCategory = async (category: { name: string; percent?: number; color?: string }) => {
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.display_order), 0);
    const { data, error } = await supabase
      .from('allocation_categories')
      .insert([{ ...category, display_order: maxOrder + 1, is_system: false }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setCategories(prev => [...prev, data as AllocationCategory].sort((a, b) => a.display_order - b.display_order));
    toast({ title: 'Category created' });
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<AllocationCategory>) => {
    const { error } = await supabase
      .from('allocation_categories')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('allocation_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Category deleted' });
    return true;
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetchCategories };
}

// Restaurant Tables hook with add/delete
export function useRestaurantTablesManagement(storeId: string | null) {
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

  const addTable = async () => {
    if (!storeId) return null;
    const maxNumber = tables.reduce((max, t) => Math.max(max, t.table_number), 0);
    const newNumber = maxNumber + 1;
    
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert([{ store_id: storeId, table_number: newNumber, name: `Table ${newNumber}` }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error adding table', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setTables(prev => [...prev, data].sort((a, b) => a.table_number - b.table_number));
    toast({ title: `Table ${newNumber} added` });
    return data;
  };

  const deleteTable = async (tableId: string) => {
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', tableId);
    
    if (error) {
      toast({ title: 'Error deleting table', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setTables(prev => prev.filter(t => t.id !== tableId));
    toast({ title: 'Table removed' });
    return true;
  };

  const initializeTables = async (count: number = 15) => {
    if (!storeId) return;
    
    // Check if tables already exist
    if (tables.length >= count) return;
    
    const tablesToCreate = [];
    for (let i = tables.length + 1; i <= count; i++) {
      tablesToCreate.push({
        store_id: storeId,
        table_number: i,
        name: `Table ${i}`
      });
    }
    
    if (tablesToCreate.length > 0) {
      const { error } = await supabase
        .from('restaurant_tables')
        .insert(tablesToCreate);
      
      if (!error) {
        fetchTables();
      }
    }
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { tables, loading, addTable, deleteTable, initializeTables, refetch: fetchTables };
}

// Inventory Transfers hook
export function useInventoryTransfers() {
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransfers = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory_transfers')
      .select('*')
      .order('transferred_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching transfers', description: error.message, variant: 'destructive' });
    } else {
      setTransfers(data || []);
    }
    setLoading(false);
  }, [toast]);

  const createBulkTransfer = async (
    fromStoreId: string,
    toStoreId: string,
    items: { ingredientId: string; quantity: number }[],
    notes?: string
  ) => {
    const ingredientIds = items.map(item => item.ingredientId);

    // Fetch all relevant stocks in one go
    const { data: allStocks, error: stockError } = await supabase
      .from('store_stock')
      .select('*')
      .in('store_id', [fromStoreId, toStoreId])
      .in('ingredient_id', ingredientIds);

    if (stockError) {
      toast({ title: 'Error fetching stock data', description: stockError.message, variant: 'destructive' });
      return null;
    }

    // Validate stock levels
    for (const item of items) {
      const sourceStock = allStocks.find(s => s.store_id === fromStoreId && s.ingredient_id === item.ingredientId);
      if (!sourceStock || sourceStock.current_quantity < item.quantity) {
        toast({
          title: 'Insufficient Stock',
          description: `Not enough stock for item ID ${item.ingredientId}. Available: ${sourceStock?.current_quantity || 0}, Required: ${item.quantity}`,
          variant: 'destructive',
        });
        return null;
      }
    }

    const sourceStockUpdates: any[] = [];
    const destStockUpdates: any[] = [];
    const destStockInserts: any[] = [];
    const inventoryLogs: any[] = [];
    const transferRecords: any[] = [];

    for (const item of items) {
      const sourceStock = allStocks.find(s => s.store_id === fromStoreId && s.ingredient_id === item.ingredientId)!;
      sourceStockUpdates.push({
        id: sourceStock.id,
        current_quantity: sourceStock.current_quantity - item.quantity,
      });

      const destStock = allStocks.find(s => s.store_id === toStoreId && s.ingredient_id === item.ingredientId);
      if (destStock) {
        destStockUpdates.push({
          id: destStock.id,
          current_quantity: destStock.current_quantity + item.quantity,
        });
      } else {
        destStockInserts.push({
          store_id: toStoreId,
          ingredient_id: item.ingredientId,
          current_quantity: item.quantity,
          min_threshold: 10,
          target_stock: 100,
        });
      }

      inventoryLogs.push(
        { ingredient_id: item.ingredientId, store_id: fromStoreId, change_amount: -item.quantity, reason: 'transfer_out' },
        { ingredient_id: item.ingredientId, store_id: toStoreId, change_amount: item.quantity, reason: 'transfer_in' }
      );

      transferRecords.push({
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        notes,
      });
    }

    // Execute all updates
    const { error: sourceUpdateError } = await supabase.from('store_stock').upsert(sourceStockUpdates);
    if (sourceUpdateError) {
      toast({ title: 'Error deducting stock', description: sourceUpdateError.message, variant: 'destructive' });
      return null;
    }

    const { error: destUpdateError } = await supabase.from('store_stock').upsert(destStockUpdates);
    if (destUpdateError) {
      toast({ title: 'Error updating destination stock', description: destUpdateError.message, variant: 'destructive' });
      // Potentially roll back source updates here
      return null;
    }

    if (destStockInserts.length > 0) {
      const { error: destInsertError } = await supabase.from('store_stock').insert(destStockInserts);
      if (destInsertError) {
        toast({ title: 'Error creating new stock entries', description: destInsertError.message, variant: 'destructive' });
        return null;
      }
    }

    const { error: logError } = await supabase.from('inventory_logs').insert(inventoryLogs);
    if (logError) {
      toast({ title: 'Error creating inventory logs', description: logError.message, variant: 'destructive' });
      return null;
    }

    const { data: newTransfers, error: transferError } = await supabase.from('inventory_transfers').insert(transferRecords).select();
    if (transferError) {
      toast({ title: 'Error recording transfers', description: transferError.message, variant: 'destructive' });
      return null;
    }

    setTransfers(prev => [...newTransfers, ...prev]);
    toast({ title: 'Bulk transfer successful', description: `${items.length} items transferred.` });
    return newTransfers;
  };

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return { transfers, loading, createTransfer: createBulkTransfer, refetch: fetchTransfers };
}

// Sub-Recipes hook - uses ingredient_recipes table
export interface IngredientRecipe {
  id: string;
  processed_ingredient_id: string;
  raw_ingredient_id: string;
  quantity_required: number;
  created_at: string;
}

export function useSubRecipes() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubRecipes = useCallback(async () => {
    setLoading(true);
    // Get all ingredient recipes and group by processed_ingredient_id
    const { data, error } = await supabase
      .from('ingredient_recipes')
      .select('*')
      .order('created_at');

    if (error) {
      toast({ title: 'Error fetching sub-recipes', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Group recipes by processed_ingredient_id
    const groupedRecipes = (data || []).reduce((acc, item) => {
      const key = item.processed_ingredient_id;
      if (!acc[key]) {
        acc[key] = {
          id: key, // Use processed_ingredient_id as the "sub-recipe" id
          name: '', // Will be filled from ingredient name
          processed_ingredient_id: key,
          created_at: item.created_at,
          sub_recipe_items: []
        };
      }
      acc[key].sub_recipe_items.push({
        id: item.id,
        sub_recipe_id: key,
        raw_ingredient_id: item.raw_ingredient_id,
        quantity_required: item.quantity_required,
        created_at: item.created_at
      });
      return acc;
    }, {} as Record<string, SubRecipe>);

    setSubRecipes(Object.values(groupedRecipes));
    setLoading(false);
  }, [toast]);

  const saveSubRecipe = async (
    recipe: { id?: string; name: string; processed_ingredient_id: string; },
    items: { raw_ingredient_id: string; quantity_required: number }[]
  ) => {
    const processedIngredientId = recipe.processed_ingredient_id;

    // Delete existing recipes for this processed ingredient
    await supabase
      .from('ingredient_recipes')
      .delete()
      .eq('processed_ingredient_id', processedIngredientId);

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('ingredient_recipes').insert(
        items.map(item => ({
          processed_ingredient_id: processedIngredientId,
          raw_ingredient_id: item.raw_ingredient_id,
          quantity_required: item.quantity_required,
        }))
      );

      if (itemsError) {
        toast({ title: 'Error saving sub-recipe items', description: itemsError.message, variant: 'destructive' });
        return null;
      }
    }

    toast({ title: 'Sub-recipe saved successfully' });
    fetchSubRecipes();
    return processedIngredientId;
  };

  const deleteSubRecipe = async (processedIngredientId: string) => {
    const { error } = await supabase
      .from('ingredient_recipes')
      .delete()
      .eq('processed_ingredient_id', processedIngredientId);
    if (error) {
      toast({ title: 'Error deleting sub-recipe', description: error.message, variant: 'destructive' });
      return false;
    }
    setSubRecipes(prev => prev.filter(r => r.processed_ingredient_id !== processedIngredientId));
    toast({ title: 'Sub-recipe deleted successfully' });
    return true;
  };

  useEffect(() => {
    fetchSubRecipes();
  }, [fetchSubRecipes]);

  return { subRecipes, loading, saveSubRecipe, deleteSubRecipe, refetch: fetchSubRecipes };
}

// Production Logs hook
export function useProductionLogs(storeId: string | null) {
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProductionLogs = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('production_logs')
      .select('*')
      .eq('store_id', storeId)
      .order('produced_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching production logs', description: error.message, variant: 'destructive' });
    } else {
      setProductionLogs(data || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const processBatch = async (
    subRecipeId: string,
    quantityToProduce: number,
    ingredients: Ingredient[],
    stocks: StoreStock[]
  ) => {
    if (!storeId) return null;

    // Get the sub-recipe items for this processed ingredient from ingredient_recipes
    const { data: recipeItems, error: recipeError } = await supabase
      .from('ingredient_recipes')
      .select('*')
      .eq('processed_ingredient_id', subRecipeId);

    if (recipeError) {
      toast({
        title: 'Recipe not found',
        description: 'The selected sub-recipe could not be found.',
        variant: 'destructive'
      });
      return null;
    }
    
    if (!recipeItems || recipeItems.length === 0) {
      toast({ 
        title: 'No recipe found', 
        description: 'This ingredient has no sub-recipe defined.', 
        variant: 'destructive' 
      });
      return null;
    }

    // Calculate required raw materials and check availability
    let totalCost = 0;
    const rawMaterialsNeeded: { ingredientId: string; quantity: number; cost: number; stockId: string }[] = [];

    for (const item of recipeItems) {
      const requiredQty = item.quantity_required * quantityToProduce;
      const stock = stocks.find(s => s.ingredient_id === item.raw_ingredient_id);
      const ingredient = ingredients.find(i => i.id === item.raw_ingredient_id);

      if (!stock || stock.current_quantity < requiredQty) {
        toast({ 
          title: 'Insufficient raw materials', 
          description: `Not enough ${ingredient?.name || 'ingredient'} in stock. Need ${requiredQty}, have ${stock?.current_quantity || 0}.`, 
          variant: 'destructive' 
        });
        return null;
      }

      const cost = requiredQty * (ingredient?.average_cost || 0);
      totalCost += cost;
      rawMaterialsNeeded.push({ 
        ingredientId: item.raw_ingredient_id,
        quantity: requiredQty, 
        cost,
        stockId: stock.id
      });
    }

    // Deduct raw materials from stock
    for (const material of rawMaterialsNeeded) {
      const stock = stocks.find(s => s.id === material.stockId);
      if (stock) {
        await supabase
          .from('store_stock')
          .update({ current_quantity: stock.current_quantity - material.quantity })
          .eq('id', material.stockId);
      }
    }

    // Add processed ingredient to stock - subRecipeId IS the processed_ingredient_id
    const processedIngredientId = subRecipeId;
    const processedStock = stocks.find(s => s.ingredient_id === processedIngredientId);
    if (processedStock) {
      await supabase
        .from('store_stock')
        .update({ current_quantity: processedStock.current_quantity + quantityToProduce })
        .eq('id', processedStock.id);
    } else {
      await supabase
        .from('store_stock')
        .insert({
          store_id: storeId,
          ingredient_id: processedIngredientId,
          current_quantity: quantityToProduce,
          min_threshold: 10,
          target_stock: 100
        });
    }

    // Update average cost of processed ingredient (WAC)
    const processedIngredient = ingredients.find(i => i.id === processedIngredientId);
    const oldQty = processedStock?.current_quantity || 0;
    const oldCost = processedIngredient?.average_cost || 0;
    const unitCost = quantityToProduce > 0 ? totalCost / quantityToProduce : 0;
    const newQty = oldQty + quantityToProduce;
    const newWAC = newQty > 0 ? ((oldQty * oldCost) + (quantityToProduce * unitCost)) / newQty : unitCost;
    
    await supabase.from('ingredients').update({ average_cost: newWAC }).eq('id', processedIngredientId);

    // Create production log
    const { data: log, error } = await supabase
      .from('production_logs')
      .insert({
        store_id: storeId,
        processed_ingredient_id: processedIngredientId,
        quantity_produced: quantityToProduce,
        unit_cost: unitCost,
        total_cost: totalCost
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error logging production', description: error.message, variant: 'destructive' });
      return null;
    }

    // Log production items
    await supabase.from('production_log_items').insert(
      rawMaterialsNeeded.map(m => ({
        production_log_id: log.id,
        raw_ingredient_id: m.ingredientId,
        quantity_used: m.quantity,
        unit_cost: (ingredients.find(i => i.id === m.ingredientId)?.average_cost || 0)
      }))
    );

    // Log inventory changes
    const inventoryLogs = [
      ...rawMaterialsNeeded.map(m => ({
        ingredient_id: m.ingredientId,
        store_id: storeId,
        change_amount: -m.quantity,
        reason: 'production_consumed'
      })),
      {
        ingredient_id: processedIngredientId,
        store_id: storeId,
        change_amount: quantityToProduce,
        reason: 'production_output'
      }
    ];
    await supabase.from('inventory_logs').insert(inventoryLogs);

    setProductionLogs(prev => [log, ...prev]);
    toast({ title: 'Batch processed successfully', description: `Produced ${quantityToProduce} units at ${unitCost.toFixed(2)} MT/unit` });
    return log;
  };

  useEffect(() => {
    fetchProductionLogs();
  }, [fetchProductionLogs]);

  return { productionLogs, loading, processBatch, refetch: fetchProductionLogs };
}
