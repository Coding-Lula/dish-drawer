import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransactions, useExpenses, useSplitConfigs } from '@/hooks/useSupabaseData';
import { useState, useEffect } from 'react';
import { 
  Moon, 
  DollarSign, 
  Percent, 
  Building2, 
  Package, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Save,
  FileDown,
  PieChart,
  X,
  Palette,
  Type,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportDailyReportPDF } from '@/utils/exportUtils';

const paymentMethods = {
  cash: { isRevenue: true, isCash: true },
  mpesa: { isRevenue: true, isCash: true },
  mkesh: { isRevenue: true, isCash: true },
  paga_facil: { isRevenue: true, isCash: true },
  credit: { isRevenue: false, isCash: false },
  self_consumption: { isRevenue: false, isCash: false },
};

// Default allocations with icons and colors
const DEFAULT_ALLOCATIONS = [
  { 
    id: 'tax', 
    name: 'Tax', 
    percent: 10, 
    color: 'border-l-blue-500', 
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    icon: Building2, 
    editable: true 
  },
  { 
    id: 'bank', 
    name: 'Bank', 
    percent: 20, 
    color: 'border-l-purple-500', 
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    icon: DollarSign, 
    editable: true 
  },
  { 
    id: 'restock', 
    name: 'Restock', 
    percent: 30, 
    color: 'border-l-green-500', 
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    icon: Package, 
    editable: true 
  },
  { 
    id: 'ops', 
    name: 'Operations', 
    percent: 40, 
    color: 'border-l-primary', 
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
    icon: Briefcase, 
    editable: true 
  },
];

// Color options for new allocations
const COLOR_OPTIONS = [
  { name: 'Blue', value: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  { name: 'Purple', value: 'border-l-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  { name: 'Green', value: 'border-l-green-500', bg: 'bg-green-500/10', text: 'text-green-600' },
  { name: 'Red', value: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-600' },
  { name: 'Yellow', value: 'border-l-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  { name: 'Pink', value: 'border-l-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-600' },
  { name: 'Indigo', value: 'border-l-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
  { name: 'Gray', value: 'border-l-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-600' },
];

function EndOfDayContent() {
  const { toast } = useToast();
  const { currentStore } = useCurrentStore();
  const { transactions } = useTransactions(currentStore?.id || null);
  const { expenses } = useExpenses(currentStore?.id || null);
  const { configs, updateConfig, createConfig, deleteConfig } = useSplitConfigs();
  
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  
  // Allocation management state
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS);
  const [isEditingAllocations, setIsEditingAllocations] = useState(false);
  const [showNewAllocationForm, setShowNewAllocationForm] = useState(false);
  const [newAllocation, setNewAllocation] = useState({ 
    name: '', 
    percent: 0, 
    color: 'border-l-gray-500',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-600'
  });

  // Initialize with default config
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      const defaultConfig = configs.find(c => c.is_default) || configs[0];
      setSelectedConfig(defaultConfig);
    }
  }, [configs, selectedConfig]);

  // Calculate financial metrics
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const nonRevenueAmount = transactions
    .filter(t => !paymentMethods[t.payment_method]?.isRevenue)
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  const netRevenue = totalSales - nonRevenueAmount;
  
  const stockExpenses = expenses
    .filter(e => e.category === 'Stock' && !e.is_deducted)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Calculate allocation amounts
  const calculateAllocationAmount = (percent) => {
    return (netRevenue * percent) / 100;
  };

  // Allocation management functions
  const handlePercentChange = (id, newPercent) => {
    setAllocations(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, percent: Math.max(0, Math.min(100, newPercent)) }
          : item
      )
    );
  };

  const handleAddAllocation = () => {
    if (!newAllocation.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }

    if (newAllocation.percent < 0 || newAllocation.percent > 100) {
      toast({ title: 'Error', description: 'Percentage must be between 0-100', variant: 'destructive' });
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      name: newAllocation.name,
      percent: newAllocation.percent,
      color: newAllocation.color,
      bgColor: newAllocation.bgColor,
      textColor: newAllocation.textColor,
      icon: Package, // Default icon
      editable: true
    };

    setAllocations(prev => [...prev, newItem]);
    setNewAllocation({ 
      name: '', 
      percent: 0, 
      color: 'border-l-gray-500',
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-600'
    });
    setShowNewAllocationForm(false);
    
    toast({ title: 'Success', description: 'Allocation added' });
  };

  const handleDeleteAllocation = (id) => {
    if (allocations.length <= 1) {
      toast({ title: 'Error', description: 'Cannot delete the last allocation', variant: 'destructive' });
      return;
    }

    setAllocations(prev => prev.filter(item => item.id !== id));
    toast({ title: 'Success', description: 'Allocation removed' });
  };

  const handleSaveAllocations = () => {
    if (totalAllocatedPercent > 100) {
      toast({ title: 'Error', description: 'Total cannot exceed 100%', variant: 'destructive' });
      return;
    }

    setIsEditingAllocations(false);
    toast({ title: 'Success', description: 'Allocations saved' });
  };

  // Configuration management
  const handleCreateConfig = async () => {
    if (!newConfigName.trim()) {
      toast({ title: 'Error', description: 'Please enter a configuration name', variant: 'destructive' });
      return;
    }

    const newConfig = {
      name: newConfigName,
      tax_percent: allocations.find(a => a.id === 'tax')?.percent || 10,
      bank_percent: allocations.find(a => a.id === 'bank')?.percent || 20,
      restock_percent: allocations.find(a => a.id === 'restock')?.percent || 30,
      ops_percent: allocations.find(a => a.id === 'ops')?.percent || 40,
      is_default: false
    };

    try {
      const createdConfig = await createConfig(newConfig);
      setSelectedConfig(createdConfig);
      setNewConfigName('');
      setShowNewConfig(false);
      toast({ title: 'Success', description: 'Configuration created successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create configuration', variant: 'destructive' });
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    const updatedConfig = {
      ...selectedConfig,
      tax_percent: allocations.find(a => a.id === 'tax')?.percent || 10,
      bank_percent: allocations.find(a => a.id === 'bank')?.percent || 20,
      restock_percent: allocations.find(a => a.id === 'restock')?.percent || 30,
      ops_percent: allocations.find(a => a.id === 'ops')?.percent || 40
    };

    try {
      await updateConfig(selectedConfig.id, updatedConfig);
      setSelectedConfig(updatedConfig);
      toast({ title: 'Success', description: 'Configuration updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update configuration', variant: 'destructive' });
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (configs.length <= 1) {
      toast({ title: 'Error', description: 'Cannot delete the last configuration', variant: 'destructive' });
      return;
    }

    try {
      await deleteConfig(configId);
      const remainingConfigs = configs.filter(c => c.id !== configId);
      setSelectedConfig(remainingConfigs[0]);
      toast({ title: 'Success', description: 'Configuration deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete configuration', variant: 'destructive' });
    }
  };

  const handleCloseDay = async () => {
    if (totalAllocatedPercent > 100) {
      toast({ 
        title: 'Invalid allocation', 
        description: 'Total allocation cannot exceed 100%', 
        variant: 'destructive' 
      });
      return;
    }

    setIsClosing(true);
    
    try {
      // Save current configuration if modified
      if (selectedConfig && isEditingAllocations) {
        await handleUpdateConfig();
      }

      // Simulate closing process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsClosing(false);
      setIsClosed(true);
      setIsEditingAllocations(false);
      
      toast({ 
        title: 'Day Closed Successfully!', 
        description: `Net revenue: ${netRevenue.toLocaleString()} MT`
      });
    } catch (error) {
      setIsClosing(false);
      toast({ 
        title: 'Error', 
        description: 'Failed to close day', 
        variant: 'destructive' 
      });
    }
  };

  const handleExport = () => {
    const allocationData = allocations.map(item => ({
      name: item.name,
      amount: calculateAllocationAmount(item.percent),
      percent: item.percent
    }));

    exportDailyReportPDF(
      currentStore?.name || 'Store',
      totalSales,
      allocationData,
      stockExpenses,
      //netRevenue
    );
  };

  // Calculate totals
  const totalAllocatedPercent = allocations.reduce((sum, item) => sum + item.percent, 0);
  const remainingPercent = 100 - totalAllocatedPercent;
  const isOverAllocated = totalAllocatedPercent > 100;
  
  const restockAllocation = allocations.find(a => a.id === 'restock');
  const restockAmount = restockAllocation ? calculateAllocationAmount(restockAllocation.percent) : 0;
  const finalRestockTransfer = Math.max(0, restockAmount - stockExpenses);

  const cashInDrawer = transactions
    .filter(t => paymentMethods[t.payment_method]?.isCash)
    .reduce((sum, t) => sum + Number(t.total_amount), 0) - 
    expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4">
          <Moon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">End of Day</h1>
        <p className="text-muted-foreground">{currentStore?.name} • {new Date().toLocaleDateString()}</p>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Sales</span>
            <span className="text-2xl font-bold">{totalSales.toLocaleString()} MT</span>
          </div>
          <div className="flex justify-between items-center text-destructive">
            <span>Less: Non-Revenue</span>
            <span className="font-semibold">- {nonRevenueAmount.toLocaleString()} MT</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">Net Revenue</span>
            <span className="text-3xl font-bold text-primary">{netRevenue.toLocaleString()} MT</span>
          </div>
        </CardContent>
      </Card>

      {/* The Split - Enhanced Allocation Manager */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              The Split - Revenue Allocation
              {isOverAllocated && (
                <Badge variant="destructive" className="ml-2">
                  Over-allocated!
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isEditingAllocations ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAllocations(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Edit Allocations
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingAllocations(false);
                      // Reset to current config values
                      if (selectedConfig) {
                        setAllocations(DEFAULT_ALLOCATIONS.map(item => ({
                          ...item,
                          percent: selectedConfig[`${item.id}_percent`] || item.percent
                        })));
                      }
                    }}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAllocations}
                    disabled={isOverAllocated}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
          <CardDescription className="flex items-center justify-between">
            <span>Adjust how revenue is distributed</span>
            <div className={cn(
              "text-sm font-medium",
              isOverAllocated ? "text-destructive" : "text-muted-foreground"
            )}>
              Total: {totalAllocatedPercent.toFixed(1)}% / 100%
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Allocations Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {allocations.map((item) => {
              const Icon = item.icon;
              const amount = calculateAllocationAmount(item.percent);
              const isRestock = item.id === 'restock' || item.name.toLowerCase().includes('restock');
              const hasStockExpenses = isRestock && stockExpenses > 0;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-lg border relative",
                    item.color,
                    hasStockExpenses ? "bg-amber-500/10 border-amber-500/20" : item.bgColor
                  )}
                >
                  {/* Delete Button (visible when editing) */}
                  {isEditingAllocations && item.editable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAllocation(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn(
                      "w-5 h-5",
                      hasStockExpenses ? "text-amber-600" : item.textColor
                    )} />
                    <span className="font-semibold">
                      {item.name} 
                      {isEditingAllocations ? (
                        <Input
                          type="number"
                          value={item.percent}
                          onChange={(e) => handlePercentChange(item.id, Number(e.target.value))}
                          className="w-16 ml-2 inline text-center"
                          min={0}
                          max={100}
                        />
                      ) : (
                        ` (${item.percent}%)`
                      )}
                    </span>
                  </div>

                  {/* Slider (only in edit mode) */}
                  {isEditingAllocations && (
                    <div className="mb-3">
                      <Slider
                        value={[item.percent]}
                        onValueChange={([value]) => handlePercentChange(item.id, value)}
                        max={100}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* Amount Display */}
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-2xl font-bold",
                      hasStockExpenses ? "text-amber-600" : item.textColor
                    )}>
                      {amount.toLocaleString()} MT
                    </p>
                    
                    {/* Adjust buttons (only in edit mode) */}
                    {isEditingAllocations && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handlePercentChange(item.id, Math.max(0, item.percent - 1))}
                        >
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handlePercentChange(item.id, Math.min(100, item.percent + 1))}
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stock Expense Warning for Restock */}
                  {hasStockExpenses && stockExpenses > 0 && (
                    <div className="mt-2 p-2 text-xs rounded bg-amber-500/10 border border-amber-500/20">
                      <div className="flex justify-between">
                        <span className="text-amber-700">Stock Expenses:</span>
                        <span className="font-semibold text-amber-700">-{stockExpenses.toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-amber-700">Available:</span>
                        <span className="font-bold text-amber-700">
                          {(amount - stockExpenses).toLocaleString()} MT
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add New Allocation Form */}
            {isEditingAllocations && showNewAllocationForm && (
              <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Allocation name"
                      value={newAllocation.name}
                      onChange={(e) => setNewAllocation(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Percentage</span>
                      <Input
                        type="number"
                        value={newAllocation.percent}
                        onChange={(e) => setNewAllocation(prev => ({ 
                          ...prev, 
                          percent: Math.min(100, Math.max(0, Number(e.target.value))) 
                        }))}
                        className="w-20 text-center"
                        min={0}
                        max={100}
                      />
                    </div>
                    <Slider
                      value={[newAllocation.percent]}
                      onValueChange={([value]) => setNewAllocation(prev => ({ ...prev, percent: value }))}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Color</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewAllocation(prev => ({ 
                            ...prev, 
                            color: color.value,
                            bgColor: color.bg,
                            textColor: color.text
                          }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2",
                            color.bg.replace('/10', ''),
                            newAllocation.color === color.value 
                              ? 'border-gray-900 dark:border-gray-100' 
                              : 'border-transparent'
                          )}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddAllocation}
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Allocation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewAllocationForm(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Allocation Button */}
            {isEditingAllocations && !showNewAllocationForm && allocations.length < 8 && (
              <button
                onClick={() => setShowNewAllocationForm(true)}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col items-center justify-center min-h-[150px]"
              >
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-muted-foreground">Add New Allocation</span>
              </button>
            )}
          </div>

          {/* Allocation Summary */}
          <div className={cn(
            "mt-6 p-4 rounded-lg border",
            isOverAllocated 
              ? "bg-destructive/10 border-destructive/30" 
              : remainingPercent >= 0 
                ? "bg-primary/10 border-primary/30" 
                : "bg-amber-500/10 border-amber-500/30"
          )}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isOverAllocated ? "text-destructive" : "text-primary"
                )}>
                  {totalAllocatedPercent.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={cn(
                  "text-2xl font-bold",
                  remainingPercent >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {remainingPercent.toFixed(1)}%
                </p>
              </div>
            </div>
            
            {isOverAllocated && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Reduce total allocation to 100% or less</span>
              </div>
            )}
            
            {remainingPercent > 0 && !isOverAllocated && (
              <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                <span>{remainingPercent.toFixed(1)}% available for new allocations</span>
              </div>
            )}
          </div>

          {/* Quick Adjust Buttons */}
          {isEditingAllocations && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAllocations(prev => 
                    prev.map(item => ({
                      ...item,
                      percent: Math.round((item.percent * 0.9) * 10) / 10 // Reduce by 10%
                    }))
                  );
                }}
              >
                Reduce All 10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAllocations(DEFAULT_ALLOCATIONS);
                }}
              >
                Reset to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const total = allocations.reduce((sum, item) => sum + item.percent, 0);
                  if (total > 0) {
                    setAllocations(prev => 
                      prev.map(item => ({
                        ...item,
                        percent: Math.round((item.percent / total) * 1000) / 10
                      }))
                    );
                  }
                }}
              >
                Auto-balance to 100%
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Expense Adjustment */}
      {stockExpenses > 0 && restockAllocation && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3 border-b bg-amber-500/5">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Stock Expense Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Restock Allocation ({restockAllocation.percent}%)</span>
              <span className="font-semibold">{restockAmount.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between items-center text-amber-700">
              <span>Less: Today's Stock Expenses</span>
              <span className="font-semibold">- {stockExpenses.toLocaleString()} MT</span>
            </div>
            <Separator />
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-green-500/20 border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Action Required</p>
                  <p className="font-semibold">Deposit to Restock Account</p>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  <span className="text-3xl font-bold text-primary">
                    {finalRestockTransfer.toLocaleString()} MT
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Net Profit Summary */}
      {remainingPercent > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit (Remaining {remainingPercent.toFixed(1)}%)</p>
                  <p className="text-3xl font-bold text-primary">
                    {(netRevenue * remainingPercent / 100).toLocaleString()} MT
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {remainingPercent.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expected Cash in Drawer</p>
              <p className="text-3xl font-bold">{cashInDrawer.toLocaleString()} MT</p>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2">
              {transactions.length} transactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pb-8">
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2"
          disabled={isOverAllocated}
        >
          <FileDown className="w-4 h-4" />
          Export Report
        </Button>
        
        {isClosed ? (
          <div className="flex items-center gap-3 text-primary">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-lg font-semibold">Day Closed Successfully</span>
          </div>
        ) : (
          <Button
            size="lg"
            className="px-12 h-14 text-lg gap-2"
            onClick={handleCloseDay}
            disabled={isClosing || isOverAllocated}
          >
            {isClosing ? (
              'Closing Day...'
            ) : (
              <>
                <Moon className="w-5 h-5" />
                Close Day
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EndOfDay() {
  return (
    <MainLayout>
      <EndOfDayContent />
    </MainLayout>
  );
}