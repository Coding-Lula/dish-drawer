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
import { ReportLossModal } from '@/components/modals/ReportLossModal';
import { ManualAdjustmentModal } from '@/components/modals/ManualAdjustmentModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TransferInventoryModal } from '@/components/modals/TransferInventoryModal';
import { ProcessBatchModal } from '@/components/modals/ProcessBatchModal';
import { BulkStockCorrectionModal } from '@/components/modals/BulkStockCorrectionModal';
import { 
  useStoreStock, 
  useIngredients, 
  useInventoryLogs, 
  useStores,
  useInventoryTransfers,
  useSubRecipes,
  useProductionLogs
} from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { Package, AlertTriangle, TrendingDown, Flame, Edit2, Check, X, Trash2, Factory, ChevronDown, Shield, MoreHorizontal, History, Settings2, Download, RefreshCw, Layers, PlusCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { isManager } = useAuth();
  const { currentStore } = useCurrentStore();
  const { stores } = useStores();
  const { 
    stocks, 
    addMultipleStock,
    updateMinThreshold, 
    updateTargetStock,
    addItemToStore,
    manualAdjustStock,
    reportLoss,
    removeItemFromStore,
    loading: stocksLoading, 
    refetch: refetchStocks 
  } = useStoreStock(currentStore?.id || null);
  const { ingredients, addIngredient, deleteIngredient, updateIngredient, loading: ingredientsLoading, refetch: refetchIngredients } = useIngredients();
  const { getLastUnitCost, loading: logsLoading } = useInventoryLogs(currentStore?.id || null);
  const { createTransfer } = useInventoryTransfers();
  console.log('useInventoryTransfers hook:', { createTransfer: typeof createTransfer });
  const { subRecipes, refetch: refetchSubRecipes } = useSubRecipes();
  const { processBatch, refetch: refetchProduction } = useProductionLogs(currentStore?.id || null);

  const [filter, setFilter] = useState<'all' | 'low' | 'ok' | 'processed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
  }).filter(Boolean)
    .filter(item => !searchTerm || item?.ingredient?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!a || !b) return 0;
      // First sort by low stock, then alphabetically
      if (a.isLow && !b.isLow) return -1;
      if (!a.isLow && b.isLow) return 1;
      return a.ingredient.name.localeCompare(b.ingredient.name);
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
      `${'Item'.padEnd(25)} | ${'Current'.padEnd(12)} | ${'Required'.padEnd(12)} | ${'Unit Cost'.padEnd(12)} | Est. Cost`,
      '─'.repeat(85),
      ...listToDownload.map(item => {
        const name = item.ingredient.name.substring(0, 24).padEnd(25);
        const current = `${item.current_quantity} ${item.ingredient.unit}`.padEnd(12);
        const required = `${item.amountToBuy} ${item.ingredient.unit}`.padEnd(12);
        const unitCost = item.lastUnitCost ? `${item.lastUnitCost.toFixed(2)} MT`.padEnd(12) : 'N/A'.padEnd(12);
        const estCost = item.estimatedCost ? `${item.estimatedCost.toFixed(2)} MT` : 'N/A';
        return `${name} | ${current} | ${required} | ${unitCost} | ${estCost}`;
      }),
      '─'.repeat(85),
      `${'TOTAL ESTIMATED COST:'.padEnd(69)} ${totalEstimatedCost.toLocaleString()} MT`
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
  console.log('=== TRANSFER DEBUG ===');
  console.log('1. handleTransfer called with:', { fromStoreId, toStoreId, items, notes });
  console.log('2. createTransfer function exists?', typeof createTransfer);
  console.log('3. currentStore:', currentStore?.id, currentStore?.name);
  
  if (!createTransfer) {
    console.error('ERROR: createTransfer is undefined!');
    toast({ title: 'Transfer function not available', variant: 'destructive' });
    return false;
  }
  
  try {
    console.log('4. Calling createTransfer...');
    const result = await createTransfer(fromStoreId, toStoreId, items, notes);
    console.log('5. Transfer result:', result);
    
    if (result) {
      console.log('6. Transfer successful, refetching stocks...');
      refetchStocks();
    } else {
      console.log('6. Transfer returned false/undefined');
    }
    return result;
  } catch (error) {
    console.error('7. Transfer error details:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    // Check for Supabase specific error
    if (error.details) console.error('Supabase details:', error.details);
    if (error.hint) console.error('Supabase hint:', error.hint);
    if (error.code) console.error('Supabase error code:', error.code);
    
    toast({ 
      title: 'Transfer failed', 
      description: error.message || 'Unknown error occurred',
      variant: 'destructive' 
    });
    return false;
  }
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

  const handleDeleteFromStore = async (stockId: string) => {
    await removeItemFromStore(stockId);
    refetchStocks();
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventário</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Action: Repor Stock */}
          <MultiAddStockModal
            ingredients={ingredients.filter(i => existingIngredientIds.includes(i.id))}
            onSubmit={handleAddMultipleStock}
            trigger={
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 h-10 rounded-lg transition-all shadow-sm gap-2">
                <Plus className="w-4 h-4" />
                Repor Stock
              </Button>
            }
          />
          
          {/* Split Button: Novo Item */}
          {isManager && (
            <div className="flex items-center">
              <AddItemToStoreModal
                ingredients={ingredients}
                existingIngredientIds={existingIngredientIds}
                onAddItem={addItemToStore}
                trigger={
                  <Button variant="outline" className="rounded-r-none border-r-0 h-10 px-4 font-medium text-slate-700 border-slate-200 hover:bg-slate-50">
                    Novo Item
                  </Button>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-l-none h-10 px-2 border-slate-200 hover:bg-slate-50">
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <AddInventoryModal
                    onSubmit={handleAddIngredient}
                    trigger={
                      <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 rounded-sm flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" /> Criar Novo Ingrediente
                      </button>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* More Actions Utility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-lg">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isManager && (
                <>
                  <DropdownMenuItem asChild>
                    <ManualAdjustmentModal
                      ingredients={ingredients}
                      stocks={stocks}
                      onAdjust={manualAdjustStock}
                      trigger={<button className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"><Settings2 className="w-4 h-4" /> Ajuste Manual</button>}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <ReportLossModal
                      ingredients={ingredients}
                      stocks={stocks}
                      onReportLoss={reportLoss}
                      trigger={<button className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Reportar Perda</button>}
                    />
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 my-1" />
                  {stores.length > 1 && (
                    <DropdownMenuItem asChild>
                      <TransferInventoryModal
                        stores={stores}
                        ingredients={ingredients}
                        currentStoreId={currentStore?.id || ''}
                        stocks={stocks}
                        onTransfer={handleTransfer}
                        trigger={<button className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Transferir Stock</button>}
                      />
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <ProcessBatchModal
                      ingredients={ingredients}
                      subRecipes={subRecipes.map(r => ({
                        id: r.id,
                        name: r.name,
                        outputs: r.outputs.map(o => ({
                          processed_ingredient_id: o.processed_ingredient_id,
                          quantity_produced: o.quantity_produced
                        })),
                        items: r.sub_recipe_items.map(item => ({
                          raw_ingredient_id: item.raw_ingredient_id,
                          quantity_required: item.quantity_required
                        }))
                      }))}
                      stocks={stocks}
                      onProcess={handleProcessBatch}
                      trigger={<button className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"><Layers className="w-4 h-4" /> Processar Lote</button>}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <BulkStockCorrectionModal
                      stocks={stocks}
                      ingredients={ingredients}
                      storeName={currentStore?.name || ''}
                      onAdjust={manualAdjustStock}
                      onComplete={refetchStocks}
                      trigger={<button className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"><History className="w-4 h-4" /> Correção em Massa</button>}
                    />
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 my-1" />
                </>
              )}
              <DropdownMenuItem onClick={() => handleDownloadList('entire')} className="gap-2">
                <Download className="w-4 h-4" /> Baixar Lista Completa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadList('low')} className="gap-2">
                <Download className="w-4 h-4" /> Baixar Itens em Falta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Itens na Loja</p>
                <p className="text-3xl font-bold text-slate-900">{inventoryItems.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stock Baixo</p>
                <p className={cn("text-3xl font-bold", lowStockCount > 0 ? "text-rose-500" : "text-slate-900")}>
                  {lowStockCount}
                </p>
              </div>
              <div className={cn("p-3 rounded-2xl transition-colors duration-300", lowStockCount > 0 ? "bg-rose-50 group-hover:bg-rose-100" : "bg-slate-50 group-hover:bg-slate-100")}>
                <AlertTriangle className={cn("w-6 h-6", lowStockCount > 0 ? "text-rose-500" : "text-slate-400")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Restock</p>
                <p className="text-3xl font-bold text-slate-900">
                  {inventoryItems.filter(s => s.amountToBuy > 0).length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 group-hover:bg-amber-100 transition-colors duration-300">
                <TrendingDown className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Processados</p>
                <p className="text-3xl font-bold text-slate-900">{processedCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 group-hover:bg-purple-100 transition-colors duration-300">
                <Factory className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-fit">
          <TabsList className="bg-slate-100 p-1 h-11 rounded-lg">
            <TabsTrigger value="all" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Todos ({inventoryItems.length})
            </TabsTrigger>
            <TabsTrigger value="low" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Em Falta ({lowStockCount})
            </TabsTrigger>
            <TabsTrigger value="ok" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              OK ({inventoryItems.length - lowStockCount - processedCount})
            </TabsTrigger>
            <TabsTrigger value="processed" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Processados ({processedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Pesquisar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-100 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-slate-200"
          />
        </div>
      </div>
      {/* Stock List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card className="border-none shadow-sm bg-slate-50">
            <CardContent className="py-20 text-center text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum item encontrado.</p>
              <p className="text-sm">Adicione ingredientes para começar a gerir o seu stock.</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className={cn("border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden", item.isLow && "ring-1 ring-rose-100")}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{item.ingredient?.name}</h3>
                          {item.ingredient?.is_processed && (
                            <Badge className="bg-purple-50 text-purple-600 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight">
                              Processado
                            </Badge>
                          )}
                          {item.isLow && (
                            <Badge className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> Stock Baixo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{item.ingredient?.category}</p>
                      </div>

                      {/* Delete Button - Manager Only */}
                      {isManager && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-none">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-bold text-slate-900">Eliminar Item</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500">
                                Tem certeza que deseja eliminar "{item.ingredient?.name}"? Esta ação não pode ser desfeita e irá remover todo o histórico de stock associado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl border-slate-200">Cancelar</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handleDeleteFromStore(item.id)} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl border-none">
                              Eliminar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                    {/* Progress and Toggle Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            <span>Nível de Stock</span>
                            <span>{Math.round(item.percentageOfTarget)}%</span>
                          </div>
                          <Progress value={Math.min(100, item.percentageOfTarget)} className={cn("h-2 rounded-full bg-slate-100", item.isLow ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500")} />
                        </div>
                        {isManager && (
                          <div className="flex flex-col items-center gap-1.5 pt-4">
                            <Switch
                              id={`processed-${item.id}`}
                              checked={item.ingredient?.is_processed || false}
                              onCheckedChange={(checked) => handleToggleProcessed(item.ingredient_id, checked)}
                              className="data-[state=checked]:bg-purple-500"
                            />
                            <Label htmlFor={`processed-${item.id}`} className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">
                              Processado
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-4 md:w-48 md:border-l border-slate-100 md:pl-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atual</p>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-2xl font-black tracking-tight", item.isLow ? "text-rose-500" : "text-slate-900")}>
                          {item.current_quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{item.ingredient?.unit}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta / Mín</p>
                      <div className="flex items-center gap-2 group/metrics">
                        {isManager ? (
                          <div className="flex items-center gap-1">
                            {editingTarget === item.id ? (
                              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                                <Input
                                  type="number"
                                  value={targetValue}
                                  onChange={(e) => setTargetValue(e.target.value)}
                                  className="w-14 h-7 text-xs font-bold border-none bg-transparent p-0 focus-visible:ring-0"
                                  min="0"
                                  step="0.1"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveTarget(item.id)} className="text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditTarget(item.id, item.target_stock)} className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                                {item.target_stock}
                              </button>
                            )}
                            <span className="text-slate-300 text-xs">/</span>
                            {editingThreshold === item.id ? (
                              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                                <Input
                                  type="number"
                                  value={thresholdValue}
                                  onChange={(e) => setThresholdValue(e.target.value)}
                                  className="w-14 h-7 text-xs font-bold border-none bg-transparent p-0 focus-visible:ring-0"
                                  min="0"
                                  step="0.1"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveThreshold(item.id)} className="text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditThreshold(item.id, item.min_threshold)} className="text-sm font-bold text-slate-700 hover:text-rose-600 transition-colors">
                                {item.min_threshold}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-slate-700">
                            {item.target_stock} / {item.min_threshold}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 border-t border-slate-50 pt-3 md:pt-0 md:border-none">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Custo:</span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.lastUnitCost ? `${item.lastUnitCost.toFixed(0)} MT` : '--'}
                          </span>
                        </div>
                        {item.amountToBuy > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-amber-500 uppercase">Falta:</span>
                            <span className="text-xs font-bold text-amber-600">
                              +{item.amountToBuy} {item.ingredient?.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
