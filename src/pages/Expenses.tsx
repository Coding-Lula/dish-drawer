import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useExpenses, useExpenseCategories, useIngredients, useStoreStock, useSuppliers } from '@/hooks/useSupabaseData';
import { useFinancialTransactions } from '@/hooks/useFinanceData';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { AddSupplierModal } from '@/components/modals/AddSupplierModal';
import { DateRangePickerModal } from '@/components/modals/DateRangePickerModal';
import { exportExpensesToCSV, exportExpensesToPDF } from '@/utils/exportUtils';
import { Receipt, Plus, Package, FileText, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function ExpensesContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { expenses: rawExpenses, addExpense, loading: expensesLoading } = useExpenses(currentStore?.id || null);
  const { transactions: financialTransactions, loading: financialLoading } = useFinancialTransactions(currentStore?.id || null);
  const { categories, addCategory } = useExpenseCategories();
  const { ingredients } = useIngredients();
  const { addStock } = useStoreStock(currentStore?.id || null);
  const { suppliers, addSupplier } = useSuppliers();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [isIvaDeductible, setIsIvaDeductible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isStockCategory = selectedCategory?.name === 'Stock';

  const operationalExpensesTotal = (rawExpenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
  const financialExpensesTotal = (financialTransactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = operationalExpensesTotal + financialExpensesTotal;

  const stockExpenses = rawExpenses.filter(e => e.category === 'Stock').reduce((sum, e) => sum + Number(e.amount), 0);

  const combinedExpenses = [
    ...rawExpenses.map(e => ({ ...e, source: 'operational' })),
    ...financialTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        id: t.id,
        description: t.description || 'Financial Expense',
        amount: t.amount,
        date: t.date,
        category: 'Finance',
        payment_method: 'N/A',
        is_iva_deductible: false,
        supplier_id: null,
        invoice_no: t.invoice_no,
        source: 'financial'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const loading = expensesLoading || financialLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    const expense = {
      amount: parseFloat(amount),
      category_id: categoryId,
      category: selectedCategory?.name,
      description: description || `${selectedCategory?.name} expense`,
      ingredient_id: isStockCategory ? ingredientId || undefined : undefined,
      ingredient_quantity: isStockCategory && ingredientQty ? parseFloat(ingredientQty) : undefined,
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
  };

  const handleExportCSV = (startDate: Date, endDate: Date) => {
    const filteredExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= startDate && date <= endDate;
    });
    exportExpensesToCSV(filteredExpenses, `expenses-${currentStore?.name}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`);
    toast({ title: 'Exported to CSV' });
  };

  const handleExportPDF = (startDate: Date, endDate: Date) => {
    const filteredExpenses = expenses.filter(e => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground">{currentStore?.name} • Gestão de Despesas</p>
        </div>
        <div className="flex gap-2">
          <AddCategoryModal onSubmit={addCategory} />
          <DateRangePickerModal onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="w-4 h-4" />Adicionar Despesas</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/20"><Receipt className="w-6 h-6 text-destructive" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Totais</p>
              <p className="text-2xl font-bold">{totalExpenses.toLocaleString()} MT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20"><Package className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Mercadoria Pre-Gasta</p>
              <p className="text-2xl font-bold text-amber-600">{stockExpenses.toLocaleString()} MT</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted"><Receipt className="w-6 h-6 text-muted-foreground" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="text-2xl font-bold">{combinedExpenses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3"><CardTitle>Registrar Nova Despesa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quantia (MT)</Label>
                  <Input type="number" placeholder="" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supplier and Invoice Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <div className="flex gap-2">
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select supplier (optional)" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map(sup => (<SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <AddSupplierModal onSubmit={addSupplier} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número da Fatura</Label>
                  <Input placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
              </div>

              {/* Payment Method and IVA Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IVA Dedutivel</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch 
                      checked={isIvaDeductible} 
                      onCheckedChange={setIsIvaDeductible} 
                    />
                    <span className="text-sm text-muted-foreground">
                      {isIvaDeductible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {isStockCategory && (
                <div className="grid gap-4 md:grid-cols-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="space-y-2">
                    <Label>Item Comprado</Label>
                    <Select value={ingredientId} onValueChange={setIngredientId}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (<SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantia</Label>
                    <Input type="number" placeholder="5" value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Descrição da despesa" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Registrar Despesa</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Despesas Recentes</h2>
        {loading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Processando...</CardContent></Card>
        ) : combinedExpenses.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No expenses recorded</p></CardContent></Card>
        ) : (
          combinedExpenses.slice(0, 20).map(expense => (
            <Card key={expense.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Receipt className={cn("w-5 h-5", expense.source === 'financial' && "text-primary")} />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                      {expense.category === 'Stock' && !(expense as any).is_deducted && (<Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700">Pre-spent</Badge>)}
                      {expense.is_iva_deductible && (<Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">IVA</Badge>)}
                      {expense.payment_method && expense.payment_method !== 'N/A' && (<Badge variant="outline" className="text-xs">{expense.payment_method.toUpperCase()}</Badge>)}
                      {expense.source === 'financial' && (<Badge variant="secondary" className="text-xs">Finance</Badge>)}
                    </div>
                    {((expense as any).supplier_id || expense.invoice_no) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {getSupplierName((expense as any).supplier_id) && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {getSupplierName((expense as any).supplier_id)}
                          </span>
                        )}
                        {expense.invoice_no && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {expense.invoice_no}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-destructive">-{Number(expense.amount).toLocaleString()} MT</p>
                  <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function Expenses() {
  return (
    <MainLayout>
      <ExpensesContent />
    </MainLayout>
  );
}