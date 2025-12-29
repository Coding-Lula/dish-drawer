import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RevenueBreakdown } from '@/components/dashboard/RevenueBreakdown';
import { useTransactions, useExpenses, useStoreStock, useStores } from '@/hooks/useSupabaseData';
import { useIncomeAllocations, useIncomeSources } from '@/hooks/useFinanceData';
import { DollarSign, ShoppingCart, TrendingUp, Package, Clock, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';

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
  const { stores } = useStores();
  const { sources } = useIncomeSources();
  const { allocations, getSourceTotals } = useIncomeAllocations(currentStore?.id || null);
  
  // All stores transactions for combined totals
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchAllTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (data) setAllTransactions(data);
    };
    fetchAllTransactions();
  }, []);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  
  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading store data...</p>
      </div>
    );
  }

  // Current store stats
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

  // Combined totals from ALL stores
  const todaysIncomeAllStores = allTransactions
    .filter(t => t.date?.startsWith(today))
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const mtdIncomeAllStores = allTransactions
    .filter(t => {
      const txDate = t.date?.split('T')[0];
      return txDate >= monthStart && txDate <= monthEnd;
    })
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  // Income by store for today
  const incomeByStore = stores.map(store => {
    const storeIncome = allTransactions
      .filter(t => t.store_id === store.id && t.date?.startsWith(today))
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
    return { store, income: storeIncome };
  }).filter(s => s.income > 0);

  // Income by source for the current store
  const sourceTotals = getSourceTotals(monthStart, monthEnd);

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
          title="Today's Income (All Stores)"
          value={`${todaysIncomeAllStores.toLocaleString()} MT`}
          subtitle={`${stores.length} store(s) combined`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="MTD Income (All Stores)"
          value={`${mtdIncomeAllStores.toLocaleString()} MT`}
          subtitle="Month to date total"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="Despesas de Hoje"
          value={`${totalExpenses.toLocaleString()} MT`}
          subtitle={`${stockExpenses.toLocaleString()} MT pré-gasto em estoque`}
          icon={ShoppingCart}
          variant={totalExpenses > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Alertas de Stock"
          value={lowStockCount}
          subtitle="Itens abaixo do quantidade mínimo"
          icon={Package}
          variant={lowStockCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* Income by Store */}
      {incomeByStore.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-primary" />
              Today's Income by Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {incomeByStore.map(({ store, income }) => (
                <div 
                  key={store.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{store.name}</p>
                    <p className="text-xs text-muted-foreground">{store.location}</p>
                  </div>
                  <p className="font-bold text-primary">{income.toLocaleString()} MT</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Breakdown (Current Store) */}
      {sources.length > 0 && Object.keys(sourceTotals).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-primary" />
              Income by Source ({currentStore.name} - This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {sources.map(source => {
                const income = sourceTotals[source.id] || 0;
                return (
                  <div 
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{source.name}</Badge>
                    </div>
                    <p className="font-bold text-primary">{income.toLocaleString()} MT</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
