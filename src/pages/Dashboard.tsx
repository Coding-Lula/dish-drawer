import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { RevenueBreakdown } from '@/components/dashboard/RevenueBreakdown';
import { useStore } from '@/contexts/StoreContext';
import { paymentMethods } from '@/data/mockData';
import { DollarSign, ShoppingCart, TrendingUp, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { transactions, expenses, currentStore, storeStocks } = useStore();
  
  const storeTransactions = transactions.filter(t => t.storeId === currentStore.id);
  const storeExpenses = expenses.filter(e => e.storeId === currentStore.id);
  
  const totalSales = storeTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  const revenueTransactions = storeTransactions.filter(t => {
    const method = paymentMethods.find(m => m.id === t.paymentMethodId);
    return method?.isRevenue;
  });
  const netRevenue = revenueTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  const totalExpenses = storeExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const stockExpenses = storeExpenses
    .filter(e => e.category === 'stock' && !e.isDeducted)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const currentStoreStocks = storeStocks.filter(s => s.storeId === currentStore.id);
  const lowStockCount = currentStoreStocks.filter(s => s.currentQuantity < s.minThreshold).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{currentStore.name}</h1>
          <p className="text-muted-foreground">{currentStore.location} • Today's Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Sales"
            value={`${totalSales.toLocaleString()} MT`}
            subtitle={`${storeTransactions.length} transactions`}
            icon={ShoppingCart}
            variant="default"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Net Revenue"
            value={`${netRevenue.toLocaleString()} MT`}
            subtitle="Excludes credit & self-consumption"
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Today's Expenses"
            value={`${totalExpenses.toLocaleString()} MT`}
            subtitle={`${stockExpenses.toLocaleString()} MT pre-spent on stock`}
            icon={TrendingUp}
            variant={totalExpenses > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Stock Alerts"
            value={lowStockCount}
            subtitle="Items below minimum threshold"
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
                  {storeTransactions.slice(-5).reverse().map((t, i) => {
                    const method = paymentMethods.find(m => m.id === t.paymentMethodId);
                    return (
                      <div 
                        key={t.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{method?.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Sale #{t.id.split('-')[1]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.items.length} item{t.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{t.totalAmount.toLocaleString()} MT</p>
                          {!method?.isRevenue && (
                            <p className="text-xs text-amber-600">No Revenue</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
