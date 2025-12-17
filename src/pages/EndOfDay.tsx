import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { paymentMethods, splitConfigs } from '@/data/mockData';
import { 
  Moon, 
  DollarSign, 
  Percent, 
  Building2, 
  Package, 
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EndOfDay() {
  const { toast } = useToast();
  const { transactions, expenses, currentStore } = useStore();
  const [selectedConfig, setSelectedConfig] = useState(splitConfigs[0]);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Calculate figures
  const storeTransactions = transactions.filter(t => t.storeId === currentStore.id);
  const storeExpenses = expenses.filter(e => e.storeId === currentStore.id);
  
  const totalSales = storeTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  // Non-revenue transactions (credit + self-consumption)
  const nonRevenueTransactions = storeTransactions.filter(t => {
    const method = paymentMethods.find(m => m.id === t.paymentMethodId);
    return !method?.isRevenue;
  });
  const nonRevenueAmount = nonRevenueTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  const netRevenue = totalSales - nonRevenueAmount;
  
  // Calculate splits
  const taxAmount = netRevenue * (selectedConfig.taxPercent / 100);
  const bankAmount = netRevenue * (selectedConfig.bankPercent / 100);
  const restockAmount = netRevenue * (selectedConfig.restockPercent / 100);
  const opsAmount = netRevenue * (selectedConfig.opsPercent / 100);
  
  // Stock expenses to deduct from restock pot
  const stockExpenses = storeExpenses
    .filter(e => e.category === 'stock' && !e.isDeducted)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const finalRestockTransfer = Math.max(0, restockAmount - stockExpenses);

  // Cash in drawer (only cash-equivalent payment methods)
  const cashTransactions = storeTransactions.filter(t => {
    const method = paymentMethods.find(m => m.id === t.paymentMethodId);
    return method?.isCash;
  });
  const cashInDrawer = cashTransactions.reduce((sum, t) => sum + t.totalAmount, 0) 
    - storeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCloseDay = async () => {
    setIsClosing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsClosing(false);
    setIsClosed(true);
    
    toast({
      title: "Day Closed Successfully! ✓",
      description: `Net revenue: ${netRevenue.toLocaleString()} MT`,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4">
            <Moon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">End of Day</h1>
          <p className="text-muted-foreground">{currentStore.name} • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Split Config Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Revenue Split Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {splitConfigs.map(config => (
                <Button
                  key={config.id}
                  variant={selectedConfig.id === config.id ? "default" : "outline"}
                  onClick={() => setSelectedConfig(config)}
                >
                  {config.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>Tax: {selectedConfig.taxPercent}%</span>
              <span>•</span>
              <span>Bank: {selectedConfig.bankPercent}%</span>
              <span>•</span>
              <span>Restock: {selectedConfig.restockPercent}%</span>
              <span>•</span>
              <span>Ops: {selectedConfig.opsPercent}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Sales</span>
              <span className="text-2xl font-bold text-foreground">{totalSales.toLocaleString()} MT</span>
            </div>
            
            <div className="flex justify-between items-center text-destructive">
              <div className="flex items-center gap-2">
                <span>Less: Non-Revenue</span>
                <Badge variant="outline" className="text-xs">
                  Credit + Self-Consumption
                </Badge>
              </div>
              <span className="font-semibold">- {nonRevenueAmount.toLocaleString()} MT</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold text-primary">Net Revenue</span>
              <span className="text-3xl font-bold text-primary">{netRevenue.toLocaleString()} MT</span>
            </div>
          </CardContent>
        </Card>

        {/* The Split */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              The Split ({selectedConfig.name})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-foreground">Tax ({selectedConfig.taxPercent}%)</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{taxAmount.toLocaleString()} MT</p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-foreground">Bank ({selectedConfig.bankPercent}%)</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{bankAmount.toLocaleString()} MT</p>
              </div>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Operations ({selectedConfig.opsPercent}%)</span>
                </div>
                <p className="text-2xl font-bold text-primary">{opsAmount.toLocaleString()} MT</p>
              </div>
              
              <div className={cn(
                "p-4 rounded-lg",
                stockExpenses > 0 
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "bg-green-500/10 border border-green-500/20"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className={cn("w-5 h-5", stockExpenses > 0 ? "text-amber-600" : "text-green-600")} />
                  <span className="font-semibold text-foreground">Restock ({selectedConfig.restockPercent}%)</span>
                </div>
                <p className={cn("text-2xl font-bold", stockExpenses > 0 ? "text-amber-600" : "text-green-600")}>
                  {restockAmount.toLocaleString()} MT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restock Calculation */}
        {stockExpenses > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3 border-b bg-amber-500/5">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                Stock Expense Adjustment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Original Restock Allocation</span>
                <span className="font-semibold text-foreground">{restockAmount.toLocaleString()} MT</span>
              </div>
              
              <div className="flex justify-between items-center text-amber-700">
                <span>Less: Today's Stock Cash Expenses</span>
                <span className="font-semibold">- {stockExpenses.toLocaleString()} MT</span>
              </div>
              
              <Separator />
              
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-green-500/20 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Action Required</p>
                    <p className="font-semibold text-foreground">Deposit to Restock Account</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-bold text-primary">{finalRestockTransfer.toLocaleString()} MT</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Drawer */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expected Cash in Drawer</p>
                <p className="text-3xl font-bold text-foreground">{cashInDrawer.toLocaleString()} MT</p>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {storeTransactions.length} transactions
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Close Day Button */}
        <div className="flex justify-center pb-8">
          {isClosed ? (
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg font-semibold">Day Closed Successfully</span>
            </div>
          ) : (
            <Button 
              size="lg" 
              className="px-12 h-14 text-lg"
              onClick={handleCloseDay}
              disabled={isClosing}
            >
              {isClosing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Closing Day...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  Close Day
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
