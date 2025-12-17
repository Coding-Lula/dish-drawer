import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { ingredients } from '@/data/mockData';

export function LowStockAlerts() {
  const { storeStocks, currentStore } = useStore();
  
  const lowStockItems = storeStocks
    .filter(stock => stock.storeId === currentStore.id && stock.currentQuantity < stock.minThreshold)
    .map(stock => {
      const ingredient = ingredients.find(i => i.id === stock.ingredientId);
      return {
        ...stock,
        ingredientName: ingredient?.name || 'Unknown',
        unit: ingredient?.unit || 'units',
      };
    });

  return (
    <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Low Stock Alerts
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {lowStockItems.length} items
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">All stock levels are healthy! ✓</p>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ingredientName}</p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.minThreshold} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-destructive">{item.currentQuantity} {item.unit}</p>
                  <p className="text-xs text-muted-foreground">
                    Need: {item.minThreshold - item.currentQuantity} more
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
