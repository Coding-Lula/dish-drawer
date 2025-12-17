import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/contexts/StoreContext';
import { ingredients } from '@/data/mockData';
import { Package, AlertTriangle, TrendingDown, FileDown, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Inventory() {
  const { storeStocks, currentStore } = useStore();
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');

  const currentStoreStocks = storeStocks
    .filter(s => s.storeId === currentStore.id)
    .map(stock => {
      const ingredient = ingredients.find(i => i.id === stock.ingredientId);
      const percentageOfTarget = (stock.currentQuantity / stock.targetStock) * 100;
      const isLow = stock.currentQuantity < stock.minThreshold;
      const amountToBuy = Math.max(0, stock.targetStock - stock.currentQuantity);
      
      return {
        ...stock,
        ingredient,
        percentageOfTarget,
        isLow,
        amountToBuy,
      };
    })
    .sort((a, b) => {
      // Sort low stock first
      if (a.isLow && !b.isLow) return -1;
      if (!a.isLow && b.isLow) return 1;
      return a.percentageOfTarget - b.percentageOfTarget;
    });

  const filteredStocks = currentStoreStocks.filter(stock => {
    if (filter === 'low') return stock.isLow;
    if (filter === 'ok') return !stock.isLow;
    return true;
  });

  const lowStockCount = currentStoreStocks.filter(s => s.isLow).length;
  const restockList = currentStoreStocks.filter(s => s.amountToBuy > 0);

  const handleExportRestock = () => {
    const content = restockList.map(item => 
      `${item.ingredient?.name}: ${item.amountToBuy} ${item.ingredient?.unit} (Current: ${item.currentQuantity})`
    ).join('\n');
    
    const blob = new Blob([`Restock List - ${currentStore.name}\n${new Date().toLocaleDateString()}\n\n${content}`], 
      { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-list-${currentStore.name.toLowerCase().replace(/\s/g, '-')}.txt`;
    a.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">{currentStore.name} • Stock Levels</p>
          </div>
          <Button onClick={handleExportRestock} className="gap-2">
            <FileDown className="w-4 h-4" />
            Export Restock List
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{currentStoreStocks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={lowStockCount > 0 ? "border-destructive/50" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                lowStockCount > 0 ? "bg-destructive/20" : "bg-primary/20"
              )}>
                <AlertTriangle className={cn(
                  "w-6 h-6",
                  lowStockCount > 0 ? "text-destructive" : "text-primary"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className={cn(
                  "text-2xl font-bold",
                  lowStockCount > 0 ? "text-destructive" : "text-foreground"
                )}>{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items to Restock</p>
                <p className="text-2xl font-bold text-foreground">{restockList.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Items ({currentStoreStocks.length})
          </Button>
          <Button 
            variant={filter === 'low' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('low')}
            className={filter === 'low' ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            Low Stock ({lowStockCount})
          </Button>
          <Button 
            variant={filter === 'ok' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('ok')}
          >
            OK ({currentStoreStocks.length - lowStockCount})
          </Button>
        </div>

        {/* Stock List */}
        <div className="grid gap-3">
          {filteredStocks.map(stock => (
            <Card 
              key={stock.id}
              className={cn(
                "transition-all",
                stock.isLow && "border-destructive/50 bg-destructive/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{stock.ingredient?.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {stock.ingredient?.category}
                      </Badge>
                      {stock.isLow && (
                        <Badge variant="destructive" className="gap-1">
                          <Flame className="w-3 h-3" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mt-2">
                      <Progress 
                        value={Math.min(100, stock.percentageOfTarget)} 
                        className={cn(
                          "h-2 flex-1",
                          stock.isLow && "[&>div]:bg-destructive"
                        )}
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {Math.round(stock.percentageOfTarget)}%
                      </span>
                    </div>
                  </div>

                  {/* Stock Numbers */}
                  <div className="text-right space-y-1">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className={cn(
                        "text-2xl font-bold",
                        stock.isLow ? "text-destructive" : "text-foreground"
                      )}>
                        {stock.currentQuantity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {stock.targetStock} {stock.ingredient?.unit}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min: {stock.minThreshold} {stock.ingredient?.unit}
                    </p>
                    {stock.amountToBuy > 0 && (
                      <p className="text-xs font-medium text-amber-600">
                        Need: +{stock.amountToBuy} {stock.ingredient?.unit}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
