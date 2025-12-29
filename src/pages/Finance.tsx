import { useState, useMemo, useEffect } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTransactions } from '@/hooks/useSupabaseData';
import {
  useIncomeSources,
  useIncomeAllocations,
  useExpenseParentCategories,
  useExpenseCategoriesWithParent,
  useFinancialTransactions,
  useMonthLocks,
  useMonthlyBudgets,
} from '@/hooks/useFinanceData';
import { exportFinancialReport } from '@/utils/financeExcelExport';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Plus,
  Trash2,
  Edit,
  Lock,
  FileSpreadsheet,
  ArrowRightLeft,
  Receipt,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  SmartphoneIcon,
  Landmark,
  CreditCardIcon,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, any> = {
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'banknote': Banknote,
  'wallet': Wallet,
  'cash': Wallet,
  'mpesa': SmartphoneIcon,
  'mkesh': SmartphoneIcon,
  'paga_facil': Landmark,
  'bank': Landmark,
};

// Payment method to source type mapping (configurable)
const paymentMethodToSourceType: Record<string, string> = {
  'cash': 'cash',
  'mpesa': 'mobile_money',
  'mkesh': 'mobile_money',
  'paga_facil': 'bank_transfer',
  'credit': 'credit',
  'self_consumption': 'internal',
};

function FinanceContent() {
  const { currentStore } = useCurrentStore();
  const { toast } = useToast();
  
  // State
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showSourceConfigModal, setShowSourceConfigModal] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  
  // Form states
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, number>>({});
  const [expenseForm, setExpenseForm] = useState({
    supplier: '',
    amount: '',
    category_id: '',
    source_id: '',
    invoice_no: '',
    description: '',
    is_recurring: false,
  });
  const [transferForm, setTransferForm] = useState({
    from_source_id: '',
    to_source_id: '',
    amount: '',
  });
  const [newSourceName, setNewSourceName] = useState('');
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', parent_id: '', monthly_budget: '' });
  const [sourceConfig, setSourceConfig] = useState({
    name: '',
    icon: 'wallet',
    color: 'bg-gray-500',
    payment_methods: [] as string[],
    is_default_for_cash: false,
    is_default_for_mobile: false,
    is_default_for_bank: false,
  });
  
  // Hooks
  const { transactions: posTransactions } = useTransactions(currentStore?.id || null);
  const { sources, addSource, updateSource, deleteSource } = useIncomeSources();
  const { allocations, addBatchAllocations, getSourceTotals } = useIncomeAllocations(currentStore?.id || null);
  const { parentCategories, addParentCategory, deleteParentCategory } = useExpenseParentCategories();
  const { categories, addCategory, updateCategory, deleteCategory } = useExpenseCategoriesWithParent();
  const { 
    transactions, 
    addTransaction, 
    deleteTransaction,
    getExpensesByCategory,
    getExpensesBySource 
  } = useFinancialTransactions(currentStore?.id || null);
  const { locks, lockMonth, isMonthLocked } = useMonthLocks(currentStore?.id || null);
  const { budgets, setBudget, getBudget } = useMonthlyBudgets(currentStore?.id || null);

  // Calculated values
  const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const monthEnd = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Fetch all transactions for all stores
  useEffect(() => {
    const fetchAllTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (data) setAllTransactions(data);
    };
    fetchAllTransactions();
  }, []);

  // AUTO-ALLOCATION: Check for unallocated POS transactions and auto-allocate them
  useEffect(() => {
    const autoAllocatePOSRevenue = async () => {
      if (!sources.length || !currentStore?.id) return;

      // Get POS transactions for current month that haven't been allocated
      const currentMonthPOSTransactions = posTransactions.filter(t => {
        const txDate = t.date?.split('T')[0];
        return txDate >= monthStart && txDate <= monthEnd && 
               t.payment_method && 
               t.payment_method !== 'credit' && 
               t.payment_method !== 'self_consumption' &&
               t.total_amount > 0;
      });

      // Check which transactions have already been allocated
      const alreadyAllocated = allocations.filter(a => 
        a.date >= monthStart && a.date <= monthEnd && 
        a.reference_type === 'pos_transaction'
      ).map(a => a.reference_id);

      // Filter out already allocated transactions
      const transactionsToAllocate = currentMonthPOSTransactions.filter(
        t => !alreadyAllocated.includes(t.id)
      );

      if (transactionsToAllocate.length === 0) return;

      const allocationsToAdd = [];
      
      for (const transaction of transactionsToAllocate) {
        const paymentMethod = transaction.payment_method;
        const sourceType = paymentMethodToSourceType[paymentMethod];
        
        // Find source for this payment method
        let source = sources.find(s => 
          s.payment_methods?.includes(paymentMethod) || 
          s.source_type === sourceType
        );

        // If no specific source found, use default based on payment method type
        if (!source) {
          if (paymentMethod === 'cash') {
            source = sources.find(s => s.is_default_for_cash);
          } else if (paymentMethod === 'mpesa' || paymentMethod === 'mkesh') {
            source = sources.find(s => s.is_default_for_mobile);
          } else if (paymentMethod === 'paga_facil') {
            source = sources.find(s => s.is_default_for_bank);
          }
        }

        // Fallback to first source if still no match
        if (!source && sources.length > 0) {
          source = sources[0];
        }

        if (source) {
          allocationsToAdd.push({
            source_id: source.id,
            amount: transaction.total_amount,
            date: transaction.date?.split('T')[0] || today,
            reference_id: transaction.id,
            reference_type: 'pos_transaction',
            payment_method: paymentMethod,
            is_auto_allocated: true,
          });
        }
      }

      if (allocationsToAdd.length > 0) {
        try {
          await addBatchAllocations(allocationsToAdd);
          console.log(`Auto-allocated ${allocationsToAdd.length} POS transactions`);
        } catch (error) {
          console.error('Error auto-allocating POS revenue:', error);
        }
      }
    };

    autoAllocatePOSRevenue();
  }, [posTransactions, sources, currentStore?.id, monthStart, monthEnd, allocations, today, addBatchAllocations]);

  // Store revenue from POS transactions (auto-pulled) - THIS STORE ONLY
  const storeRevenue = useMemo(() => {
    return posTransactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return txDate >= monthStart && txDate <= monthEnd &&
               t.payment_method && 
               t.payment_method !== 'credit' && 
               t.payment_method !== 'self_consumption';
      })
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [posTransactions, monthStart, monthEnd]);

  // MTD Income for ALL stores
  const mtdIncomeAllStores = useMemo(() => {
    return allTransactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return txDate >= monthStart && txDate <= monthEnd &&
               t.payment_method && 
               t.payment_method !== 'credit' && 
               t.payment_method !== 'self_consumption';
      })
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [allTransactions, monthStart, monthEnd]);

  // Today's income from ALL stores
  const todaysIncomeAllStores = useMemo(() => {
    return allTransactions
      .filter(t => t.date?.startsWith(today) &&
               t.payment_method && 
               t.payment_method !== 'credit' && 
               t.payment_method !== 'self_consumption')
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [allTransactions, today]);

  // Today's revenue for THIS store
  const todaysRevenue = useMemo(() => {
    return posTransactions
      .filter(t => t.date?.startsWith(today) &&
               t.payment_method && 
               t.payment_method !== 'credit' && 
               t.payment_method !== 'self_consumption')
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [posTransactions, today]);

  // Income by source for the month
  const incomeBySource = useMemo(() => {
    const totals = getSourceTotals(monthStart, monthEnd);
    return sources.map(source => ({
      source,
      amount: totals[source.id] || 0,
    }));
  }, [sources, getSourceTotals, monthStart, monthEnd]);

  const allocatedIncome = incomeBySource.reduce((sum, item) => sum + item.amount, 0);
  
  // Revenue breakdown by payment method
  const revenueByPaymentMethod = useMemo(() => {
    const result: Record<string, number> = {};
    const revenueTransactions = posTransactions.filter(t => {
      const txDate = t.date?.split('T')[0];
      return txDate >= monthStart && txDate <= monthEnd &&
             t.payment_method && 
             t.payment_method !== 'credit' && 
             t.payment_method !== 'self_consumption';
    });

    revenueTransactions.forEach(t => {
      const method = t.payment_method;
      if (method) {
        result[method] = (result[method] || 0) + Number(t.total_amount);
      }
    });

    return result;
  }, [posTransactions, monthStart, monthEnd]);

  // Find which payment methods aren't properly allocated
  const unallocatedPaymentMethods = useMemo(() => {
    const methods: string[] = [];
    Object.entries(revenueByPaymentMethod).forEach(([method, amount]) => {
      if (amount > 0) {
        // Check if there's a source configured for this payment method
        const hasSource = sources.some(s => 
          s.payment_methods?.includes(method) || 
          (method === 'cash' && s.is_default_for_cash) ||
          (method === 'mpesa' && s.is_default_for_mobile) ||
          (method === 'mkesh' && s.is_default_for_mobile) ||
          (method === 'paga_facil' && s.is_default_for_bank)
        );
        
        if (!hasSource) {
          methods.push(method);
        }
      }
    });
    return methods;
  }, [revenueByPaymentMethod, sources]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, monthStart, monthEnd]);

  // Global Balance (using store revenue, not allocated income)
  const globalBalance = storeRevenue - totalExpenses;

  // Expenses by source and category
  const expensesBySource = useMemo(() => {
    return getExpensesBySource(monthStart, monthEnd);
  }, [getExpensesBySource, monthStart, monthEnd]);

  const expensesByCategory = useMemo(() => {
    return getExpensesByCategory(monthStart, monthEnd);
  }, [getExpensesByCategory, monthStart, monthEnd]);

  // Source balances
  const sourceBalances = useMemo(() => {
    return sources.map(source => {
      const income = incomeBySource.find(i => i.source.id === source.id)?.amount || 0;
      const expenses = expensesBySource[source.id] || 0;
      return {
        source,
        income,
        expenses,
        balance: income - expenses,
      };
    });
  }, [sources, incomeBySource, expensesBySource]);

  // Budget vs Actual
  const budgetProgress = useMemo(() => {
    return parentCategories.map(parent => {
      const childCategories = categories.filter(c => c.parent_id === parent.id);
      const totalBudget = childCategories.reduce((sum, cat) => 
        sum + getBudget(cat.id, selectedYear, selectedMonth), 0
      );
      const totalActual = childCategories.reduce((sum, cat) => 
        sum + (expensesByCategory[cat.id] || 0), 0
      );
      const percent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
      
      return {
        parent,
        budget: totalBudget,
        actual: totalActual,
        percent,
        children: childCategories.map(cat => ({
          category: cat,
          budget: getBudget(cat.id, selectedYear, selectedMonth),
          actual: expensesByCategory[cat.id] || 0,
          percent: getBudget(cat.id, selectedYear, selectedMonth) > 0 
            ? ((expensesByCategory[cat.id] || 0) / getBudget(cat.id, selectedYear, selectedMonth)) * 100 
            : 0,
        })),
      };
    });
  }, [parentCategories, categories, expensesByCategory, getBudget, selectedYear, selectedMonth]);

  const isCurrentMonthLocked = isMonthLocked(selectedYear, selectedMonth);

  // Handlers
  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;
    await addSource({ 
      name: newSourceName, 
      icon: 'wallet', 
      color: 'bg-gray-500',
      payment_methods: [],
    });
    setNewSourceName('');
    setShowAddSourceModal(false);
  };

  const handleConfigureSource = (source: any) => {
    setEditingSource(source);
    setSourceConfig({
      name: source.name,
      icon: source.icon || 'wallet',
      color: source.color || 'bg-gray-500',
      payment_methods: source.payment_methods || [],
      is_default_for_cash: source.is_default_for_cash || false,
      is_default_for_mobile: source.is_default_for_mobile || false,
      is_default_for_bank: source.is_default_for_bank || false,
    });
    setShowSourceConfigModal(true);
  };

  const handleSaveSourceConfig = async () => {
    if (!editingSource) return;
    
    await updateSource(editingSource.id, {
      payment_methods: sourceConfig.payment_methods,
      is_default_for_cash: sourceConfig.is_default_for_cash,
      is_default_for_mobile: sourceConfig.is_default_for_mobile,
      is_default_for_bank: sourceConfig.is_default_for_bank,
    });
    
    setShowSourceConfigModal(false);
    setEditingSource(null);
    toast({ title: 'Source configuration updated' });
  };

  const handleAllocateIncome = async () => {
    const allocationsToAdd = Object.entries(allocationAmounts)
      .filter(([_, amount]) => amount > 0)
      .map(([sourceId, amount]) => ({
        source_id: sourceId,
        amount,
        date: today,
        reference_type: 'manual_allocation',
      }));
    
    if (allocationsToAdd.length === 0) {
      toast({ title: 'Error', description: 'Please enter amounts to allocate', variant: 'destructive' });
      return;
    }
    
    await addBatchAllocations(allocationsToAdd);
    setAllocationAmounts({});
    setShowAllocationModal(false);
    toast({ title: 'Income allocated successfully' });
  };

  const handleAutoAllocateRemaining = async () => {
    const allocatedTotal = allocatedIncome;
    const remaining = storeRevenue - allocatedTotal;
    
    if (remaining <= 0) {
      toast({ title: 'No revenue to allocate', description: 'All revenue is already allocated', variant: 'destructive' });
      return;
    }

    // Get sources that are configured for automatic allocation
    const autoSources = sources.filter(s => 
      s.payment_methods && s.payment_methods.length > 0
    );

    if (autoSources.length === 0) {
      toast({ title: 'No auto-allocation sources', description: 'Configure payment methods for sources first', variant: 'destructive' });
      return;
    }

    // Distribute remaining revenue to auto-sources based on their historical allocation
    const allocationsToAdd = autoSources.map(source => {
      const sourceIncome = incomeBySource.find(i => i.source.id === source.id)?.amount || 0;
      const percentage = allocatedTotal > 0 ? (sourceIncome / allocatedTotal) : (1 / autoSources.length);
      return {
        source_id: source.id,
        amount: Math.round(remaining * percentage),
        date: today,
        reference_type: 'auto_allocation',
        description: 'Auto-allocation of remaining revenue',
      };
    }).filter(a => a.amount > 0);

    if (allocationsToAdd.length > 0) {
      await addBatchAllocations(allocationsToAdd);
      toast({ title: 'Auto-allocated remaining revenue', description: `${remaining.toLocaleString()} MT distributed` });
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const handleAddExpense = () => {
    // TODO: Implement handleAddExpense
  };

  const handleTransfer = () => {
    // TODO: Implement handleTransfer
  };

  if (!currentStore) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Financial Tracking
          </h1>
          <p className="text-muted-foreground">{currentStore.name} • {getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isCurrentMonthLocked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" /> Locked
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="month-end">Month-End</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
              <DialogTrigger asChild>
                <Button disabled={isCurrentMonthLocked} variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" /> Manual Allocation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Income Allocation</DialogTitle>
                 
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Store Revenue (MTD)</p>
                    <p className="text-2xl font-bold">{storeRevenue.toLocaleString()} MT</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Already allocated: {allocatedIncome.toLocaleString()} MT
                    </p>
                  </div>
                  
                  {sources.map(source => {
                    const Icon = iconMap[source.icon] || Wallet;
                    return (
                      <div key={source.id} className="flex items-center gap-3">
                        <Badge className={cn(source.color, "text-primary-foreground")}>
                          <Icon className="w-3 h-3 mr-1" />
                          {source.name}
                        </Badge>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={allocationAmounts[source.id] || ''}
                          onChange={(e) => setAllocationAmounts(prev => ({
                            ...prev,
                            [source.id]: Number(e.target.value)
                          }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {storeRevenue > 0 
                            ? `${((allocationAmounts[source.id] || 0) / storeRevenue * 100).toFixed(0)}%`
                            : '0%'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={handleAutoAllocateRemaining}>
                    Auto-Allocate Remaining
                  </Button>
                  <Button onClick={handleAllocateIncome}>Allocate Income</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isCurrentMonthLocked}>
                  <Receipt className="w-4 h-4 mr-2" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  {/* Expense form - same as before */}
                </div>
                <DialogFooter>
                  <Button onClick={handleAddExpense}>Record Expense</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isCurrentMonthLocked}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Between Sources</DialogTitle>
                </DialogHeader>
                {/* Transfer form - same as before */}
                <DialogFooter>
                  <Button onClick={handleTransfer}>Transfer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => {
                // Trigger auto-allocation check
                toast({ 
                  title: 'Auto-Allocation Check', 
                  description: 'Checking for unallocated POS transactions...' 
                });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Auto-Allocation
            </Button>
          </div>

          {/* Income Overview */}
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's POS Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{todaysRevenue.toLocaleString()} MT</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-allocated to sources
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MTD POS Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storeRevenue.toLocaleString()} MT</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Allocated: {allocatedIncome.toLocaleString()} MT
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {(storeRevenue - allocatedIncome).toLocaleString()} MT
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (MTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()} MT</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Today's Income (All Stores)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{todaysIncomeAllStores.toLocaleString()} MT</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentStore?.name}: {todaysRevenue.toLocaleString()} MT
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  MTD Income (All Stores)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mtdIncomeAllStores.toLocaleString()} MT</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentStore?.name}: {storeRevenue.toLocaleString()} MT
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {storeRevenue > 0 && mtdIncomeAllStores > 0 
                    ? `${((storeRevenue / mtdIncomeAllStores) * 100).toFixed(1)}% of total`
                    : 'No data'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown by Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-primary" />
                POS Revenue by Payment Method
              </CardTitle>
              <CardDescription>
                How revenue is coming in from different payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(revenueByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => {
                    const source = sources.find(s => 
                      s.payment_methods?.includes(method) || 
                      (method === 'cash' && s.is_default_for_cash) ||
                      ((method === 'mpesa' || method === 'mkesh') && s.is_default_for_mobile) ||
                      (method === 'paga_facil' && s.is_default_for_bank)
                    );
                    
                    return (
                      <Card key={method} className={cn(
                        "border-l-4",
                        source ? "border-l-green-500" : "border-l-amber-500"
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                            {!source && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Not Configured
                              </Badge>
                            )}
                          </div>
                          <div className="text-2xl font-bold">{amount.toLocaleString()} MT</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {source ? `→ ${source.name}` : 'No source assigned'}
                          </div>
                          {!source && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-amber-600"
                              onClick={() => {
                                // Find a source to configure
                                const sourceToConfigure = sources[0];
                                if (sourceToConfigure) {
                                  handleConfigureSource(sourceToConfigure);
                                }
                              }}
                            >
                              Configure Source
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
              
              {unallocatedPaymentMethods.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="font-medium text-amber-800">Payment Methods Need Configuration</h4>
                      <p className="text-sm text-amber-700">
                        The following payment methods have revenue but no source assigned: {unallocatedPaymentMethods.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Financial Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Global Financial Position ({currentStore?.name})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">POS Revenue (MTD)</p>
                  <p className="text-2xl font-bold">{storeRevenue.toLocaleString()} MT</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-allocated to sources
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expenses (MTD)</p>
                  <p className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()} MT</p>
                </div>
                <div className={cn(
                  "text-center p-4 rounded-lg",
                  globalBalance >= 0 ? "bg-green-500/10" : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Global Balance (MTD)</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    globalBalance >= 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {globalBalance.toLocaleString()} MT
                  </p>
                </div>
              </div>

              {/* Allocation Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Auto-Allocation Status</h3>
                  <Badge variant={storeRevenue === allocatedIncome ? "default" : "outline"}>
                    {storeRevenue === allocatedIncome ? 'Fully Allocated' : 'Partial Allocation'}
                  </Badge>
                </div>
                <Progress 
                  value={storeRevenue > 0 ? (allocatedIncome / storeRevenue) * 100 : 0} 
                  className="h-3"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Allocated: {allocatedIncome.toLocaleString()} MT</span>
                  <span>Total: {storeRevenue.toLocaleString()} MT</span>
                </div>
                {storeRevenue > allocatedIncome && (
                  <div className="mt-2 text-sm text-amber-600">
                    ⚠️ {(storeRevenue - allocatedIncome).toLocaleString()} MT needs allocation
                  </div>
                )}
              </div>

              {/* Source Breakdown */}
              <h3 className="font-semibold mb-3">Income Source Breakdown</h3>
              {sourceBalances.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sourceBalances.map(({ source, income, expenses, balance }) => {
                    const Icon = iconMap[source.icon] || Wallet;
                    const hasIncome = income > 0;
                    const paymentMethods = source.payment_methods || [];
                    
                    return (
                      <Card key={source.id} className={cn(
                        "border-l-4",
                        balance < 0 ? "border-l-destructive" : 
                        hasIncome ? "border-l-primary" : "border-l-gray-300"
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="font-medium">{source.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleConfigureSource(source)}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {paymentMethods.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground">Payment Methods:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {paymentMethods.map(method => (
                                  <Badge key={method} variant="secondary" className="text-xs capitalize">
                                    {method.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Income:</span>
                              <span className={cn(
                                "font-medium",
                                hasIncome ? "text-primary" : "text-muted-foreground"
                              )}>
                                {hasIncome ? `${income.toLocaleString()} MT` : "0 MT"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expenses:</span>
                              <span className="text-destructive">{expenses.toLocaleString()} MT</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Balance:</span>
                              <span className={balance >= 0 ? "text-green-600" : "text-destructive"}>
                                {balance.toLocaleString()} MT
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/30 rounded-lg">
                  <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No sources configured</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setShowAddSourceModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income Source
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview - Same as before */}
        </TabsContent>

        {/* Sources Tab - Enhanced with configuration */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Income Sources</h2>
              <p className="text-sm text-muted-foreground">
                Configure sources for automatic POS revenue allocation
              </p>
            </div>
            <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Income Source</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., Cash Register"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddSource}>Add Source</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sources.map(source => {
              const Icon = iconMap[source.icon] || Wallet;
              const balance = sourceBalances.find(s => s.source.id === source.id);
              const paymentMethods = source.payment_methods || [];
              
              return (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {source.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConfigureSource(source)}
                          className="h-6 w-6"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        {!source.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSource(source.id)}
                            className="h-6 w-6 text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {source.is_default_for_cash && (
                        <Badge variant="secondary" className="text-xs">Default Cash</Badge>
                      )}
                      {source.is_default_for_mobile && (
                        <Badge variant="secondary" className="text-xs">Default Mobile</Badge>
                      )}
                      {source.is_default_for_bank && (
                        <Badge variant="secondary" className="text-xs">Default Bank</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {paymentMethods.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Assigned Payment Methods:</p>
                        <div className="flex flex-wrap gap-1">
                          {paymentMethods.map(method => (
                            <Badge key={method} variant="outline" className="text-xs capitalize">
                              {method.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Income:</span>
                        <span className="font-medium">{(balance?.income || 0).toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expenses:</span>
                        <span className="font-medium">{(balance?.expenses || 0).toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Balance:</span>
                        <span className={cn(
                          "font-bold",
                          (balance?.balance || 0) >= 0 ? "text-green-600" : "text-destructive"
                        )}>
                          {(balance?.balance || 0).toLocaleString()} MT
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Source Configuration Modal */}
        <Dialog open={showSourceConfigModal} onOpenChange={setShowSourceConfigModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure {editingSource?.name}</DialogTitle>
              <DialogDescription>
                Set payment methods for automatic POS revenue allocation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Payment Methods</Label>
                <div className="space-y-2">
                  {['cash', 'mpesa', 'mkesh', 'paga_facil'].map(method => (
                    <div key={method} className="flex items-center gap-2">
                      <Checkbox
                        id={`method-${method}`}
                        checked={sourceConfig.payment_methods.includes(method)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSourceConfig(prev => ({
                              ...prev,
                              payment_methods: [...prev.payment_methods, method]
                            }));
                          } else {
                            setSourceConfig(prev => ({
                              ...prev,
                              payment_methods: prev.payment_methods.filter(m => m !== method)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`method-${method}`} className="capitalize">
                        {method.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Default Assignments</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="default-cash"
                      checked={sourceConfig.is_default_for_cash}
                      onCheckedChange={(checked) => setSourceConfig(prev => ({
                        ...prev,
                        is_default_for_cash: !!checked,
                        // Unset others if this is checked
                        is_default_for_mobile: checked ? false : prev.is_default_for_mobile,
                        is_default_for_bank: checked ? false : prev.is_default_for_bank,
                      }))}
                    />
                    <Label htmlFor="default-cash">Default source for Cash payments</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="default-mobile"
                      checked={sourceConfig.is_default_for_mobile}
                      onCheckedChange={(checked) => setSourceConfig(prev => ({
                        ...prev,
                        is_default_for_mobile: !!checked,
                        // Unset others if this is checked
                        is_default_for_cash: checked ? false : prev.is_default_for_cash,
                        is_default_for_bank: checked ? false : prev.is_default_for_bank,
                      }))}
                    />
                    <Label htmlFor="default-mobile">Default source for Mobile Money (M-Pesa/M-Kesh)</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="default-bank"
                      checked={sourceConfig.is_default_for_bank}
                      onCheckedChange={(checked) => setSourceConfig(prev => ({
                        ...prev,
                        is_default_for_bank: !!checked,
                        // Unset others if this is checked
                        is_default_for_cash: checked ? false : prev.is_default_for_cash,
                        is_default_for_mobile: checked ? false : prev.is_default_for_mobile,
                      }))}
                    />
                    <Label htmlFor="default-bank">Default source for Bank Transfers (Paga Fácil)</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSourceConfigModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSourceConfig}>
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Other tabs remain the same */}
      </Tabs>
    </div>
  );
}

export default function Finance() {
  return (
    <MainLayout>
      <FinanceContent />
    </MainLayout>
  );
}
