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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useExpenses } from '@/hooks/useSupabaseData';
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
  TrendingUp,
  Wallet,
  CreditCard,
  Plus,
  Trash2,
  Lock,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  CreditCardIcon,
  Settings,
  Smartphone,
  Banknote,
  SmartphoneIcon,
  Landmark,
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


function FinanceContent() {
  const { currentStore } = useCurrentStore();
  const { toast } = useToast();
  
  // State
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  
  // Form states
  const [transferForm, setTransferForm] = useState({
    from_source_id: '',
    to_source_id: '',
    amount: '',
  });
  const [newSourceName, setNewSourceName] = useState('');
  
  // Hooks
  const { transactions: posTransactions } = useTransactions(currentStore?.id || null);
  const { expenses: rawExpenses } = useExpenses(currentStore?.id || null);
  const { sources, addSource, updateSource, deleteSource } = useIncomeSources();
  const { allocations, addBatchAllocations, getSourceTotals } = useIncomeAllocations(currentStore?.id || null);
  const { parentCategories, addParentCategory, deleteParentCategory } = useExpenseParentCategories();
  const { categories, addCategory, updateCategory, deleteCategory } = useExpenseCategoriesWithParent();
  const { 
    transactions, 
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


  const totalExpenses = useMemo(() => {
    const financialExpenses = transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const operationalExpenses = rawExpenses
      .filter(e => {
        const eDate = e.date?.split('T')[0];
        return eDate >= monthStart && eDate <= monthEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return financialExpenses + operationalExpenses;
  }, [transactions, rawExpenses, monthStart, monthEnd]);

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


  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
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
              {[2026, 2027, 2028].map(year => (
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
          </div>

          {/* Income Overview */}
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's POS Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{todaysRevenue.toLocaleString()} MT</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MTD POS Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storeRevenue.toLocaleString()} MT</div>
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
                How revenue is coming in from different payment methods (MTD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(revenueByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => {
                    return (
                      <Card key={method} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                          </div>
                          <div className="text-2xl font-bold">{amount.toLocaleString()} MT</div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
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
            </CardContent>
          </Card>

          {/* Budget Overview - Same as before */}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Income Sources</h2>
              <p className="text-sm text-muted-foreground">
                Manage your income sources and their balances
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
                  </CardHeader>
                  <CardContent>
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
