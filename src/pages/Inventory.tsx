import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { AddStockModal } from '@/components/modals/AddStockModal';
import { AddInventoryModal } from '@/components/modals/AddInventoryModal';
import { useStoreStock, useIngredients } from '@/hooks/useSupabaseData';
import { Package, AlertTriangle, TrendingDown, FileDown, Flame, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function InventoryContent() {
  const { currentStore } = useCurrentStore();
  const { stocks, addStock, updateMinThreshold, loading: stocksLoading, refetch: refetchStocks } = useStoreStock(currentStore?.id || null);
  const { ingredients, addIngredient, loading: ingredientsLoading } = useIngredients();
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState('');

  const loading = stocksLoading || ingredientsLoading;

  const currentStoreStocks = stocks.map(stock => {
    const ingredient = ingredients.find(i => i.id === stock.ingredient_id);
    const percentageOfTarget = stock.target_stock > 0 ? (stock.current_quantity / stock.target_stock) * 100 : 0;
    const isLow = stock.current_quantity < stock.min_threshold;
    const amountToBuy = Math.max(0, stock.target_stock - stock.current_quantity);
    
    return {
      ...stock,
      ingredient,
      percentageOfTarget,
      isLow,
      amountToBuy,
    };
  }).sort((a, b) => {
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
      `${item.ingredient?.name}: ${item.amountToBuy} ${item.ingredient?.unit} (Current: ${item.current_quantity})`
    ).join('\n');
    
    const blob = new Blob([`Restock List - ${currentStore?.name}\n${new Date().toLocaleDateString()}\n\n${content}`], 
      { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-list-${currentStore?.name?.toLowerCase().replace(/\s/g, '-')}.txt`;
    a.click();
  };

  const handleAddStock = async (ingredientId: string, quantity: number, totalCost: number) => {
    const result = await addStock(ingredientId, quantity, totalCost);
    return result;
  };

  const handleAddIngredient = async (ingredient: { name: string; unit: string; category: string; average_cost: number }) => {
    const result = await addIngredient(ingredient);
    if (result && currentStore) {
      refetchStocks();
    }
    return result;
  };

  const handleEditThreshold = (stockId: string, currentValue: number) => {
    setEditingThreshold(stockId);
    setThresholdValue(currentValue.toString());
  };

  const handleSaveThreshold = async (stockId: string) => {
    const value = parseFloat(thresholdValue);
    if (!isNaN(value) && value >= 0) {
      await updateMinThreshold(stockId, value);
    }
    setEditingThreshold(null);
    setThresholdValue('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">{currentStore?.name} • Stock Levels</p>
        </div>
        <div className="flex gap-2">
          <AddInventoryModal onSubmit={handleAddIngredient} />
          <AddStockModal ingredients={ingredients} onSubmit={handleAddStock} />
          <Button onClick={handleExportRestock} variant="outline" className="gap-2">
            <FileDown className="w-4 h-4" />
            Export Restock List
          </Button>
        </div>
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
              <p className="text-2xl font-bold text-foreground">{ingredients.length}</p>
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
        {filteredStocks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No stock items found. Add stock to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredStocks.map(stock => (
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
                        {stock.current_quantity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {stock.target_stock} {stock.ingredient?.unit}
                      </span>
                    </div>
                    
                    {/* Editable Min Threshold */}
                    <div className="flex items-center gap-1 justify-end">
                      {editingThreshold === stock.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={thresholdValue}
                            onChange={(e) => setThresholdValue(e.target.value)}
                            className="w-16 h-6 text-xs p-1"
                            min="0"
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveThreshold(stock.id)}>
                            <Check className="w-3 h-3 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingThreshold(null)}>
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEditThreshold(stock.id, stock.min_threshold)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Min: {stock.min_threshold} {stock.ingredient?.unit}
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {stock.amountToBuy > 0 && (
                      <p className="text-xs font-medium text-amber-600">
                        Need: +{stock.amountToBuy} {stock.ingredient?.unit}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Unit Cost: {stock.ingredient?.average_cost?.toFixed(2)} MT
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function Inventory() {
  return (
    <MainLayout>
      <InventoryContent />
    </MainLayout>
  );
}
