import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RevenueBreakdown } from '@/components/dashboard/RevenueBreakdown';
import { useTransactions, useExpenses, useStoreStock } from '@/hooks/useSupabaseData';
import { DollarSign, ShoppingCart, TrendingUp, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PAYMENT_METHODS_CONFIG = [
  { id: 'cash', name: 'Cash', icon: '💵', isRevenue: true },
  { id: 'card', name: 'Card', icon: '💳', isRevenue: true },
  { id: 'mpesa', name: 'M-Pesa', icon: '📱', isRevenue: true },
  { id: 'credit', name: 'Credit', icon: '📝', isRevenue: false },
  { id: 'self', name: 'Self Consumption', icon: '🍽️', isRevenue: false },
];

function DashboardContent() {
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  const { expenses } = useExpenses(currentStore?.id || null);
  const { stocks } = useStoreStock(currentStore?.id || null);
  
  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading store data...</p>
      </div>
    );
  }

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const revenueTransactions = transactions.filter(t => {
    const method = PAYMENT_METHODS_CONFIG.find(m => m.id === t.payment_method);
    return method?.isRevenue;
  });
  const netRevenue = revenueTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const stockExpenses = expenses
    .filter(e => e.category === 'stock' && !e.is_deducted)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const lowStockCount = stocks.filter(s => s.current_quantity < s.min_threshold).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{currentStore.name}</h1>
        <p className="text-muted-foreground">{currentStore.location} • Visão geral de hoje</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={`${totalSales.toLocaleString()} MT`}
          subtitle={`${transactions.length} transactions`}
          icon={ShoppingCart}
          variant="default"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Receita Líquida"
          value={`${netRevenue.toLocaleString()} MT`}
          subtitle="Excludes credit & self-consumption"
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Despesas de Hoje"
          value={`${totalExpenses.toLocaleString()} MT`}
          subtitle={`${stockExpenses.toLocaleString()} MT pré-gasto em estoque`}
          icon={TrendingUp}
          variant={totalExpenses > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Alertas de Stock "
          value={lowStockCount}
          subtitle="Itens abaixo do quantidade mínimo"
          icon={Package}
          variant={lowStockCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Breakdown */}
        <div className="lg:col-span-1">
          <RevenueBreakdown />
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1">
          <LowStockAlerts />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => {
                  const method = PAYMENT_METHODS_CONFIG.find(m => m.id === t.payment_method);
                  return (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{method?.icon || '💰'}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Sale #{t.id.split('-')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {method?.name || t.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{Number(t.total_amount).toLocaleString()} MT</p>
                        {method && !method.isRevenue && (
                          <p className="text-xs text-amber-600">No Revenue</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions yet today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  );
}
