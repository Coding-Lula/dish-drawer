import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentStore } from '@/components/layout/MainLayout';
import {
  useExpenses,
  useExpenseCategories,
  useIngredients,
  useStoreStock,
  useSuppliers,
  Expense,
} from '@/hooks/useSupabaseData';
import { useFinancialTransactions } from '@/hooks/useFinanceData';
import { useAuth } from '@/hooks/useAuth';
import { exportExpensesToCSV, exportExpensesToPDF } from '@/utils/exportUtils';
import { updateOperationalExpense, UpdateExpenseInput } from '@/services/expensesService';

export function useExpensesPage() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { isManager } = useAuth();
  const {
    expenses: rawExpenses,
    addExpense,
    deleteExpense,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useExpenses(currentStore?.id || null);
  const { transactions: financialTransactions, loading: financialLoading } =
    useFinancialTransactions(currentStore?.id || null);
  const { categories, addCategory } = useExpenseCategories();
  const { ingredients } = useIngredients();
  const { addStock } = useStoreStock(currentStore?.id || null);
  const { suppliers, addSupplier } = useSuppliers();

  // Form states (Add)
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [isIvaDeductible, setIsIvaDeductible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Edit Modal states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredientId, setEditIngredientId] = useState('');
  const [editIngredientQty, setEditIngredientQty] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editInvoiceNo, setEditInvoiceNo] = useState('');
  const [editIsIvaDeductible, setEditIsIvaDeductible] = useState(false);
  const [editPaymentMethod, setEditPaymentMethod] = useState('');

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isStockCategory = selectedCategory?.name === 'Stock';

  const editSelectedCategory = categories.find(c => c.id === editCategoryId);
  const editIsStockCategory = editSelectedCategory?.name === 'Stock';

  const operationalExpensesTotal = (rawExpenses || []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const financialExpensesTotal = (financialTransactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = operationalExpensesTotal + financialExpensesTotal;

  const stockExpenses = rawExpenses
    .filter(e => e.category === 'Stock')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const combinedExpenses = [
    ...rawExpenses.map(e => ({ ...e, source: 'operational' as const })),
    ...financialTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        id: t.id,
        amount: t.amount,
        date: t.date,
        category_id: t.expense_category_id,
        category: 'Finance',
        description: t.description || 'Financial Expense',
        is_deducted: false,
        store_id: t.store_id,
        staff_id: null,
        ingredient_id: null,
        ingredient_quantity: null,
        supplier_id: null,
        invoice_no: t.invoice_no,
        is_iva_deductible: false,
        payment_method: 'N/A',
        created_at: t.created_at,
        source: 'financial' as const,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const loading = expensesLoading || financialLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const expense = {
        amount: parseFloat(amount),
        category_id: categoryId || undefined,
        category: selectedCategory?.name,
        description: description || `${selectedCategory?.name || 'General'} expense`,
        ingredient_id: isStockCategory ? ingredientId || undefined : undefined,
        ingredient_quantity:
          isStockCategory && ingredientQty ? parseFloat(ingredientQty) : undefined,
        supplier_id: supplierId || undefined,
        invoice_no: invoiceNo || undefined,
        is_iva_deductible: isIvaDeductible,
        payment_method: paymentMethod || undefined,
      };

      const result = await addExpense(expense);

      if (result && isStockCategory && ingredientId && ingredientQty) {
        await addStock(ingredientId, parseFloat(ingredientQty), parseFloat(amount));
      }

      // Reset form
      setAmount('');
      setDescription('');
      setIngredientId('');
      setIngredientQty('');
      setSupplierId('');
      setInvoiceNo('');
      setIsIvaDeductible(false);
      setPaymentMethod('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(String(expense.amount));
    setEditCategoryId(expense.category_id || '');
    setEditDescription(expense.description || '');
    setEditIngredientId(expense.ingredient_id || '');
    setEditIngredientQty(
      expense.ingredient_quantity ? String(expense.ingredient_quantity) : ''
    );
    setEditSupplierId(expense.supplier_id || '');
    setEditInvoiceNo(expense.invoice_no || '');
    setEditIsIvaDeductible(!!expense.is_iva_deductible);
    setEditPaymentMethod(expense.payment_method || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    setIsEditingSubmitting(true);
    try {
      const updates: UpdateExpenseInput = {
        amount: parsedAmount,
        category_id: editCategoryId || undefined,
        category: editSelectedCategory?.name || editingExpense.category || undefined,
        description: editDescription || undefined,
        ingredient_id: editIsStockCategory ? editIngredientId || undefined : undefined,
        ingredient_quantity:
          editIsStockCategory && editIngredientQty ? parseFloat(editIngredientQty) : undefined,
        supplier_id: editSupplierId || undefined,
        invoice_no: editInvoiceNo || undefined,
        is_iva_deductible: editIsIvaDeductible,
        payment_method: editPaymentMethod || undefined,
      };

      await updateOperationalExpense(editingExpense.id, updates);
      await refetchExpenses();
      toast({ title: 'Despesa atualizada com sucesso' });
      setShowEditModal(false);
      setEditingExpense(null);
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar despesa',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleExportCSV = (startDate: Date, endDate: Date) => {
    const filteredExpenses = rawExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= startDate && date <= endDate;
    });
    exportExpensesToCSV(
      filteredExpenses,
      `expenses-${currentStore?.name}-${startDate.toISOString().split('T')[0]}-${
        endDate.toISOString().split('T')[0]
      }`
    );
    toast({ title: 'Exported to CSV' });
  };

  const handleExportPDF = (startDate: Date, endDate: Date) => {
    const filteredExpenses = rawExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= startDate && date <= endDate;
    });
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    exportExpensesToPDF(filteredExpenses, currentStore?.name || 'Store', dateRange);
    toast({ title: 'Exported to PDF' });
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    return suppliers.find(s => s.id === supplierId)?.name;
  };

  return {
    currentStore,
    isManager,
    toast,
    rawExpenses,
    deleteExpense,
    categories,
    addCategory,
    ingredients,
    suppliers,
    addSupplier,
    showForm,
    setShowForm,
    isSubmitting,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    description,
    setDescription,
    ingredientId,
    setIngredientId,
    ingredientQty,
    setIngredientQty,
    supplierId,
    setSupplierId,
    invoiceNo,
    setInvoiceNo,
    isIvaDeductible,
    setIsIvaDeductible,
    paymentMethod,
    setPaymentMethod,
    isStockCategory,
    totalExpenses,
    stockExpenses,
    combinedExpenses,
    loading,
    handleSubmit,
    handleExportCSV,
    handleExportPDF,
    getSupplierName,
    // Edit modal
    showEditModal,
    setShowEditModal,
    editingExpense,
    openEditModal,
    handleEditSubmit,
    isEditingSubmitting,
    editAmount,
    setEditAmount,
    editCategoryId,
    setEditCategoryId,
    editDescription,
    setEditDescription,
    editIngredientId,
    setEditIngredientId,
    editIngredientQty,
    setEditIngredientQty,
    editSupplierId,
    setEditSupplierId,
    editInvoiceNo,
    setEditInvoiceNo,
    editIsIvaDeductible,
    setEditIsIvaDeductible,
    editPaymentMethod,
    setEditPaymentMethod,
    editIsStockCategory,
  };
}
