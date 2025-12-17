import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import type { ExpenseCategory } from '@/types/pos';
import { Receipt, Plus, Package, Wrench, Users, Zap, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const expenseCategories: { id: ExpenseCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'stock', label: 'Stock', icon: Package, color: 'bg-amber-500/20 text-amber-600' },
  { id: 'ops', label: 'Operations', icon: Wrench, color: 'bg-blue-500/20 text-blue-600' },
  { id: 'salary', label: 'Salary', icon: Users, color: 'bg-purple-500/20 text-purple-600' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-green-500/20 text-green-600' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-500/20 text-gray-600' },
];

export default function Expenses() {
  const { toast } = useToast();
  const { expenses, addExpense, currentStore, currentStaff } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('stock');
  const [description, setDescription] = useState('');

  const storeExpenses = expenses.filter(e => e.storeId === currentStore.id);
  const totalExpenses = storeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const stockExpenses = storeExpenses.filter(e => e.category === 'stock').reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid expense amount",
        variant: "destructive",
      });
      return;
    }

    const expense = {
      id: `exp-${Date.now()}`,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      category,
      description: description || `${category} expense`,
      isDeducted: false,
      storeId: currentStore.id,
      staffId: currentStaff.id,
    };

    addExpense(expense);
    
    toast({
      title: "Expense recorded ✓",
      description: `${parseFloat(amount).toLocaleString()} MT for ${category}`,
    });

    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground">{currentStore.name} • Today's Expenses</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/20">
                <Receipt className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">{totalExpenses.toLocaleString()} MT</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Pre-Spent</p>
                <p className="text-2xl font-bold text-amber-600">{stockExpenses.toLocaleString()} MT</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <Receipt className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{storeExpenses.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle>Record New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (MT)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Emergency tomatoes purchase"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {expenseCategories.map(cat => (
                      <Button
                        key={cat.id}
                        type="button"
                        variant={category === cat.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategory(cat.id)}
                        className="gap-2"
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {category === 'stock' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-700">
                      💡 Stock expenses will be deducted from tomorrow's Restock Pot calculation
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Expense</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Today's Expenses</h2>
          {storeExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No expenses recorded today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {storeExpenses.map(expense => {
                const cat = expenseCategories.find(c => c.id === expense.category);
                const Icon = cat?.icon || Receipt;
                return (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-2 rounded-lg", cat?.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{expense.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {cat?.label}
                              </Badge>
                              {expense.category === 'stock' && !expense.isDeducted && (
                                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700">
                                  Pre-spent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-destructive">
                            -{expense.amount.toLocaleString()} MT
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
