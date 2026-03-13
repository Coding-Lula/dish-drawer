import { useState, useMemo, useEffect } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useExpenses, useStores, useDishes, useRecipes, useIngredients } from '@/hooks/useSupabaseData';
import { useTransactionItems } from '@/hooks/useTransactionItems';
import {
  useIncomeSources,
  useAllocationCategories,
  useFinancialTransactions,
  useMonthLocks,
} from '@/hooks/useFinanceData';
import {
  TrendingUp,
  Wallet,
  Plus,
  Trash2,
  Lock,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  Settings,
  SmartphoneIcon,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

const iconMap: Record<string, any> = {
  'smartphone': SmartphoneIcon,
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSourcesDialog, setShowSourcesDialog] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  
  // Form states
  const [transferForm, setTransferForm] = useState({
    from_store_id: '',
    to_store_id: '',
    from_source_id: '',
    to_source_id: '',
    amount: '',
    description: '',
  });
  const [newSourceName, setNewSourceName] = useState('');
  const [editingAllocations, setEditingAllocations] = useState<Record<string, number>>({});
  const [showAddEnvelopeModal, setShowAddEnvelopeModal] = useState(false);
  const [newEnvelope, setNewEnvelope] = useState({ name: '', percent: 0, color: '#3b82f6' });
  const [marginThreshold, setMarginThreshold] = useState(10);
  const [showAllLowMargin, setShowAllLowMargin] = useState(false);

  // Calculated values
  const monthStart = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(endOfMonth(new Date()), 'yyyy-MM-dd');
  
  // Hooks
  const { stores } = useStores();
  const { sources, addSource, deleteSource } = useIncomeSources();
  const {
    categories: allocationCategories,
    addCategory: addAllocationCategory,
    updateCategory: updateAllocationCategory,
    deleteCategory: deleteAllocationCategory
  } = useAllocationCategories();
  const { lockMonth, isMonthLocked } = useMonthLocks(currentStore?.id || null);
  const {
    addTransaction,
    getExpensesByCategory,
    getExpensesBySource 
  } = useFinancialTransactions(currentStore?.id || null);

  // Data Fetching Hooks (Filtered by Date Range at DB level)
  const { transactions: allTransactions } = useTransactions(null, monthStart, monthEnd);
  const { expenses: allStoreExpenses } = useExpenses(null, monthStart, monthEnd);
  const { transactions: allFinancialTransactions } = useFinancialTransactions(null, monthStart, monthEnd);
  const { items: allTransactionItems } = useTransactionItems(null, monthStart, monthEnd);
  const { dishes: allDishes } = useDishes();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();

  // Derived Current Store Data
  const posTransactions = useMemo(() =>
    allTransactions.filter(t => t.store_id === currentStore?.id),
    [allTransactions, currentStore?.id]
  );
  const rawExpenses = useMemo(() =>
    allStoreExpenses.filter(e => e.store_id === currentStore?.id),
    [allStoreExpenses, currentStore?.id]
  );
  const transactions = useMemo(() =>
    allFinancialTransactions.filter(t => t.store_id === currentStore?.id),
    [allFinancialTransactions, currentStore?.id]
  );

  // Store-by-store breakdown
  const storesFinancialSummary = useMemo(() => {
    return stores.map(store => {
      const revenue = allTransactions
        .filter(t => {
          const txDate = t.date?.split('T')[0];
          return t.store_id === store.id &&
                 txDate >= monthStart && txDate <= monthEnd &&
                 t.payment_method &&
                 t.payment_method !== 'credit' &&
                 t.payment_method !== 'self_consumption';
        })
        .reduce((sum, t) => sum + Number(t.total_amount), 0);

      const operationalExps = allStoreExpenses
        .filter(e => {
          const eDate = e.date?.split('T')[0];
          return e.store_id === store.id && eDate >= monthStart && eDate <= monthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const financialExps = allFinancialTransactions
        .filter(t => {
          return t.store_id === store.id && t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExp = operationalExps + financialExps;

      return {
        ...store,
        revenue,
        expenses: totalExp,
        netTotal: revenue - totalExp
      };
    });
  }, [stores, allTransactions, allStoreExpenses, allFinancialTransactions, monthStart, monthEnd]);

  const grandTotals = useMemo(() => {
    return storesFinancialSummary.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      expenses: acc.expenses + curr.expenses,
      netTotal: acc.netTotal + curr.netTotal
    }), { revenue: 0, expenses: 0, netTotal: 0 });
  }, [storesFinancialSummary]);

  // Income by source for the month - calculated from POS transactions
  const incomeBySource = useMemo(() => {
    const sourceAmounts: Record<string, number> = {};
    sources.forEach(s => { sourceAmounts[s.id] = 0; });

    // Auto-map payment methods to income sources by name
    const paymentMethodToSourceMap: Record<string, string> = {};
    sources.forEach(source => {
      const name = source.name.toLowerCase();
      if (name === 'cash' || name === 'caixa') paymentMethodToSourceMap['cash'] = source.id;
      else if (name === 'mpesa' || name === 'm-pesa') paymentMethodToSourceMap['mpesa'] = source.id;
      else if (name === 'pos' || name === 'cartão' || name === 'cartao') {
        paymentMethodToSourceMap['cartao'] = source.id;
        paymentMethodToSourceMap['paga_facil'] = source.id;
      }
      else if (name === 'emola' || name === 'e-mola') paymentMethodToSourceMap['emola'] = source.id;
    });

    posTransactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return txDate >= monthStart && txDate <= monthEnd &&
               t.payment_method &&
               t.payment_method !== 'credit' &&
               t.payment_method !== 'self_consumption';
      })
      .forEach(t => {
        const sourceId = paymentMethodToSourceMap[t.payment_method];
        if (sourceId) sourceAmounts[sourceId] += Number(t.total_amount);
      });

    return sources.map(source => ({
      source,
      amount: sourceAmounts[source.id] || 0,
    }));
  }, [sources, posTransactions, monthStart, monthEnd]);

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

  // Expenses breakdown by payment method
  const expensesByPaymentMethod = useMemo(() => {
    const result: Record<string, number> = {};

    // Operational expenses
    rawExpenses
      .filter(e => {
        const eDate = e.date?.split('T')[0];
        return eDate >= monthStart && eDate <= monthEnd && e.payment_method;
      })
      .forEach(e => {
        const method = e.payment_method!;
        result[method] = (result[method] || 0) + Number(e.amount);
      });

    // Financial transactions (expenses)
    transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd && t.source_id)
      .forEach(t => {
        const source = sources.find(s => s.id === t.source_id);
        const method = source?.name.toLowerCase() || 'other';
        result[method] = (result[method] || 0) + Number(t.amount);
      });

    return result;
  }, [rawExpenses, transactions, sources, monthStart, monthEnd]);


  // Performance Analytics
  const performanceAnalytics = useMemo(() => {
    return stores.map(store => {
      const storeTxIds = allTransactions
        .filter(t => {
          const txDate = t.date?.split('T')[0];
          return t.store_id === store.id && txDate >= monthStart && txDate <= monthEnd;
        })
        .map(t => t.id);

      const storeItems = allTransactionItems.filter(item => storeTxIds.includes(item.transaction_id));

      const itemPerformance: Record<string, { revenue: number, quantity: number, name: string }> = {};
      const categoryPerformance: Record<string, { revenue: number, quantity: number }> = {};

      storeItems.forEach(item => {
        const dish = allDishes.find(d => d.id === item.dish_id);
        const name = dish?.name || 'Unknown';
        const category = dish?.category || 'Uncategorized';
        const rev = Number(item.quantity) * Number(item.unit_price);
        const qty = Number(item.quantity);

        if (!itemPerformance[item.dish_id]) {
          itemPerformance[item.dish_id] = { revenue: 0, quantity: 0, name };
        }
        itemPerformance[item.dish_id].revenue += rev;
        itemPerformance[item.dish_id].quantity += qty;

        if (!categoryPerformance[category]) {
          categoryPerformance[category] = { revenue: 0, quantity: 0 };
        }
        categoryPerformance[category].revenue += rev;
        categoryPerformance[category].quantity += qty;
      });

      const topItems = Object.values(itemPerformance)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const topCategories = Object.entries(categoryPerformance)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        storeId: store.id,
        storeName: store.name,
        topItems,
        topCategories
      };
    });
  }, [stores, allTransactions, allTransactionItems, allDishes, monthStart, monthEnd]);

  // Low Margin Items
  const lowMarginItems = useMemo(() => {
    const threshold = marginThreshold / 100;
    return allDishes
      .map(dish => {
        const dishRecipes = recipes.filter(r => r.dish_id === dish.id);
        const ingredientCost = dishRecipes.reduce((sum, r) => {
          const ingredient = ingredients.find(i => i.id === r.ingredient_id);
          return sum + (Number(ingredient?.average_cost || 0) * Number(r.quantity_required));
        }, 0);

        const fixedCost = Number(dish.cost_of_production) || 0;
        const totalCost = ingredientCost + fixedCost;
        const price = Number(dish.selling_price) || 0;
        const margin = price > 0 ? (price - totalCost) / price : 0;

        return { ...dish, margin, totalCost };
      })
      .filter(item => item.margin <= threshold)
      .sort((a, b) => a.margin - b.margin);
  }, [allDishes, recipes, ingredients, marginThreshold]);

  // Expenses by source and category
  const expensesBySource = useMemo(() => {
    return getExpensesBySource(monthStart, monthEnd);
  }, [getExpensesBySource, monthStart, monthEnd]);


  const isCurrentMonthLocked = dateRange?.from
    ? isMonthLocked(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1)
    : false;

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

  const handleSaveAllocations = async () => {
    for (const [id, percent] of Object.entries(editingAllocations)) {
      await updateAllocationCategory(id, { percent });
    }
    toast({ title: 'Success', description: 'Allocation percentages updated' });
    setEditingAllocations({});
  };

  const handleAddEnvelope = async () => {
    if (!newEnvelope.name) return;
    await addAllocationCategory(newEnvelope);
    setShowAddEnvelopeModal(false);
    setNewEnvelope({ name: '', percent: 0, color: '#3b82f6' });
  };

  const handleTransfer = async () => {
    if (!transferForm.from_store_id || !transferForm.to_store_id || !transferForm.amount) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const amount = Number(transferForm.amount);
    const fromStore = stores.find(s => s.id === transferForm.from_store_id);
    const toStore = stores.find(s => s.id === transferForm.to_store_id);

    const withdrawal = await addTransaction({
      store_id: transferForm.from_store_id,
      type: 'transfer',
      amount: amount,
      source_id: transferForm.from_source_id || null,
      transfer_to_store_id: transferForm.to_store_id,
      description: transferForm.description
        ? `Transfer to ${toStore?.name}: ${transferForm.description}`
        : `Inter-store transfer to ${toStore?.name}`,
      date: new Date().toISOString().split('T')[0],
    });

    if (withdrawal) {
      await addTransaction({
        store_id: transferForm.to_store_id,
        type: 'income',
        amount: amount,
        source_id: transferForm.to_source_id || null,
        description: transferForm.description
          ? `Transfer from ${fromStore?.name}: ${transferForm.description}`
          : `Inter-store transfer from ${fromStore?.name}`,
        date: new Date().toISOString().split('T')[0],
      });

      toast({ title: 'Success', description: 'Transfer completed successfully' });
      setShowTransferModal(false);
      setTransferForm({
        from_store_id: '',
        to_store_id: '',
        from_source_id: '',
        to_source_id: '',
        amount: '',
        description: '',
      });
    }
  };

  if (!currentStore) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Financial Management
          </h1>
          <p className="text-muted-foreground">Consolidated overview & store controls</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          
          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              {isMonthLocked(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1) ? (
                <><Lock className="w-3 h-3" /> Locked</>
              ) : (
                <><TrendingUp className="w-3 h-3" /> Active</>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg border border-dashed">
        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isCurrentMonthLocked}>
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Inter-Store Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Funds Between Stores</DialogTitle>
              <DialogDescription>Move money from one store's balance to another.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Store</Label>
                  <Select
                    value={transferForm.from_store_id}
                    onValueChange={(v) => setTransferForm(prev => ({ ...prev, from_store_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Store</Label>
                  <Select
                    value={transferForm.to_store_id}
                    onValueChange={(v) => setTransferForm(prev => ({ ...prev, to_store_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Source (Optional)</Label>
                  <Select
                    value={transferForm.from_source_id}
                    onValueChange={(v) => setTransferForm(prev => ({ ...prev, from_source_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. Cash" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Source (Optional)</Label>
                  <Select
                    value={transferForm.to_source_id}
                    onValueChange={(v) => setTransferForm(prev => ({ ...prev, to_source_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount (MT)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Reason for transfer"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>Cancel</Button>
              <Button onClick={handleTransfer}>Complete Transfer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Manage Sources
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Income Sources Management</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <Label>Registered Sources</Label>
                  <Button size="sm" onClick={() => setShowAddSourceModal(true)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  {sources.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      {!s.is_default && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSource(s.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Income Source</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input placeholder="e.g. Bank Account" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSourceModal(false)}>Cancel</Button>
              <Button onClick={handleAddSource}>Save Source</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 1. Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Financial Summary by Store (Period)
          </CardTitle>
          <CardDescription>
            Consolidated view of revenue and expenses for all stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storesFinancialSummary.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-right">{store.revenue.toLocaleString()} MT</TableCell>
                  <TableCell className="text-right text-destructive">{store.expenses.toLocaleString()} MT</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    store.netTotal >= 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {store.netTotal.toLocaleString()} MT
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>GRAND TOTAL</TableCell>
                <TableCell className="text-right">{grandTotals.revenue.toLocaleString()} MT</TableCell>
                <TableCell className="text-right text-destructive">{grandTotals.expenses.toLocaleString()} MT</TableCell>
                <TableCell className={cn(
                  "text-right",
                  grandTotals.netTotal >= 0 ? "text-green-600" : "text-destructive"
                )}>
                  {grandTotals.netTotal.toLocaleString()} MT
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 2. Revenue Allocation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Revenue Allocation Envelopes
            </CardTitle>
            <CardDescription>
              Virtual distribution of consolidated revenue (MTD)
            </CardDescription>
          </div>
          <Dialog open={showAddEnvelopeModal} onOpenChange={setShowAddEnvelopeModal}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Envelope
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Envelope</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Envelope Name</Label>
                  <Input
                    placeholder="e.g. Savings"
                    value={newEnvelope.name}
                    onChange={(e) => setNewEnvelope(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Percentage (%)</Label>
                  <Input
                    type="number"
                    value={newEnvelope.percent}
                    onChange={(e) => setNewEnvelope(prev => ({ ...prev, percent: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    className="h-10 p-1"
                    value={newEnvelope.color}
                    onChange={(e) => setNewEnvelope(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddEnvelopeModal(false)}>Cancel</Button>
                <Button onClick={handleAddEnvelope}>Add Envelope</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {allocationCategories.map(cat => {
              const percent = editingAllocations[cat.id] ?? cat.percent;
              const value = (grandTotals.revenue * percent) / 100;
              return (
                <Card key={cat.id} className="border-l-4" style={{ borderLeftColor: cat.color || '#ccc' }}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <Input
                          className="w-16 h-8 text-right p-1"
                          type="number"
                          value={percent}
                          onChange={(e) => setEditingAllocations(prev => ({ ...prev, [cat.id]: Number(e.target.value) }))}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{value.toLocaleString()} MT</div>
                    <Progress value={percent} className="h-1 mt-2" />
                    <div className="flex justify-end mt-2">
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-20 hover:opacity-100" onClick={() => deleteAllocationCategory(cat.id)}>
                          <Trash2 className="w-3 h-3" />
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {Object.keys(editingAllocations).length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSaveAllocations}>Save Allocation Values</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Dual-Column Cash Flow Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Income by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(revenueByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => (
                    <TableRow key={method}>
                      <TableCell className="capitalize">{method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()} MT</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(revenueByPaymentMethod).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No income recorded</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-destructive rotate-180" />
              Expenses by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => (
                    <TableRow key={method}>
                      <TableCell className="capitalize">{method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()} MT</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(expensesByPaymentMethod).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No expenses recorded</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 4. Performance Analytics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance Analytics (Most Sold)
          </CardTitle>
          <CardDescription>
            Top selling categories by revenue and items by quantity per store (Period)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {performanceAnalytics.map(perf => (
              <div key={perf.storeId} className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">{perf.storeName}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Categories</h4>
                    {perf.topCategories.map(cat => (
                      <div key={cat.name} className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className="font-medium whitespace-nowrap">{cat.revenue.toLocaleString()} MT</span>
                      </div>
                    ))}
                    {perf.topCategories.length === 0 && <p className="text-xs text-muted-foreground">No data</p>}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Items (Quantity)</h4>
                    {perf.topItems.map(item => (
                      <div key={item.name} className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="font-medium whitespace-nowrap">{item.quantity} sold</span>
                      </div>
                    ))}
                    {perf.topItems.length === 0 && <p className="text-xs text-muted-foreground">No data</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. Low Profit Margin Items Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Low Profit Margin Items (≤ {marginThreshold}%)
            </CardTitle>
            <CardDescription>
              Menu items with margins below threshold (Ingredient Cost + Overheads vs Price).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold" className="text-xs whitespace-nowrap">Threshold %</Label>
            <Input
              id="threshold"
              type="number"
              className="w-16 h-8 text-right"
              value={marginThreshold}
              onChange={(e) => setMarginThreshold(Number(e.target.value))}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAllLowMargin ? lowMarginItems : lowMarginItems.slice(0, 10)).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.selling_price.toLocaleString()} MT</TableCell>
                  <TableCell className="text-right">{item.totalCost.toFixed(2)} MT</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    item.margin < 0 ? "text-destructive" : "text-amber-600"
                  )}>
                    {(item.margin * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {lowMarginItems.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground italic">All items have healthy margins</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {lowMarginItems.length > 10 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllLowMargin(!showAllLowMargin)}
              >
                {showAllLowMargin ? "Show Less" : `View All (${lowMarginItems.length} Items)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Period Locking (Month-End) */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Period Locking & Finalization
          </CardTitle>
          <CardDescription>
            Lock the current period to prevent further changes to transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div>
              <h3 className="font-bold">Period: {monthStart} to {monthEnd}</h3>
              <p className="text-sm text-muted-foreground">
                Status: {isCurrentMonthLocked ? 'Locked' : 'Active'}
              </p>
            </div>
            <Button
              variant={isCurrentMonthLocked ? "outline" : "default"}
              onClick={() => {
                if (dateRange?.from) {
                  lockMonth(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 'Manager', 'Monthly closeout');
                }
              }}
              disabled={isCurrentMonthLocked || !dateRange?.from}
            >
              {isCurrentMonthLocked ? 'Period is Locked' : 'Lock Period'}
            </Button>
          </div>
        </CardContent>
      </Card>
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
