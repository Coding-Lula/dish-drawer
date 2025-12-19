import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentStore } from '@/components/layout/MainLayout';
import { useTransactions } from '@/hooks/useSupabaseData';

const PAYMENT_METHODS_CONFIG = [
  { id: 'cash', name: 'Cash', icon: '💵', isRevenue: true },
  { id: 'card', name: 'Card', icon: '💳', isRevenue: true },
  { id: 'mpesa', name: 'M-Pesa', icon: '📱', isRevenue: true },
  { id: 'credit', name: 'Credit', icon: '📝', isRevenue: false },
  { id: 'self', name: 'Self Consumption', icon: '🍽️', isRevenue: false },
];

export function RevenueBreakdown() {
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  
  if (!currentStore) {
    return null;
  }
  
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const breakdown = PAYMENT_METHODS_CONFIG.map(method => {
    const methodTransactions = transactions.filter(t => t.payment_method === method.id);
    const amount = methodTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const count = methodTransactions.length;
    return {
      ...method,
      amount,
      count,
      percentage: totalSales > 0 ? (amount / totalSales * 100) : 0,
    };
  }).filter(m => m.count > 0);

  const revenueTransactions = transactions.filter(t => {
    const method = PAYMENT_METHODS_CONFIG.find(m => m.id === t.payment_method);
    return method?.isRevenue;
  });
  const netRevenue = revenueTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Today's Revenue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total Sales</span>
          <span className="text-2xl font-bold text-foreground">{totalSales.toLocaleString()} MT</span>
        </div>
        
        <div className="h-px bg-border" />
        
        <div className="space-y-2">
          {breakdown.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                {!item.isRevenue && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    No Revenue
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">{item.amount.toLocaleString()} MT</span>
                <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
              </div>
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No sales yet today</p>
          )}
        </div>
        
        <div className="h-px bg-border" />
        
        <div className="flex items-baseline justify-between pt-2">
          <span className="text-sm font-medium text-primary">Net Revenue</span>
          <span className="text-xl font-bold text-primary">{netRevenue.toLocaleString()} MT</span>
        </div>
      </CardContent>
    </Card>
  );
}