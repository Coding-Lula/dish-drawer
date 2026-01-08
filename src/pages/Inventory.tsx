import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MultiAddStockModal } from '@/components/modals/MultiAddStockModal';
import { AddInventoryModal } from '@/components/modals/AddInventoryModal';
import { AddItemToStoreModal } from '@/components/modals/AddItemToStoreModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TransferInventoryModal } from '@/components/modals/TransferInventoryModal';
import { ProcessBatchModal } from '@/components/modals/ProcessBatchModal';
import { 
  useStoreStock, 
  useIngredients, 
  useInventoryLogs, 
  useStores,
  useInventoryTransfers,
  useSubRecipes,
  useProductionLogs
} from '@/hooks/useSupabaseData';
import { Package, AlertTriangle, TrendingDown, Flame, Edit2, Check, X, Trash2, Factory, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

function InventoryContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { stores } = useStores();
  const { 
    stocks, 
    addMultipleStock,
    updateMinThreshold, 
    updateTargetStock,
    addItemToStore,
    loading: stocksLoading, 
    refetch: refetchStocks 
  } = useStoreStock(currentStore?.id || null);
  const { ingredients, addIngredient, deleteIngredient, updateIngredient, loading: ingredientsLoading, refetch: refetchIngredients } = useIngredients();
  const { getLastUnitCost, loading: logsLoading } = useInventoryLogs(currentStore?.id || null);
  const { createTransfer } = useInventoryTransfers();
  const { subRecipes, refetch: refetchSubRecipes } = useSubRecipes();
  const { processBatch, refetch: refetchProduction } = useProductionLogs(currentStore?.id || null);

  const [filter, setFilter] = useState<'all' | 'low' | 'ok' | 'processed'>('all');
  const [editingField, setEditingField] = useState<{ id: string; field: 'min' | 'target' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState('');

  const loading = stocksLoading || ingredientsLoading || logsLoading;

  // Only show items that exist in store_stock for this store
  const inventoryItems = stocks.map(stock => {
    const ingredient = ingredients.find(i => i.id === stock.ingredient_id);
    if (!ingredient) return null;
    
    const currentQuantity = stock.current_quantity;
    const minThreshold = stock.min_threshold;
    const targetStock = stock.target_stock;
    const percentageOfTarget = targetStock > 0 ? (currentQuantity / targetStock) * 100 : 0;
    const isLow = currentQuantity < minThreshold;
    const amountToBuy = Math.max(0, targetStock - currentQuantity);
    const lastUnitCost = getLastUnitCost(stock.ingredient_id);
    const estimatedCost = lastUnitCost ? amountToBuy * lastUnitCost : null;
    
    return {
      id: stock.id,
      ingredient_id: stock.ingredient_id,
      ingredient,
      current_quantity: currentQuantity,
      min_threshold: minThreshold,
      target_stock: targetStock,
      percentageOfTarget,
      isLow,
      amountToBuy,
      hasStock: true,
      lastUnitCost,
      estimatedCost
    };
  }).filter(Boolean).sort((a, b) => {
    if (!a || !b) return 0;
    if (a.isLow && !b.isLow) return -1;
    if (!a.isLow && b.isLow) return 1;
    return a.percentageOfTarget - b.percentageOfTarget;
  }) as NonNullable<typeof inventoryItems[number]>[];

  // Get ingredient IDs already in store
  const existingIngredientIds = stocks.map(s => s.ingredient_id);

  const filteredItems = inventoryItems.filter(item => {
    if (filter === 'low') return item.isLow;
    if (filter === 'ok') return !item.isLow && !item.ingredient?.is_processed;
    if (filter === 'processed') return item.ingredient?.is_processed;
    return true;
  });

  const lowStockCount = inventoryItems.filter(s => s.isLow).length;
  const processedCount = inventoryItems.filter(s => s.ingredient?.is_processed).length;

  const handleDownloadList = (type: 'entire' | 'low') => {
    const listToDownload = type === 'entire'
      ? inventoryItems.filter(item => item.amountToBuy > 0)
      : inventoryItems.filter(item => item.isLow);

    const totalEstimatedCost = listToDownload.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

    const lines = [
      `RESTOCK LIST (${type.toUpperCase()}) - ${currentStore?.name}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `${'Item'.padEnd(25)} | ${'Required'.padEnd(12)} | ${'Unit Cost'.padEnd(12)} | Est. Cost`,
      '─'.repeat(70),
      ...listToDownload.map(item => {
        const name = item.ingredient.name.substring(0, 24).padEnd(25);
        const required = `${item.amountToBuy} ${item.ingredient.unit}`.padEnd(12);
        const unitCost = item.lastUnitCost ? `${item.lastUnitCost.toFixed(2)} MT`.padEnd(12) : 'N/A'.padEnd(12);
        const estCost = item.estimatedCost ? `${item.estimatedCost.toFixed(2)} MT` : 'N/A';
        return `${name} | ${required} | ${unitCost} | ${estCost}`;
      }),
      '─'.repeat(70),
      `${'TOTAL ESTIMATED COST:'.padEnd(54)} ${totalEstimatedCost.toLocaleString()} MT`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-list-${type}-${currentStore?.name?.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTransfer = async (fromStoreId: string, toStoreId: string, items: { ingredientId: string; quantity: number }[], notes?: string) => {
    const result = await createTransfer(fromStoreId, toStoreId, items, notes);
    if (result) {
      refetchStocks();
    }
    return result;
  };

  const handleProcessBatch = async (subRecipeId: string, quantity: number) => {
    const result = await processBatch(subRecipeId, quantity, ingredients, stocks);
    if (result) {
      refetchStocks();
      refetchIngredients();
      refetchProduction();
    }
    return result;
  };

  const handleToggleProcessed = async (ingredientId: string, isProcessed: boolean) => {
    const success = await updateIngredient(ingredientId, { is_processed: isProcessed });
    if (success) {
      refetchIngredients();
    }
  };

  const handleAddMultipleStock = async (items: { ingredientId: string; quantity: number; totalCost: number }[]) => {
    if (!currentStore?.id) {
      toast({ title: 'Selecione uma loja primeiro', variant: 'destructive' });
      return false;
    }
    const result = await addMultipleStock(items, currentStore.id);
    if (result) {
      refetchStocks();
      refetchIngredients();
    }
    return result;
  };

  const handleAddIngredient = async (ingredient: { name: string; unit: string; category: string; average_cost: number }) => {
    const result = await addIngredient(ingredient);
    if (result && currentStore) {
      refetchStocks();
    }
    return result;
  };

  const handleEditField = (stockId: string, field: 'min' | 'target', currentValue: number) => {
    setEditingField({ id: stockId, field });
    setEditValue(currentValue.toString());
  };

  const handleSaveField = async () => {
    if (!editingField) return;
    const value = parseFloat(editValue);
    if (!isNaN(value) && value >= 0) {
      if (editingField.field === 'min') {
        await updateMinThreshold(editingField.id, value);
      } else {
        await updateTargetStock(editingField.id, value);
      }
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    await deleteIngredient(ingredientId);
    refetchStocks();
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

  const handleEditTarget = (stockId: string, currentValue: number) => {
    setEditingTarget(stockId);
    setTargetValue(currentValue.toString());
  };

  const handleSaveTarget = async (stockId: string) => {
    const value = parseFloat(targetValue);
    if (!isNaN(value) && value >= 0) {
      await updateTargetStock(stockId, value);
    }
    setEditingTarget(null);
    setTargetValue('');
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
          <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground">{currentStore?.name} • Nível de Stock</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddItemToStoreModal 
            ingredients={ingredients} 
            existingIngredientIds={existingIngredientIds} 
            onAddItem={addItemToStore} 
          />
          <AddInventoryModal onSubmit={handleAddIngredient} />
          <MultiAddStockModal ingredients={ingredients.filter(i => existingIngredientIds.includes(i.id))} onSubmit={handleAddMultipleStock} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Baixar Lista de Stock
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownloadList('entire')}>Download Entire List</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadList('low')}>Download Low List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {stores.length > 1 && (
            <TransferInventoryModal
              stores={stores}
              ingredients={ingredients}
              currentStoreId={currentStore?.id || ''}
              stocks={stocks}
              onTransfer={handleTransfer}
            />
          )}
          <ProcessBatchModal
            ingredients={ingredients}
            subRecipes={subRecipes}
            stocks={stocks}
            onProcess={handleProcessBatch}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Itens na Loja</p>
              <p className="text-2xl font-bold text-foreground">{inventoryItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-lg", lowStockCount > 0 ? "bg-destructive/20" : "bg-primary/20")}>
              <AlertTriangle className={cn("w-6 h-6", lowStockCount > 0 ? "text-destructive" : "text-primary")} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Itens com Stock Baixo</p>
              <p className={cn("text-2xl font-bold", lowStockCount > 0 ? "text-destructive" : "text-foreground")}>{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Itens para Restock</p>
              <p className="text-2xl font-bold text-foreground">{inventoryItems.filter(s => s.amountToBuy > 0).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Factory className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processados</p>
              <p className="text-2xl font-bold text-foreground">{processedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === 'all' ? "default" : "outline"} size="sm" onClick={() => setFilter('all')}>
          Todos Itens ({inventoryItems.length})
        </Button>
        <Button 
          variant={filter === 'low' ? "default" : "outline"} size="sm" onClick={() => setFilter('low')}
          className={filter === 'low' ? "bg-destructive hover:bg-destructive/90" : ""}
        >
          Stock Baixo ({lowStockCount})
        </Button>
        <Button variant={filter === 'ok' ? "default" : "outline"} size="sm" onClick={() => setFilter('ok')}>
          OK ({inventoryItems.length - lowStockCount - processedCount})
        </Button>
        <Button variant={filter === 'processed' ? "default" : "outline"} size="sm" onClick={() => setFilter('processed')}>
          <Factory className="w-3 h-3 mr-1" /> Processados ({processedCount})
        </Button>
      </div>

      {/* Stock List */}
      <div className="grid gap-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No inventory items found. Add ingredients to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className={cn("transition-all", item.isLow && "border-destructive/50 bg-destructive/5")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground">{item.ingredient?.name}</h3>
                      <Badge variant="outline" className="text-xs">{item.ingredient?.category}</Badge>
                      {item.ingredient?.is_processed && (
                        <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                          <Factory className="w-3 h-3" />Processado
                        </Badge>
                      )}
                      {item.isLow && (
                        <Badge variant="destructive" className="gap-1"><Flame className="w-3 h-3" />Stock Baixo</Badge>
                      )}
                    </div>
                    {/* Toggle for Processed Ingredient */}
                    <div className="flex items-center gap-4 mt-1 mb-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`processed-${item.id}`}
                          checked={item.ingredient?.is_processed || false}
                          onCheckedChange={(checked) => handleToggleProcessed(item.ingredient_id, checked)}
                        />
                        <Label htmlFor={`processed-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          Ingrediente Processado
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={Math.min(100, item.percentageOfTarget)} className={cn("h-2 flex-1", item.isLow && "[&>div]:bg-destructive")} />
                      <span className="text-sm text-muted-foreground w-12 text-right">{Math.round(item.percentageOfTarget)}%</span>
                    </div>
                  </div>

                  {/* Stock Numbers */}
                  <div className="text-right space-y-2">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className={cn("text-2xl font-bold", item.isLow ? "text-destructive" : "text-foreground")}>{item.current_quantity}</span>
                      {item.hasStock && editingField?.id === item.id && editingField?.field === 'target' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">/</span>
                          <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-16 h-6 text-xs p-1" min="0" />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveField}><Check className="w-3 h-3 text-primary" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingField(null)}><X className="w-3 h-3 text-destructive" /></Button>
                        </div>
                      ) : (
                        <button onClick={() => item.hasStock && handleEditField(item.id, 'target', item.target_stock)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                          / {item.target_stock} {item.ingredient?.unit}
                          {item.hasStock && <Edit2 className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    
                    {/* Target Stock Editing */}
                    {item.hasStock && (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-muted-foreground">Target:</span>
                        {editingTarget === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={targetValue}
                              onChange={(e) => setTargetValue(e.target.value)}
                              className="w-16 h-6 text-xs p-1"
                              min="0"
                              step="0.1"
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveTarget(item.id)}>
                              <Check className="w-3 h-3 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTarget(null)}>
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEditTarget(item.id, item.target_stock)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {item.target_stock} {item.ingredient?.unit}
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Min Threshold Editing */}
                    {item.hasStock && (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-muted-foreground">Min:</span>
                        {editingThreshold === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) => setThresholdValue(e.target.value)}
                              className="w-16 h-6 text-xs p-1"
                              min="0"
                              step="0.1"
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveThreshold(item.id)}>
                              <Check className="w-3 h-3 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingThreshold(null)}>
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEditThreshold(item.id, item.min_threshold)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {item.min_threshold} {item.ingredient?.unit}
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {item.amountToBuy > 0 && (
                      <p className="text-xs font-medium text-amber-600">
                        Need: +{item.amountToBuy} {item.ingredient?.unit}
                        {item.estimatedCost && <span className="ml-1">(~{item.estimatedCost.toFixed(0)} MT)</span>}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Last Cost: {item.lastUnitCost ? `${item.lastUnitCost.toFixed(2)} MT/${item.ingredient?.unit}` : 'N/A'}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja eliminar "{item.ingredient?.name}"? Esta ação não pode ser desfeita e irá remover todo o histórico de stock associado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteIngredient(item.ingredient_id)} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
