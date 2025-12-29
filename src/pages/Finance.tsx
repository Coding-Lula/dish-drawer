import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const iconMap: Record<string, any> = {
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'banknote': Banknote,
  'wallet': Wallet,
};

function FinanceContent() {
  const { currentStore } = useCurrentStore();
  const { toast } = useToast();
  
  // State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  
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
  
  // Hooks
  const { transactions: posTransactions } = useTransactions(currentStore?.id || null);
  const { sources, addSource, deleteSource } = useIncomeSources();
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
  
  // Store revenue from POS transactions (auto-pulled)
  const storeRevenue = useMemo(() => {
    return posTransactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return txDate >= monthStart && txDate <= monthEnd;
      })
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [posTransactions, monthStart, monthEnd]);

  const todaysRevenue = useMemo(() => {
    return posTransactions
      .filter(t => t.date?.startsWith(today))
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

  const totalIncome = incomeBySource.reduce((sum, item) => sum + item.amount, 0);

  // Expenses by source and category
  const expensesBySource = useMemo(() => {
    return getExpensesBySource(monthStart, monthEnd);
  }, [getExpensesBySource, monthStart, monthEnd]);

  const expensesByCategory = useMemo(() => {
    return getExpensesByCategory(monthStart, monthEnd);
  }, [getExpensesByCategory, monthStart, monthEnd]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, monthStart, monthEnd]);

  const globalBalance = totalIncome - totalExpenses;

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
  const handleAllocateIncome = async () => {
    const allocationsToAdd = Object.entries(allocationAmounts)
      .filter(([_, amount]) => amount > 0)
      .map(([sourceId, amount]) => ({
        source_id: sourceId,
        amount,
        date: today,
      }));
    
    if (allocationsToAdd.length === 0) {
      toast({ title: 'Error', description: 'Please enter amounts to allocate', variant: 'destructive' });
      return;
    }
    
    await addBatchAllocations(allocationsToAdd);
    setAllocationAmounts({});
    setShowAllocationModal(false);
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category_id || !expenseForm.source_id) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    
    await addTransaction({
      type: 'expense',
      amount: Number(expenseForm.amount),
      supplier: expenseForm.supplier || undefined,
      expense_category_id: expenseForm.category_id,
      source_id: expenseForm.source_id,
      invoice_no: expenseForm.invoice_no || undefined,
      description: expenseForm.description || undefined,
      is_recurring: expenseForm.is_recurring,
      date: today,
    });
    
    setExpenseForm({
      supplier: '',
      amount: '',
      category_id: '',
      source_id: '',
      invoice_no: '',
      description: '',
      is_recurring: false,
    });
    setShowExpenseModal(false);
  };

  const handleTransfer = async () => {
    if (!transferForm.from_source_id || !transferForm.to_source_id || !transferForm.amount) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    await addTransaction({
      type: 'transfer',
      amount: Number(transferForm.amount),
      source_id: transferForm.from_source_id,
      transfer_to_source_id: transferForm.to_source_id,
      description: `Transfer from ${sources.find(s => s.id === transferForm.from_source_id)?.name} to ${sources.find(s => s.id === transferForm.to_source_id)?.name}`,
      date: today,
    });
    
    setTransferForm({ from_source_id: '', to_source_id: '', amount: '' });
    setShowTransferModal(false);
  };

  const handleLockMonth = async () => {
    await lockMonth(selectedYear, selectedMonth, 'User');
    setShowLockModal(false);
    
    // Generate and download Excel report
    const reportData = {
      month: selectedMonth,
      year: selectedYear,
      lockDate: format(new Date(), 'yyyy-MM-dd'),
      totalIncome,
      totalExpenses,
      globalBalance,
      incomeBySource,
      expensesByParentCategory: parentCategories.map(p => ({
        parent: p,
        amount: categories
          .filter(c => c.parent_id === p.id)
          .reduce((sum, c) => sum + (expensesByCategory[c.id] || 0), 0),
      })),
      transactions: transactions.filter(t => t.date >= monthStart && t.date <= monthEnd),
      budgetVsActual: budgetProgress.flatMap(p => 
        p.children.map(c => ({
          category: c.category,
          parentName: p.parent.name,
          budget: c.budget,
          actual: c.actual,
          variance: c.actual - c.budget,
          percent: c.percent,
        }))
      ),
      storeName: currentStore?.name || 'Store',
    };
    
    exportFinancialReport(reportData);
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;
    await addSource({ name: newSourceName, icon: 'wallet', color: 'bg-gray-500' });
    setNewSourceName('');
    setShowAddSourceModal(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryForm.name.trim() || !newCategoryForm.parent_id) return;
    await addCategory({
      name: newCategoryForm.name,
      parent_id: newCategoryForm.parent_id,
      monthly_budget: Number(newCategoryForm.monthly_budget) || 0,
    });
    setNewCategoryForm({ name: '', parent_id: '', monthly_budget: '' });
    setShowAddCategoryModal(false);
  };

  const handleDeleteParentCategory = async (parentId: string) => {
    // Delete all child categories first
    const childCats = categories.filter(c => c.parent_id === parentId);
    for (const child of childCats) {
      await deleteCategory(child.id);
    }
    // Then delete the parent
    await deleteParentCategory(parentId);
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
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
                <Button disabled={isCurrentMonthLocked}>
                  <DollarSign className="w-4 h-4 mr-2" /> Allocate Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Distribute Store Revenue</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Store Revenue (MTD)</p>
                    <p className="text-2xl font-bold">{storeRevenue.toLocaleString()} MT</p>
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
                <DialogFooter>
                  <Button onClick={handleAllocateIncome}>Distribute Income</Button>
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
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      placeholder="e.g., Total Energies"
                      value={expenseForm.supplier}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      placeholder="2,500"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={expenseForm.category_id}
                      onValueChange={(v) => setExpenseForm(prev => ({ ...prev, category_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCategories.map(parent => (
                          <div key={parent.id}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{parent.name}</div>
                            {categories.filter(c => c.parent_id === parent.id).map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source *</Label>
                    <Select
                      value={expenseForm.source_id}
                      onValueChange={(v) => setExpenseForm(prev => ({ ...prev, source_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(source => (
                          <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice No.</Label>
                    <Input
                      placeholder="INV-001"
                      value={expenseForm.invoice_no}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, invoice_no: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Notes..."
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={expenseForm.is_recurring}
                      onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, is_recurring: !!checked }))}
                    />
                    <Label>Set as recurring monthly expense</Label>
                  </div>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>From Source</Label>
                    <Select
                      value={transferForm.from_source_id}
                      onValueChange={(v) => setTransferForm(prev => ({ ...prev, from_source_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Source</Label>
                    <Select
                      value={transferForm.to_source_id}
                      onValueChange={(v) => setTransferForm(prev => ({ ...prev, to_source_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.filter(s => s.id !== transferForm.from_source_id).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Amount to transfer"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleTransfer}>Transfer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Income Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{todaysRevenue.toLocaleString()} MT</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Month-to-Date Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalIncome.toLocaleString()} MT</div>
                <p className="text-xs text-muted-foreground mt-1">Store Revenue: {storeRevenue.toLocaleString()} MT</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Month-to-Date Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()} MT</div>
              </CardContent>
            </Card>
          </div>

          {/* Global Financial Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Global Financial Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-primary">{totalIncome.toLocaleString()} MT</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()} MT</p>
                </div>
                <div className={cn(
                  "text-center p-4 rounded-lg",
                  globalBalance >= 0 ? "bg-green-500/10" : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Global Balance</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    globalBalance >= 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {globalBalance.toLocaleString()} MT
                  </p>
                </div>
              </div>

              <h3 className="font-semibold mb-3">Source Breakdown</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sourceBalances.map(({ source, income, expenses, balance }) => {
                  const Icon = iconMap[source.icon] || Wallet;
                  return (
                    <Card key={source.id} className={cn(
                      "border-l-4",
                      balance < 0 ? "border-l-destructive" : "border-l-primary"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{source.name}</span>
                          {balance < 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Income:</span>
                            <span className="text-primary">{income.toLocaleString()} MT</span>
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
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Budget Status ({getMonthName(selectedMonth)})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetProgress.map(({ parent, budget, actual, percent }) => (
                <div key={parent.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{parent.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {actual.toLocaleString()}/{budget.toLocaleString()} MT
                      </span>
                      {percent > 100 ? (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      ) : percent > 80 ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(percent, 100)} 
                    className={cn(
                      "h-3",
                      percent > 100 ? "[&>div]:bg-destructive" : 
                      percent > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"
                    )}
                  />
                  <div className="text-xs text-right text-muted-foreground">
                    {percent.toFixed(0)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All financial transactions for {getMonthName(selectedMonth)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Supplier/Notes</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(t => t.date >= monthStart && t.date <= monthEnd)
                    .map(transaction => {
                      const fromSource = sources.find(s => s.id === transaction.source_id)?.name || '-';
                      const toSource = transaction.transfer_to_source_id 
                        ? sources.find(s => s.id === transaction.transfer_to_source_id)?.name || '-'
                        : '-';
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            <Badge variant={
                              transaction.type === 'expense' ? 'destructive' : 
                              transaction.type === 'income' ? 'default' : 'secondary'
                            }>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.type === 'transfer' 
                              ? (transaction.description || 'Transfer')
                              : (transaction.supplier || '-')}
                          </TableCell>
                          <TableCell className={transaction.type === 'expense' ? 'text-destructive' : transaction.type === 'income' ? 'text-primary' : 'text-foreground'}>
                            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}{Number(transaction.amount).toLocaleString()} MT
                          </TableCell>
                          <TableCell>{fromSource}</TableCell>
                          <TableCell>
                            {transaction.type === 'transfer' ? toSource : '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.type !== 'transfer' 
                              ? (categories.find(c => c.id === transaction.expense_category_id)?.name || '-')
                              : '-'}
                          </TableCell>
                          <TableCell>{transaction.invoice_no || '-'}</TableCell>
                          <TableCell>
                            {!transaction.is_locked && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTransaction(transaction.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {transactions.filter(t => t.date >= monthStart && t.date <= monthEnd).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No transactions for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Expense Categories</h2>
            <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select
                      value={newCategoryForm.parent_id}
                      onValueChange={(v) => setNewCategoryForm(prev => ({ ...prev, parent_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCategories.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      placeholder="e.g., Rent"
                      value={newCategoryForm.name}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Budget (MT)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={newCategoryForm.monthly_budget}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, monthly_budget: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parentCategories.map(parent => (
                    <>
                      <TableRow key={parent.id} className="bg-muted/50">
                        <TableCell className="font-semibold">{parent.name}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setNewCategoryForm({ name: '', parent_id: parent.id, monthly_budget: '' });
                              setShowAddCategoryModal(true);
                            }}>
                              <Plus className="w-3 h-3 mr-1" /> Add Child
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteParentCategory(parent.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {categories.filter(c => c.parent_id === parent.id).map(cat => {
                        const budget = getBudget(cat.id, selectedYear, selectedMonth) || cat.monthly_budget;
                        const spent = expensesByCategory[cat.id] || 0;
                        const percent = budget > 0 ? (spent / budget) * 100 : 0;
                        
                        return (
                          <TableRow key={cat.id}>
                            <TableCell className="pl-8">{cat.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(cat.id, selectedYear, selectedMonth, Number(e.target.value))}
                                className="w-24 h-8"
                              />
                            </TableCell>
                            <TableCell>{spent.toLocaleString()} MT</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={Math.min(percent, 100)} className="w-20 h-2" />
                                <span className="text-xs">{percent.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCategory(cat.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Income Sources</h2>
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
                      placeholder="e.g., Bank Transfer"
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
              
              return (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {source.name}
                      </div>
                      {!source.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSource(source.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </CardTitle>
                    {source.is_default && (
                      <Badge variant="secondary" className="w-fit">Default</Badge>
                    )}
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

        {/* Month-End Tab */}
        <TabsContent value="month-end" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Month-End Closing
              </CardTitle>
              <CardDescription>
                Lock {getMonthName(selectedMonth)} {selectedYear} to prevent further edits and generate report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl font-bold">{totalIncome.toLocaleString()} MT</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold">{totalExpenses.toLocaleString()} MT</p>
                </div>
                <div className={cn(
                  "p-4 rounded-lg",
                  globalBalance >= 0 ? "bg-green-500/10" : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className={cn(
                    "text-xl font-bold",
                    globalBalance >= 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {globalBalance.toLocaleString()} MT
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Transactions Summary</h3>
                <div className="text-sm text-muted-foreground">
                  {transactions.filter(t => t.date >= monthStart && t.date <= monthEnd).length} transactions recorded
                </div>
              </div>

              {isCurrentMonthLocked ? (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{getMonthName(selectedMonth)} {selectedYear} is locked</p>
                    <p className="text-sm text-muted-foreground">
                      Locked on {locks.find(l => l.year === selectedYear && l.month === selectedMonth)?.locked_at}
                    </p>
                  </div>
                </div>
              ) : (
                <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Lock className="w-4 h-4 mr-2" />
                      Lock {getMonthName(selectedMonth)} {selectedYear}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Month-End Lock</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        This will freeze all transactions for {getMonthName(selectedMonth)} {selectedYear}. 
                        No further edits will be allowed.
                      </p>
                      <p className="text-muted-foreground">
                        An Excel report will be generated and downloaded automatically.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowLockModal(false)}>Cancel</Button>
                      <Button onClick={handleLockMonth}>
                        <Lock className="w-4 h-4 mr-2" /> Confirm & Generate Report
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {isCurrentMonthLocked && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const reportData = {
                      month: selectedMonth,
                      year: selectedYear,
                      lockDate: format(new Date(), 'yyyy-MM-dd'),
                      totalIncome,
                      totalExpenses,
                      globalBalance,
                      incomeBySource,
                      expensesByParentCategory: parentCategories.map(p => ({
                        parent: p,
                        amount: categories
                          .filter(c => c.parent_id === p.id)
                          .reduce((sum, c) => sum + (expensesByCategory[c.id] || 0), 0),
                      })),
                      transactions: transactions.filter(t => t.date >= monthStart && t.date <= monthEnd),
                      budgetVsActual: budgetProgress.flatMap(p => 
                        p.children.map(c => ({
                          category: c.category,
                          parentName: p.parent.name,
                          budget: c.budget,
                          actual: c.actual,
                          variance: c.actual - c.budget,
                          percent: c.percent,
                        }))
                      ),
                      storeName: currentStore?.name || 'Store',
                    };
                    exportFinancialReport(reportData);
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Report Again
                </Button>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Lock History</h3>
                {locks.length > 0 ? (
                  <div className="space-y-2">
                    {locks.map(lock => (
                      <div key={lock.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <span>{getMonthName(lock.month)} {lock.year}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Locked {format(new Date(lock.locked_at), 'PPP')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No months locked yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
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
