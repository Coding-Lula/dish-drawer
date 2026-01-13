import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useDailySummaries, useExpenses, useCredits, useAllocationCategories } from '@/hooks/useSupabaseData';
import { useTableSalesBreakdown } from '@/hooks/useTransactionItems';
import { exportDailyReportPDF } from '@/utils/exportUtils';
import { 
  PieChart, 
  Users, 
  Package, 
  Building2, 
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  FileDown,
  Save,
  Plus,
  Trash2,
  Check,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  users: Users,
  package: Package,
  building2: Building2,
  'more-horizontal': MoreHorizontal,
  circle: MoreHorizontal,
};

function RevenueAllocationContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  const { expenses } = useExpenses(currentStore?.id || null);
  const { credits, settleCredit } = useCredits(currentStore?.id || null);
  const { categories, addCategory, updateCategory, deleteCategory } = useAllocationCategories();
  const { saveSummary } = useDailySummaries(currentStore?.id || null);
  const { breakdown: tableSales } = useTableSalesBreakdown(currentStore?.id || null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [localPercents, setLocalPercents] = useState<Record<string, number>>({});

  const grandTotal = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const stockExpenses = expenses.filter(e => e.category === 'Stock' && !e.is_deducted).reduce((sum, e) => sum + Number(e.amount), 0);
  
  const unsettledCredits = credits.filter(c => c.status === 'unsettled');
  const totalOutstandingCredits = unsettledCredits.reduce((sum, c) => sum + Number(c.sale_amount), 0);

  const getPercent = (catId: string, defaultPercent: number) => localPercents[catId] ?? defaultPercent;
  const totalAllocated = categories.reduce((sum, c) => sum + getPercent(c.id, c.percent), 0);
  const netProfitPercent = Math.max(0, 100 - totalAllocated);
  const netProfitAmount = (grandTotal * netProfitPercent) / 100;
  const isOverAllocated = totalAllocated > 100;

  const handlePercentChange = (catId: string, value: number) => {
    setLocalPercents(prev => ({ ...prev, [catId]: value }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory({ name: newCategoryName, percent: 0, color: 'border-l-gray-500' });
    setNewCategoryName('');
  };

  const handleSaveAllocation = async () => {
    if (isOverAllocated) {
      toast({ title: 'Invalid allocation', description: 'Total cannot exceed 100%', variant: 'destructive' });
      return;
    }
    for (const cat of categories) {
      const newPercent = getPercent(cat.id, cat.percent);
      if (newPercent !== cat.percent) {
        await updateCategory(cat.id, { percent: newPercent });
      }
    }
    await saveSummary({
      date: new Date().toISOString().split('T')[0],
      grand_total: grandTotal,
      net_profit: netProfitAmount,
      net_profit_percent: netProfitPercent,
    });
  };

  const handleExport = () => {
    exportDailyReportPDF(currentStore?.name || 'Store', grandTotal, 
      categories.map(c => ({ name: c.name, amount: (grandTotal * getPercent(c.id, c.percent)) / 100, percent: getPercent(c.id, c.percent) }))
        .concat([{ name: 'Net Profit', amount: netProfitAmount, percent: netProfitPercent }]),
      stockExpenses,
      tableSales
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4">
          <PieChart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Allocation</h1>
        <p className="text-muted-foreground">{currentStore?.name} • {new Date().toLocaleDateString()}</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Grand Total (Today's Sales)</p>
              <p className="text-4xl font-bold text-primary">{grandTotal.toLocaleString()} MT</p>
            </div>
            <div className={cn("text-right p-4 rounded-lg", isOverAllocated ? "bg-destructive/20" : "bg-primary/20")}>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={cn("text-2xl font-bold", isOverAllocated ? "text-destructive" : "text-primary")}>{netProfitPercent.toFixed(1)}%</p>
              {isOverAllocated && <div className="flex items-center gap-1 text-destructive text-sm mt-1"><AlertTriangle className="w-4 h-4" />Over-allocated!</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Allocation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon] || MoreHorizontal;
          const percent = getPercent(cat.id, cat.percent);
          const amount = (grandTotal * percent) / 100;
          return (
            <Card key={cat.id} className={cn("border-l-4", cat.color)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{cat.name}</span>
                  </div>
                  {!cat.is_system && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Slider value={[percent]} onValueChange={([v]) => handlePercentChange(cat.id, v)} max={100} step={1} className="flex-1" />
                  <Input type="number" value={percent} onChange={(e) => handlePercentChange(cat.id, Math.min(100, Math.max(0, Number(e.target.value))))} className="w-20 text-center" min={0} max={100} />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{amount.toLocaleString()} MT</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Category */}
      <div className="flex gap-2">
        <Input placeholder="New category name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
        <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="gap-2"><Plus className="w-4 h-4" />Add</Button>
      </div>

      {/* Net Profit */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Net Profit (Remaining)</p>
                <p className="text-3xl font-bold text-primary">{netProfitAmount.toLocaleString()} MT</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">{netProfitPercent.toFixed(1)}%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Credits */}
      {unsettledCredits.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <CreditCard className="w-5 h-5" />
              Outstanding Credits ({unsettledCredits.length})
              <Badge variant="outline" className="ml-auto">{totalOutstandingCredits.toLocaleString()} MT</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unsettledCredits.map(credit => {
              const creditDate = new Date(credit.date);
              const dueDate = new Date(creditDate);
              dueDate.setDate(dueDate.getDate() + 30); // Net 30 terms by default
              const today = new Date();
              const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
              const isOverdue = daysOverdue > 0;
              
              return (
                <div key={credit.id} className={cn(
                  "p-4 rounded-lg border",
                  isOverdue ? "bg-destructive/10 border-destructive/30" : "bg-amber-500/10 border-amber-500/20"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">{Number(credit.sale_amount).toLocaleString()} MT</p>
                      <p className="font-medium text-foreground">{credit.customer_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Credit Date: {new Date(credit.date).toLocaleDateString()}</span>
                        <span>Due: {dueDate.toLocaleDateString()}</span>
                        <span>Terms: Net 30</span>
                      </div>
                      {isOverdue && (
                        <Badge variant="destructive" className="mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {daysOverdue} days overdue
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => settleCredit(credit.id)} className="gap-1">
                      <Check className="w-3 h-3" />Settle
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4 pb-8">
        <Button variant="outline" onClick={handleExport} className="gap-2"><FileDown className="w-4 h-4" />Export</Button>
        <Button onClick={handleSaveAllocation} disabled={isOverAllocated} className="gap-2 px-8"><Save className="w-4 h-4" />Save Allocation</Button>
      </div>
    </div>
  );
}

export default function RevenueAllocation() {
  return (
    <MainLayout>
      <RevenueAllocationContent />
    </MainLayout>
  );
}