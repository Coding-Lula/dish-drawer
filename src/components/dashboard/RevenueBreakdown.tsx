import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
import { paymentMethods } from '@/data/mockData';

export function RevenueBreakdown() {
  const { transactions, currentStore } = useStore();
  
  const storeTransactions = transactions.filter(t => t.storeId === currentStore.id);
  
  const totalSales = storeTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  const breakdown = paymentMethods.map(method => {
    const methodTransactions = storeTransactions.filter(t => t.paymentMethodId === method.id);
    const amount = methodTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const count = methodTransactions.length;
    return {
      ...method,
      amount,
      count,
      percentage: totalSales > 0 ? (amount / totalSales * 100) : 0,
    };
  }).filter(m => m.count > 0);

  const revenueTransactions = storeTransactions.filter(t => {
    const method = paymentMethods.find(m => m.id === t.paymentMethodId);
    return method?.isRevenue;
  });
  const netRevenue = revenueTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

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
