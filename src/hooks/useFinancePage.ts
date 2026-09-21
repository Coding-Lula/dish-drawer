import { useState, useMemo } from 'react';
import { useCurrentStore } from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useExpenses, useStores, useDishes, useRecipes, useIngredients, useExpenseCategories } from '@/hooks/useSupabaseData';
import { useTransactionItems } from '@/hooks/useTransactionItems';
import {
  useIncomeSources,
  useAllocationCategories,
  useFinancialTransactions,
  useMonthLocks,
} from '@/hooks/useFinanceData';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/hooks/useAuth';
import {
  calculateStoreRevenue,
  calculateStoreExpenses,
  mapPaymentMethodToSourceId,
  calculateStorePerformanceAnalytics,
  calculateLowMarginItems,
  calculateIncomeStatement,
} from '@/services/financeService';
import { exportFinancialReport } from '@/utils/financeExcelExport';

export function useFinancePage() {
  const { currentStore } = useCurrentStore();
  const { toast } = useToast();
  const { isManager } = useAuth();

  // State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSourcesDialog, setShowSourcesDialog] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);

  const [transferForm, setTransferForm] = useState({
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

  // Date range formatted strings
  const monthStart = dateRange?.from
    ? format(dateRange.from, 'yyyy-MM-dd')
    : format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = dateRange?.to
    ? format(dateRange.to, 'yyyy-MM-dd')
    : format(endOfMonth(new Date()), 'yyyy-MM-dd');

  // Hooks
  const { stores } = useStores();
  const { sources, addSource, deleteSource } = useIncomeSources();
  const {
    categories: allocationCategories,
    addCategory: addAllocationCategory,
    updateCategory: updateAllocationCategory,
    deleteCategory: deleteAllocationCategory,
  } = useAllocationCategories();
  const { lockMonth, isMonthLocked } = useMonthLocks(currentStore?.id || null);
  const {
    addTransaction: addFinancialTransaction,
  } = useFinancialTransactions(currentStore?.id || null);

  // Data Fetching Hooks (Filtered by Date Range)
  const { transactions: allTransactions } = useTransactions(null, monthStart, monthEnd);
  const { expenses: allStoreExpenses } = useExpenses(null, monthStart, monthEnd);
  const { transactions: allFinancialTransactions } = useFinancialTransactions(null, monthStart, monthEnd);
  const { items: allTransactionItems } = useTransactionItems(null, monthStart, monthEnd);
  const { dishes: allDishes } = useDishes();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();
  const { categories: expenseCategories } = useExpenseCategories();

  // Scoped to currentStore
  const posTransactions = useMemo(
    () => allTransactions.filter(t => t.store_id === currentStore?.id),
    [allTransactions, currentStore?.id]
  );

  // Income Statement (Demonstração de Resultados - DRE)
  const incomeStatement = useMemo(() => {
    if (!currentStore?.id) {
      return {
        grossRevenue: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        operationalExpenses: 0,
        financialExpenses: 0,
        totalExpenses: 0,
        netProfit: 0,
        netMarginPercent: 0,
        operationalBreakdown: [],
        financialBreakdown: [],
      };
    }
    return calculateIncomeStatement(
      allTransactions,
      allTransactionItems,
      recipes,
      ingredients,
      allStoreExpenses,
      allFinancialTransactions,
      expenseCategories,
      currentStore.id,
      monthStart,
      monthEnd
    );
  }, [
    currentStore?.id,
    allTransactions,
    allTransactionItems,
    recipes,
    ingredients,
    allStoreExpenses,
    allFinancialTransactions,
    expenseCategories,
    monthStart,
    monthEnd,
  ]);

  const rawExpenses = useMemo(
    () => allStoreExpenses.filter(e => e.store_id === currentStore?.id),
    [allStoreExpenses, currentStore?.id]
  );

  const financialTransactions = useMemo(
    () => allFinancialTransactions.filter(t => t.store_id === currentStore?.id),
    [allFinancialTransactions, currentStore?.id]
  );

  // Store-specific financial summary
  const currentStoreSummary = useMemo(() => {
    if (!currentStore?.id) return { revenue: 0, expenses: 0, netTotal: 0 };

    const revenue = calculateStoreRevenue(allTransactions, currentStore.id, monthStart, monthEnd);
    const { total: totalExp } = calculateStoreExpenses(
      allStoreExpenses,
      allFinancialTransactions,
      currentStore.id,
      monthStart,
      monthEnd
    );

    return {
      revenue,
      expenses: totalExp,
      netTotal: revenue - totalExp,
    };
  }, [currentStore?.id, allTransactions, allStoreExpenses, allFinancialTransactions, monthStart, monthEnd]);

  // Income by source
  const incomeBySource = useMemo(() => {
    const sourceAmounts: Record<string, number> = {};
    sources.forEach(s => {
      sourceAmounts[s.id] = 0;
    });

    const paymentMethodToSourceMap = mapPaymentMethodToSourceId(sources);

    posTransactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return (
          txDate >= monthStart &&
          txDate <= monthEnd &&
          t.payment_method &&
          t.payment_method !== 'credit' &&
          t.payment_method !== 'self_consumption'
        );
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
      return (
        txDate >= monthStart &&
        txDate <= monthEnd &&
        t.payment_method &&
        t.payment_method !== 'credit' &&
        t.payment_method !== 'self_consumption'
      );
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

    rawExpenses
      .filter(e => {
        const eDate = e.date?.split('T')[0];
        return eDate >= monthStart && eDate <= monthEnd && e.payment_method;
      })
      .forEach(e => {
        const method = e.payment_method!;
        result[method] = (result[method] || 0) + Number(e.amount);
      });

    financialTransactions
      .filter(t => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd && t.source_id)
      .forEach(t => {
        const source = sources.find(s => s.id === t.source_id);
        const method = source?.name.toLowerCase() || 'other';
        result[method] = (result[method] || 0) + Number(t.amount);
      });

    return result;
  }, [rawExpenses, financialTransactions, sources, monthStart, monthEnd]);

  // Performance Analytics for Current Store
  const performanceAnalytics = useMemo(() => {
    if (!currentStore?.id) return { topCategories: [], topItems: [] };
    return calculateStorePerformanceAnalytics(
      allTransactions,
      allTransactionItems,
      allDishes,
      currentStore.id,
      monthStart,
      monthEnd
    );
  }, [currentStore?.id, allTransactions, allTransactionItems, allDishes, monthStart, monthEnd]);

  // Low Margin Items
  const lowMarginItems = useMemo(() => {
    return calculateLowMarginItems(allDishes, recipes, ingredients, marginThreshold);
  }, [allDishes, recipes, ingredients, marginThreshold]);

  // All Dishes with Margins (for Export filtering)
  const allDishesWithMargin = useMemo(() => {
    return calculateLowMarginItems(allDishes, recipes, ingredients, 100);
  }, [allDishes, recipes, ingredients]);

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

  /**
   * Internal Account Transfer (within currently selected store)
   */
  const handleInternalTransfer = async () => {
    if (!currentStore?.id) {
      toast({ title: 'Error', description: 'No store selected', variant: 'destructive' });
      return;
    }

    if (!transferForm.from_source_id || !transferForm.to_source_id || !transferForm.amount) {
      toast({ title: 'Error', description: 'Please select origin account, destination account, and amount', variant: 'destructive' });
      return;
    }

    if (transferForm.from_source_id === transferForm.to_source_id) {
      toast({ title: 'Error', description: 'Origin and destination accounts must be different', variant: 'destructive' });
      return;
    }

    const amount = Number(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    const fromSource = sources.find(s => s.id === transferForm.from_source_id);
    const toSource = sources.find(s => s.id === transferForm.to_source_id);

    const result = await addFinancialTransaction({
      store_id: currentStore.id,
      type: 'transfer',
      amount: amount,
      source_id: transferForm.from_source_id,
      transfer_to_source_id: transferForm.to_source_id,
      description: transferForm.description
        ? `Transfer from ${fromSource?.name || 'Account'} to ${toSource?.name || 'Account'}: ${transferForm.description}`
        : `Transfer from ${fromSource?.name || 'Account'} to ${toSource?.name || 'Account'}`,
      date: new Date().toISOString().split('T')[0],
    });

    if (result) {
      toast({ title: 'Success', description: 'Internal transfer logged successfully' });
      setShowTransferModal(false);
      setTransferForm({
        from_source_id: '',
        to_source_id: '',
        amount: '',
        description: '',
      });
    }
  };

  return {
    currentStore,
    isManager,
    toast,
    dateRange,
    setDateRange,
    monthStart,
    monthEnd,
    showTransferModal,
    setShowTransferModal,
    showSourcesDialog,
    setShowSourcesDialog,
    showAddSourceModal,
    setShowAddSourceModal,
    transferForm,
    setTransferForm,
    newSourceName,
    setNewSourceName,
    editingAllocations,
    setEditingAllocations,
    showAddEnvelopeModal,
    setShowAddEnvelopeModal,
    newEnvelope,
    setNewEnvelope,
    marginThreshold,
    setMarginThreshold,
    showAllLowMargin,
    setShowAllLowMargin,
    stores,
    sources,
    deleteSource,
    allocationCategories,
    deleteAllocationCategory,
    currentStoreSummary,
    incomeStatement,
    revenueByPaymentMethod,
    expensesByPaymentMethod,
    performanceAnalytics,
    lowMarginItems,
    isCurrentMonthLocked,
    lockMonth,
    handleAddSource,
    handleSaveAllocations,
    handleAddEnvelope,
    handleInternalTransfer,
    handleExportData: () => {
      if (!currentStore) return;
      try {
        const fromDate = dateRange?.from || new Date();
        const month = fromDate.getMonth() + 1;
        const year = fromDate.getFullYear();
        const lockDate = monthEnd;

        // Calculate expenses by parent category for Excel summary
        const parentExpMap: Record<string, number> = {};
        rawExpenses.forEach(e => {
          const catName = e.category || 'Outras';
          parentExpMap[catName] = (parentExpMap[catName] || 0) + Number(e.amount);
        });
        const expensesByParentCategory = Object.entries(parentExpMap).map(([name, amount]) => ({
          parent: { id: name, name, display_order: 0, created_at: '' },
          amount,
        }));

        const fileName = exportFinancialReport({
          month,
          year,
          lockDate,
          totalIncome: currentStoreSummary.revenue,
          totalExpenses: currentStoreSummary.expenses,
          globalBalance: currentStoreSummary.netTotal,
          incomeBySource,
          expensesByParentCategory,
          transactions: financialTransactions,
          storeName: currentStore.name,
          marginThreshold,
          performanceAnalytics,
          lowMarginItems: allDishesWithMargin,
          incomeStatement,
        });

        toast({
          title: 'Relatório Exportado',
          description: `Ficheiro ${fileName} descarregado com sucesso.`,
        });
      } catch (err: any) {
        console.error('[Export] Error generating excel:', err);
        toast({
          title: 'Erro na Exportação',
          description: 'Não foi possível gerar o ficheiro de relatório.',
          variant: 'destructive',
        });
      }
    },
  };
}
