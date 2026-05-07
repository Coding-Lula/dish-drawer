import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for Financial Tracking System
export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  display_order: number;
  created_at: string;
  payment_methods?: string[];
  is_default_for_cash?: boolean;
  is_default_for_mobile?: boolean;
  is_default_for_bank?: boolean;
  source_type?: string;
}

export interface IncomeAllocation {
  id: string;
  store_id: string;
  source_id: string;
  amount: number;
  date: string;
  transaction_id: string | null;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
  payment_method?: string;
  is_auto_allocated?: boolean;
}

export interface ExpenseParentCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface ExpenseCategoryWithParent {
  id: string;
  name: string;
  parent_id: string | null;
  monthly_budget: number;
  display_order: number;
  is_system: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  store_id: string;
  date: string;
  type: 'expense' | 'transfer' | 'income';
  amount: number;
  supplier: string | null;
  invoice_no: string | null;
  description: string | null;
  source_id: string | null;
  expense_category_id: string | null;
  transfer_to_source_id: string | null;
  transfer_to_store_id: string | null;
  is_recurring: boolean;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
}

export interface MonthLock {
  id: string;
  store_id: string;
  year: number;
  month: number;
  locked_at: string;
  locked_by: string | null;
  notes: string | null;
  created_at: string;
}

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

export interface MonthlyBudget {
  id: string;
  store_id: string;
  expense_category_id: string;
  year: number;
  month: number;
  budget_amount: number;
  created_at: string;
}

// Income Sources Hook
export function useIncomeSources() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSources = useCallback(async () => {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .order('display_order');
    if (error) {
      toast({ title: 'Error fetching income sources', description: error.message, variant: 'destructive' });
    } else {
      setSources((data as IncomeSource[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addSource = async (source: { name: string; icon?: string; color?: string, payment_methods?: string[] }) => {
    const maxOrder = sources.reduce((max, s) => Math.max(max, s.display_order), 0);
    const { data, error } = await supabase
      .from('income_sources')
      .insert([{ ...source, display_order: maxOrder + 1, is_default: false }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating source', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setSources(prev => [...prev, data as IncomeSource]);
    toast({ title: 'Income source created' });
    return data;
  };

  const updateSource = async (id: string, updates: Partial<IncomeSource>) => {
    const { error } = await supabase
      .from('income_sources')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error updating source', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteSource = async (id: string) => {
    const { error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting source', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setSources(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Income source deleted' });
    return true;
  };

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return { sources, loading, addSource, updateSource, deleteSource, refetch: fetchSources };
}

// Income Allocations Hook
export function useIncomeAllocations(storeId: string | null) {
  const [allocations, setAllocations] = useState<IncomeAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllocations = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('income_allocations')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching allocations', description: error.message, variant: 'destructive' });
    } else {
      setAllocations((data as IncomeAllocation[]) || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const addAllocation = async (allocation: { source_id: string; amount: number; date?: string }) => {
    if (!storeId) return null;
    const { data, error } = await supabase
      .from('income_allocations')
      .insert([{ ...allocation, store_id: storeId }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating allocation', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setAllocations(prev => [data as IncomeAllocation, ...prev]);
    return data;
  };

  const addBatchAllocations = async (allocations: { source_id: string; amount: number; date?: string }[]) => {
    if (!storeId) return null;
    const { data, error } = await supabase
      .from('income_allocations')
      .insert(allocations.map(a => ({ ...a, store_id: storeId })))
      .select();
    
    if (error) {
      toast({ title: 'Error creating allocations', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setAllocations(prev => [...(data as IncomeAllocation[]), ...prev]);
    toast({ title: 'Income allocated successfully' });
    return data;
  };

  // Get totals by source for a date range
  const getSourceTotals = (startDate?: string, endDate?: string) => {
    let filtered = allocations;
    if (startDate) filtered = filtered.filter(a => a.date >= startDate);
    if (endDate) filtered = filtered.filter(a => a.date <= endDate);
    
    return filtered.reduce((acc, a) => {
      acc[a.source_id] = (acc[a.source_id] || 0) + Number(a.amount);
      return acc;
    }, {} as Record<string, number>);
  };

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return { allocations, loading, addAllocation, addBatchAllocations, getSourceTotals, refetch: fetchAllocations };
}

// Expense Parent Categories Hook
export function useExpenseParentCategories() {
  const [parentCategories, setParentCategories] = useState<ExpenseParentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchParentCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_parent_categories')
      .select('*')
      .order('display_order');
    if (error) {
      toast({ title: 'Error fetching parent categories', description: error.message, variant: 'destructive' });
    } else {
      setParentCategories((data as ExpenseParentCategory[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addParentCategory = async (name: string) => {
    const maxOrder = parentCategories.reduce((max, c) => Math.max(max, c.display_order), 0);
    const { data, error } = await supabase
      .from('expense_parent_categories')
      .insert([{ name, display_order: maxOrder + 1 }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setParentCategories(prev => [...prev, data as ExpenseParentCategory]);
    toast({ title: 'Parent category created' });
    return data;
  };

  const updateParentCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from('expense_parent_categories')
      .update({ name })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setParentCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    return true;
  };

  const deleteParentCategory = async (id: string) => {
    const { error } = await supabase
      .from('expense_parent_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setParentCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Parent category deleted' });
    return true;
  };

  useEffect(() => {
    fetchParentCategories();
  }, [fetchParentCategories]);

  return { parentCategories, loading, addParentCategory, updateParentCategory, deleteParentCategory, refetch: fetchParentCategories };
}

// Expense Categories with Parent Hook
export function useExpenseCategoriesWithParent() {
  const [categories, setCategories] = useState<ExpenseCategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('display_order');
    if (error) {
      toast({ title: 'Error fetching categories', description: error.message, variant: 'destructive' });
    } else {
      setCategories((data as ExpenseCategoryWithParent[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const addCategory = async (category: { name: string; parent_id: string; monthly_budget?: number }) => {
    const maxOrder = categories.filter(c => c.parent_id === category.parent_id).reduce((max, c) => Math.max(max, c.display_order), 0);
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ ...category, display_order: maxOrder + 1, is_system: false }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setCategories(prev => [...prev, data as ExpenseCategoryWithParent]);
    toast({ title: 'Category created' });
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<ExpenseCategoryWithParent>) => {
    const { error } = await supabase
      .from('expense_categories')
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
      .from('expense_categories')
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

// Financial Transactions Hook
export function useFinancialTransactions(storeId: string | null, startDate?: string, endDate?: string) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    let query = supabase.from('financial_transactions').select('*');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00`;
      query = query.gte('date', start);
    }

    if (endDate) {
      const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`;
      query = query.lte('date', end);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching transactions', description: error.message, variant: 'destructive' });
    } else {
      setTransactions((data as FinancialTransaction[]) || []);
    }
    setLoading(false);
  }, [storeId, startDate, endDate, toast]);

  const addTransaction = async (transaction: {
    date?: string;
    type: 'expense' | 'transfer' | 'income';
    amount: number;
    supplier?: string;
    invoice_no?: string;
    description?: string;
    source_id?: string;
    expense_category_id?: string;
    transfer_to_source_id?: string;
    transfer_to_store_id?: string;
    is_recurring?: boolean;
    store_id?: string;
  }) => {
    const finalStoreId = transaction.store_id || storeId;
    if (!finalStoreId) return null;
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([{ ...transaction, store_id: finalStoreId }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating transaction', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setTransactions(prev => [data as FinancialTransaction, ...prev]);
    toast({ title: 'Transaction recorded' });
    return data;
  };

  const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
    const { error } = await supabase
      .from('financial_transactions')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error updating transaction', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting transaction', description: error.message, variant: 'destructive' });
      return false;
    }
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Transaction deleted' });
    return true;
  };

  // Get expenses by category for a date range
  const getExpensesByCategory = (startDate?: string, endDate?: string) => {
    let filtered = transactions.filter(t => t.type === 'expense');
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);
    
    return filtered.reduce((acc, t) => {
      const key = t.expense_category_id || 'uncategorized';
      acc[key] = (acc[key] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  };

  // Get expenses by source for a date range
  const getExpensesBySource = (startDate?: string, endDate?: string) => {
    let filtered = transactions.filter(t => t.type === 'expense');
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);
    
    return filtered.reduce((acc, t) => {
      const key = t.source_id || 'unknown';
      acc[key] = (acc[key] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { 
    transactions, 
    loading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    getExpensesByCategory,
    getExpensesBySource,
    refetch: fetchTransactions 
  };
}

// Month Locks Hook
export function useMonthLocks(storeId: string | null) {
  const [locks, setLocks] = useState<MonthLock[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocks = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('month_locks')
      .select('*')
      .eq('store_id', storeId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching locks', description: error.message, variant: 'destructive' });
    } else {
      setLocks((data as MonthLock[]) || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const lockMonth = async (year: number, month: number, lockedBy?: string, notes?: string) => {
    if (!storeId) return null;
    
    // First, lock all transactions for this month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    await supabase
      .from('financial_transactions')
      .update({ is_locked: true, locked_at: new Date().toISOString() })
      .eq('store_id', storeId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    const { data, error } = await supabase
      .from('month_locks')
      .insert([{ store_id: storeId, year, month, locked_by: lockedBy, notes }])
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error locking month', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setLocks(prev => [data as MonthLock, ...prev]);
    toast({ title: `${getMonthName(month)} ${year} locked successfully` });
    return data;
  };

  const isMonthLocked = (year: number, month: number) => {
    return locks.some(l => l.year === year && l.month === month);
  };

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  return { locks, loading, lockMonth, isMonthLocked, refetch: fetchLocks };
}

// Monthly Budgets Hook
export function useMonthlyBudgets(storeId: string | null) {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBudgets = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('store_id', storeId);
    if (error) {
      toast({ title: 'Error fetching budgets', description: error.message, variant: 'destructive' });
    } else {
      setBudgets((data as MonthlyBudget[]) || []);
    }
    setLoading(false);
  }, [storeId, toast]);

  const setBudget = async (expenseCategoryId: string, year: number, month: number, amount: number) => {
    if (!storeId) return null;
    const { data, error } = await supabase
      .from('monthly_budgets')
      .upsert([{ 
        store_id: storeId, 
        expense_category_id: expenseCategoryId, 
        year, 
        month, 
        budget_amount: amount 
      }], { onConflict: 'store_id,expense_category_id,year,month' })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error setting budget', description: error.message, variant: 'destructive' });
      return null;
    }
    
    setBudgets(prev => {
      const existing = prev.findIndex(b => 
        b.expense_category_id === expenseCategoryId && b.year === year && b.month === month
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data as MonthlyBudget;
        return updated;
      }
      return [...prev, data as MonthlyBudget];
    });
    
    return data;
  };

  const getBudget = (expenseCategoryId: string, year: number, month: number) => {
    return budgets.find(b => 
      b.expense_category_id === expenseCategoryId && b.year === year && b.month === month
    )?.budget_amount || 0;
  };

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, loading, setBudget, getBudget, refetch: fetchBudgets };
}

// Allocation Categories hook
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

// Helper function
function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}
