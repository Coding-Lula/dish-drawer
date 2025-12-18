import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useExpenses, useExpenseCategories, useIngredients, useStoreStock } from '@/hooks/useSupabaseData';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { exportExpensesToCSV, exportExpensesToPDF } from '@/utils/exportUtils';
import { Receipt, Plus, Package, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { expenses, addExpense, loading } = useExpenses(currentStore?.id || null);
  const { categories, addCategory } = useExpenseCategories();
  const { ingredients } = useIngredients();
  const { addStock } = useStoreStock(currentStore?.id || null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');

  const selectedCategory = categories.find(c => c.id === categoryId);
  const isStockCategory = selectedCategory?.name === 'Stock';
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const stockExpenses = expenses.filter(e => e.category === 'Stock').reduce((sum, e) => sum + Number(e.amount), 0);

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
    };

    const result = await addExpense(expense);

    // If stock expense with ingredient, update stock and WAC
    if (result && isStockCategory && ingredientId && ingredientQty) {
      await addStock(ingredientId, parseFloat(ingredientQty), parseFloat(amount));
    }

    setAmount('');
    setDescription('');
    setIngredientId('');
    setIngredientQty('');
    setShowForm(false);
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses, `expenses-${currentStore?.name}`);
    toast({ title: 'Exported to CSV' });
  };

  const handleExportPDF = () => {
    exportExpensesToPDF(expenses, currentStore?.name || 'Store', new Date().toLocaleDateString());
    toast({ title: 'Exported to PDF' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground">{currentStore?.name} • Expense Management</p>
          </div>
          <div className="flex gap-2">
            <AddCategoryModal onSubmit={addCategory} />
            <Button variant="outline" onClick={handleExportCSV} className="gap-2"><FileDown className="w-4 h-4" />CSV</Button>
            <Button variant="outline" onClick={handleExportPDF} className="gap-2"><FileDown className="w-4 h-4" />PDF</Button>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="w-4 h-4" />Add Expense</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/20"><Receipt className="w-6 h-6 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{totalExpenses.toLocaleString()} MT</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20"><Package className="w-6 h-6 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Pre-Spent</p>
                <p className="text-2xl font-bold text-amber-600">{stockExpenses.toLocaleString()} MT</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted"><Receipt className="w-6 h-6 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3"><CardTitle>Record New Expense</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Amount (MT)</Label>
                    <Input type="number" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isStockCategory && (
                  <div className="grid gap-4 md:grid-cols-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="space-y-2">
                      <Label>Item Purchased</Label>
                      <Select value={ingredientId} onValueChange={setIngredientId}>
                        <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>
                          {ingredients.map(ing => (<SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" placeholder="5" value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Emergency purchase" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit">Record Expense</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Expenses</h2>
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : expenses.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No expenses recorded</p></CardContent></Card>
          ) : (
            expenses.slice(0, 20).map(expense => (
              <Card key={expense.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted"><Receipt className="w-5 h-5" /></div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                        {expense.category === 'Stock' && !expense.is_deducted && (<Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700">Pre-spent</Badge>)}
                      </div>
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
    </MainLayout>
  );
}
