import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useExpenses, useSplitConfigs } from '@/hooks/useSupabaseData';
import { useState } from 'react';
import { Moon, DollarSign, Percent, Building2, Package, Briefcase, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentMethods: Record<string, { isRevenue: boolean; isCash: boolean }> = {
  cash: { isRevenue: true, isCash: true },
  mpesa: { isRevenue: true, isCash: true },
  mkesh: { isRevenue: true, isCash: true },
  paga_facil: { isRevenue: true, isCash: true },
  credit: { isRevenue: false, isCash: false },
  self_consumption: { isRevenue: false, isCash: false },
};

function EndOfDayContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  const { expenses } = useExpenses(currentStore?.id || null);
  const { configs } = useSplitConfigs();
  
  const [selectedConfig, setSelectedConfig] = useState(configs[0]);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const config = selectedConfig || configs[0];
  
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const nonRevenueAmount = transactions.filter(t => !paymentMethods[t.payment_method]?.isRevenue).reduce((sum, t) => sum + Number(t.total_amount), 0);
  const netRevenue = totalSales - nonRevenueAmount;
  
  const taxAmount = netRevenue * (Number(config?.tax_percent || 10) / 100);
  const bankAmount = netRevenue * (Number(config?.bank_percent || 20) / 100);
  const restockAmount = netRevenue * (Number(config?.restock_percent || 30) / 100);
  const opsAmount = netRevenue * (Number(config?.ops_percent || 40) / 100);
  
  const stockExpenses = expenses.filter(e => e.category === 'Stock' && !e.is_deducted).reduce((sum, e) => sum + Number(e.amount), 0);
  const finalRestockTransfer = Math.max(0, restockAmount - stockExpenses);
  
  const cashInDrawer = transactions.filter(t => paymentMethods[t.payment_method]?.isCash).reduce((sum, t) => sum + Number(t.total_amount), 0) - expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleCloseDay = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsClosing(false);
    setIsClosed(true);
    toast({ title: 'Day Closed Successfully!', description: `Net revenue: ${netRevenue.toLocaleString()} MT` });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4"><Moon className="w-8 h-8 text-primary" /></div>
        <h1 className="text-3xl font-bold">End of Day</h1>
        <p className="text-muted-foreground">{currentStore?.name} • {new Date().toLocaleDateString()}</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Revenue Split Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {configs.map(c => (<Button key={c.id} variant={config?.id === c.id ? "default" : "outline"} onClick={() => setSelectedConfig(c)}>{c.name}</Button>))}
          </div>
          {config && <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Tax: {config.tax_percent}%</span><span>•</span>
            <span>Bank: {config.bank_percent}%</span><span>•</span>
            <span>Restock: {config.restock_percent}%</span><span>•</span>
            <span>Ops: {config.ops_percent}%</span>
          </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b"><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" />Revenue Breakdown</CardTitle></CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Sales</span><span className="text-2xl font-bold">{totalSales.toLocaleString()} MT</span></div>
          <div className="flex justify-between items-center text-destructive"><span>Less: Non-Revenue</span><span className="font-semibold">- {nonRevenueAmount.toLocaleString()} MT</span></div>
          <Separator />
          <div className="flex justify-between items-center"><span className="font-semibold text-primary">Net Revenue</span><span className="text-3xl font-bold text-primary">{netRevenue.toLocaleString()} MT</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b"><CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-primary" />The Split</CardTitle></CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"><div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-blue-600" /><span className="font-semibold">Tax ({config?.tax_percent}%)</span></div><p className="text-2xl font-bold text-blue-600">{taxAmount.toLocaleString()} MT</p></div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-purple-600" /><span className="font-semibold">Bank ({config?.bank_percent}%)</span></div><p className="text-2xl font-bold text-purple-600">{bankAmount.toLocaleString()} MT</p></div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20"><div className="flex items-center gap-2 mb-2"><Briefcase className="w-5 h-5 text-primary" /><span className="font-semibold">Operations ({config?.ops_percent}%)</span></div><p className="text-2xl font-bold text-primary">{opsAmount.toLocaleString()} MT</p></div>
            <div className={cn("p-4 rounded-lg", stockExpenses > 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-green-500/10 border border-green-500/20")}><div className="flex items-center gap-2 mb-2"><Package className={cn("w-5 h-5", stockExpenses > 0 ? "text-amber-600" : "text-green-600")} /><span className="font-semibold">Restock ({config?.restock_percent}%)</span></div><p className={cn("text-2xl font-bold", stockExpenses > 0 ? "text-amber-600" : "text-green-600")}>{restockAmount.toLocaleString()} MT</p></div>
          </div>
        </CardContent>
      </Card>

      {stockExpenses > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3 border-b bg-amber-500/5"><CardTitle className="flex items-center gap-2 text-amber-700"><AlertCircle className="w-5 h-5" />Stock Expense Adjustment</CardTitle></CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center"><span>Original Restock Allocation</span><span className="font-semibold">{restockAmount.toLocaleString()} MT</span></div>
            <div className="flex justify-between items-center text-amber-700"><span>Less: Today's Stock Expenses</span><span className="font-semibold">- {stockExpenses.toLocaleString()} MT</span></div>
            <Separator />
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-green-500/20 border border-primary/30">
              <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Action Required</p><p className="font-semibold">Deposit to Restock Account</p></div><div className="flex items-center gap-3"><ArrowRight className="w-5 h-5 text-primary" /><span className="text-3xl font-bold text-primary">{finalRestockTransfer.toLocaleString()} MT</span></div></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Expected Cash in Drawer</p><p className="text-3xl font-bold">{cashInDrawer.toLocaleString()} MT</p></div><Badge variant="outline" className="text-base px-4 py-2">{transactions.length} transactions</Badge></div>
        </CardContent>
      </Card>

      <div className="flex justify-center pb-8">
        {isClosed ? (<div className="flex items-center gap-3 text-primary"><CheckCircle2 className="w-6 h-6" /><span className="text-lg font-semibold">Day Closed Successfully</span></div>) : (
          <Button size="lg" className="px-12 h-14 text-lg" onClick={handleCloseDay} disabled={isClosing}>{isClosing ? 'Closing Day...' : <><Moon className="w-5 h-5 mr-2" />Close Day</>}</Button>
        )}
      </div>
    </div>
  );
}

export default function EndOfDay() {
  return (
    <MainLayout>
      <EndOfDayContent />
    </MainLayout>
  );
}
