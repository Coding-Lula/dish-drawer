import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useDailySummaries, useExpenses } from '@/hooks/useSupabaseData';
import { exportDailyReportPDF } from '@/utils/exportUtils';
import { 
  PieChart, 
  DollarSign, 
  Users, 
  Package, 
  Building2, 
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  FileDown,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentMethods: Record<string, { isRevenue: boolean }> = {
  cash: { isRevenue: true },
  mpesa: { isRevenue: true },
  mkesh: { isRevenue: true },
  paga_facil: { isRevenue: true },
  credit: { isRevenue: false },
  self_consumption: { isRevenue: false },
};

function RevenueAllocationContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  const { expenses } = useExpenses(currentStore?.id || null);
  const { saveSummary } = useDailySummaries(currentStore?.id || null);

  // Calculate grand total from all sales
  const grandTotal = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  // Stock expenses
  const stockExpenses = expenses
    .filter(e => e.category === 'Stock' && !e.is_deducted)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Allocation state (percentages)
  const [salaryPercent, setSalaryPercent] = useState(25);
  const [restockPercent, setRestockPercent] = useState(30);
  const [taxPercent, setTaxPercent] = useState(10);
  const [miscPercent, setMiscPercent] = useState(5);

  // Calculate amounts
  const salaryAmount = (grandTotal * salaryPercent) / 100;
  const restockAmount = (grandTotal * restockPercent) / 100;
  const taxAmount = (grandTotal * taxPercent) / 100;
  const miscAmount = (grandTotal * miscPercent) / 100;
  const totalAllocated = salaryPercent + restockPercent + taxPercent + miscPercent;
  const netProfitPercent = Math.max(0, 100 - totalAllocated);
  const netProfitAmount = (grandTotal * netProfitPercent) / 100;
  const unallocated = grandTotal - (salaryAmount + restockAmount + taxAmount + miscAmount + netProfitAmount);

  const isOverAllocated = totalAllocated > 100;
  const isValid = totalAllocated <= 100;

  const handleSaveAllocation = async () => {
    if (!isValid) {
      toast({ title: 'Invalid allocation', description: 'Total cannot exceed 100%', variant: 'destructive' });
      return;
    }

    await saveSummary({
      date: new Date().toISOString().split('T')[0],
      grand_total: grandTotal,
      salary_amount: salaryAmount,
      salary_percent: salaryPercent,
      restock_amount: restockAmount - stockExpenses,
      restock_percent: restockPercent,
      tax_amount: taxAmount,
      tax_percent: taxPercent,
      misc_amount: miscAmount,
      misc_percent: miscPercent,
      net_profit: netProfitAmount,
      net_profit_percent: netProfitPercent,
    });
  };

  const handleExport = () => {
    exportDailyReportPDF(
      currentStore?.name || 'Store',
      grandTotal,
      [
        { name: 'Salaries', amount: salaryAmount, percent: salaryPercent },
        { name: 'Restock Fund', amount: restockAmount - stockExpenses, percent: restockPercent },
        { name: 'Tax Vault', amount: taxAmount, percent: taxPercent },
        { name: 'Miscellaneous', amount: miscAmount, percent: miscPercent },
        { name: 'Net Profit', amount: netProfitAmount, percent: netProfitPercent },
      ],
      stockExpenses
    );
  };

  const AllocationCard = ({ 
    icon: Icon, 
    label, 
    percent, 
    onPercentChange, 
    amount, 
    color 
  }: { 
    icon: any; 
    label: string; 
    percent: number; 
    onPercentChange: (v: number) => void; 
    amount: number;
    color: string;
  }) => (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{label}</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Slider
              value={[percent]}
              onValueChange={([v]) => onPercentChange(v)}
              max={100}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={percent}
              onChange={(e) => onPercentChange(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-20 text-center"
              min={0}
              max={100}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{amount.toLocaleString()} MT</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4">
          <PieChart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Allocation</h1>
        <p className="text-muted-foreground">{currentStore?.name} • {new Date().toLocaleDateString()}</p>
      </div>

      {/* Grand Total */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Grand Total (Today's Sales)</p>
              <p className="text-4xl font-bold text-primary">{grandTotal.toLocaleString()} MT</p>
            </div>
            <div className={cn(
              "text-right p-4 rounded-lg",
              isOverAllocated ? "bg-destructive/20" : "bg-primary/20"
            )}>
              <p className="text-sm text-muted-foreground">Unallocated</p>
              <p className={cn(
                "text-2xl font-bold",
                isOverAllocated ? "text-destructive" : "text-primary"
              )}>
                {Math.abs(unallocated).toLocaleString()} MT
              </p>
              {isOverAllocated && (
                <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                  <AlertTriangle className="w-4 h-4" />
                  Over-allocated!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Sliders */}
      <div className="grid gap-4 md:grid-cols-2">
        <AllocationCard
          icon={Users}
          label="Salaries"
          percent={salaryPercent}
          onPercentChange={setSalaryPercent}
          amount={salaryAmount}
          color="border-l-purple-500"
        />
        <AllocationCard
          icon={Package}
          label="Restock Fund"
          percent={restockPercent}
          onPercentChange={setRestockPercent}
          amount={restockAmount}
          color="border-l-green-500"
        />
        <AllocationCard
          icon={Building2}
          label="Tax Vault"
          percent={taxPercent}
          onPercentChange={setTaxPercent}
          amount={taxAmount}
          color="border-l-blue-500"
        />
        <AllocationCard
          icon={MoreHorizontal}
          label="Miscellaneous"
          percent={miscPercent}
          onPercentChange={setMiscPercent}
          amount={miscAmount}
          color="border-l-amber-500"
        />
      </div>

      {/* Stock Expense Deduction */}
      {stockExpenses > 0 && (
        <Card className="border-amber-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700 mb-2">Stock expenses will be deducted from Restock Fund:</p>
            <p className="text-lg font-semibold">{restockAmount.toLocaleString()} - {stockExpenses.toLocaleString()} = <span className="text-primary">{(restockAmount - stockExpenses).toLocaleString()} MT</span></p>
          </CardContent>
        </Card>
      )}

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
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {netProfitPercent.toFixed(1)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4 pb-8">
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export Daily Report
        </Button>
        <Button onClick={handleSaveAllocation} disabled={!isValid} className="gap-2 px-8">
          <Save className="w-4 h-4" />
          Confirm Allocation
        </Button>
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
