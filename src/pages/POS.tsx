import { useState, useEffect } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDishes, useRecipes, useTransactions, useStoreStock, useCredits, useRestaurantTablesManagement, useStores } from '@/hooks/useSupabaseData';
import type { Dish } from '@/hooks/useSupabaseData';
import { useStoreDishPrices } from '@/hooks/useStoreDishPrices';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { useBundles, useStoreBundlePrices } from '@/hooks/useBundles';
import { ManageTablesModal } from '@/components/modals/ManageTablesModal';
import { CategoryManagerModal } from '@/components/modals/CategoryManagerModal';
import { CreditCustomerModal } from '@/components/modals/CreditCustomerModal';
import { SplitBillModal } from '@/components/modals/SplitBillModal';
import { TableMapModal } from '@/components/modals/TableMapModal';
import { BundleSelectorModal } from '@/components/modals/BundleSelectorModal';
import { DishSelectionModal } from '@/components/modals/DishSelectionModal';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Printer, Table, Split, Pencil, Coffee, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartModal } from '@/components/modals/CartModal';
import { EditPriceModal } from '@/components/modals/EditPriceModal';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  dish: Dish;
  quantity: number;
  unitPrice: number;
  isBundle?: boolean;
  bundleId?: string;
  bundleDishId?: string;
  bundleName?: string;
  selectedDishIds?: string[]; // For bundles: the dishes selected in this bundle
}

interface SplitBill {
  id: string;
  items: CartItem[];
  paymentMethod: string | null;
  isPaid: boolean;
}

const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: '', isRevenue: true, isCash: true },
  { id: 'cartao', name: 'Cartão', icon: '', isRevenue: true, isCash: true },
  { id: 'mpesa', name: 'M-Pesa', icon: '', isRevenue: true, isCash: true },
  { id: 'paga_facil', name: 'Paga Fácil', icon: '', isRevenue: true, isCash: true },
  { id: 'credit', name: 'Credito', icon: '', isRevenue: false, isCash: false },
  { id: 'self_consumption', name: 'Mesa 0', icon: '', isRevenue: false, isCash: false },
];

function POSContent() {
  const { currentStore } = useCurrentStore();

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading store...</p>
      </div>
    );
  }

  return <POSPage currentStore={currentStore} />;
}

function CartContent({ 
  cart, 
  updateQuantity, 
  setCart, 
  setShowSplitBillModal, 
  selectedPayment, 
  setSelectedPayment, 
  cartTotal, 
  handlePrintReceipt, 
  handleCheckout, 
  isProcessing, 
  selectedTable,
  tables,
  toast,
  dishes
}: any) {
  const currentTableName = tables.find((t: any) => t.id === selectedTable)?.name || 'No Table';

  return (
    <>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" />Cart</span>
            <span className="text-xs text-muted-foreground">Table: {currentTableName}</span>
          </div>
          <div className="flex gap-1">
            {cart.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setShowSplitBillModal(true)} className="gap-1">
                <Split className="w-4 h-4" /> Dividir Mesa
              </Button>
            )}
            {cart.length > 0 && <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-destructive">Clear</Button>}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 py-2">
        <div className="h-[220px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Select table and add items</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {cart.map((item: CartItem) => (
                <div key={item.dish.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.dish.name}</p>
                    {item.isBundle && item.selectedDishIds && (
                      <p className="text-[10px] text-muted-foreground truncate leading-tight mb-0.5">
                        {item.selectedDishIds.map(id => dishes.find((d: any) => d.id === id)?.name).filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{Number(item.unitPrice).toLocaleString()} MT × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => updateQuantity(item.dish.id, 0)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <div className="border-t p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Payment Method</p>
          <div className="grid grid-cols-4 gap-1">
            {paymentMethods.map(method => (
              <Button key={method.id} variant={selectedPayment === method.id ? "default" : "outline"} size="sm" className={cn("flex flex-col h-auto py-1 px-1", !method.isRevenue && selectedPayment === method.id && "bg-amber-600 hover:bg-amber-700")} onClick={() => setSelectedPayment(method.id)}>
                <span className="text-sm">{method.icon}</span>
                <span className="text-[10px] leading-tight">{method.name}</span>
              </Button>
            ))}
          </div>
          {!paymentMethods.find(m => m.id === selectedPayment)?.isRevenue && (
            <p className="text-[10px] text-amber-600 mt-1 text-center">⚠️ No revenue</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-2xl font-bold">{cartTotal.toLocaleString()} MT</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintReceipt} disabled={cart.length === 0}>
              <Printer className="w-4 h-4" />
            </Button>
            <Button className="flex-1 h-10" onClick={handleCheckout} disabled={cart.length === 0 || isProcessing || !selectedTable}>
              {isProcessing ? 'Processing...' : <><CreditCard className="w-4 h-4 mr-1" />Completar</>}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
};

function POSPage({ currentStore }: { currentStore: any }) {
  const { toast } = useToast();
  const { dishes } = useDishes();
  const { recipes } = useRecipes();
  const { tables, addTable, deleteTable, initializeTables } = useRestaurantTablesManagement(currentStore?.id || null);
  const { addTransaction } = useTransactions(currentStore?.id || null);
  const { deductStock } = useStoreStock(currentStore?.id || null);
  const { addCredit, credits } = useCredits(currentStore?.id || null);
  const { getEffectivePrice, hasOverride, setOverridePrice, removeOverridePrice, getOverridePrice } = useStoreDishPrices(currentStore?.id || null);
  const { enabledCategories, setCategories: updateEnabledCategories } = useStoreCategories(currentStore?.id || null);
  const { bundles } = useBundles();
  const { getEffectiveBundlePrice } = useStoreBundlePrices(currentStore?.id || null);
  const { isManager, user } = useAuth();
  const { stores: allStores } = useStores();

  const [tableCarts, setTableCarts] = useState<Record<string, CartItem[]>>({});

  // Persist per-table carts to localStorage, scoped per user + per store,
  // so a page refresh or accidental navigation doesn't lose the cart.
  const cartStorageKey = user?.id && currentStore?.id
    ? `pos_cart::${user.id}::${currentStore.id}`
    : null;
  const hasHydratedCartRef = useRef(false);

  // Hydrate on mount / when the scope key changes
  useEffect(() => {
    hasHydratedCartRef.current = false;
    if (!cartStorageKey) return;
    try {
      const raw = localStorage.getItem(cartStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setTableCarts(parsed as Record<string, CartItem[]>);
        } else {
          setTableCarts({});
        }
      } else {
        setTableCarts({});
      }
    } catch {
      localStorage.removeItem(cartStorageKey);
      setTableCarts({});
    }
    hasHydratedCartRef.current = true;
  }, [cartStorageKey]);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (!cartStorageKey || !hasHydratedCartRef.current) return;
    try {
      const hasAnyItems = Object.values(tableCarts).some(items => items && items.length > 0);
      if (hasAnyItems) {
        localStorage.setItem(cartStorageKey, JSON.stringify(tableCarts));
      } else {
        localStorage.removeItem(cartStorageKey);
      }
    } catch {
      // Ignore quota / serialization errors
    }
  }, [tableCarts, cartStorageKey]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showTableMap, setShowTableMap] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showBundleSelector, setShowBundleSelector] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<typeof bundles[0] | null>(null);
  const [showBreakfastSelector, setShowBreakfastSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize tables if needed
  useEffect(() => {
    if (currentStore?.id && tables.length < 15) {
      initializeTables(15);
    }
  }, [currentStore?.id, tables.length, initializeTables]);

  // Default to first table
  useEffect(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0].id);
    }
  }, [tables, selectedTable]);

  const existingCustomerNames = [...new Set(credits.filter(c => c.status !== 'settled').map(c => c.customer_name))];

  const currentCart = selectedTable ? tableCarts[selectedTable] || [] : [];
  const breakfastDish = dishes.find(d => d.name.toLowerCase() === 'breakfast');

  const allCategories = [...new Set(dishes.map(d => d.category).filter(Boolean))] as string[];
  const displayCategories = enabledCategories.length > 0
    ? allCategories.filter(cat => enabledCategories.includes(cat))
    : allCategories;

  const categories = displayCategories;

  const dishesInEnabledCategories = dishes.filter(d =>
    !d.category || displayCategories.includes(d.category)
  );

  const filteredDishes = dishesInEnabledCategories.filter(d => {
    const matchesCategory = !selectedCategory || d.category === selectedCategory;
    const matchesSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = currentCart.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);

  const showBreakfastDish = breakfastDish && (!breakfastDish.category || displayCategories.includes(breakfastDish.category));
  const filteredBundles = bundles.filter(b => !b.category || displayCategories.includes(b.category));

  const addToCart = (dish: Dish) => {
    if (!selectedTable) {
      toast({ 
        title: 'Select Table First', 
        description: 'Please select a table before adding items to cart',
        variant: 'destructive'
      });
      setShowTableMap(true);
      return;
    }

    if (dish.name.toLowerCase() === 'breakfast') {
      setSelectedDish(dish);
      setShowBreakfastSelector(true);
      return;
    }
    
    // Get the effective price for this store
    const effectivePrice = getEffectivePrice(dish.id, Number(dish.selling_price));
    
    setTableCarts(prev => {
      const tableCart = prev[selectedTable] || [];
      const existing = tableCart.find(i => i.dish.id === dish.id);
      
      if (existing) {
        return {
          ...prev,
          [selectedTable]: tableCart.map(i => 
            i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      
      return {
        ...prev,
        [selectedTable]: [...tableCart, { dish, quantity: 1, unitPrice: effectivePrice }]
      };
    });
  };

  // Add a bundle to cart
  const addBundleToCart = (bundle: typeof bundles[0], selectedDishIds: string[]) => {
    if (!selectedTable) {
      toast({ 
        title: 'Select Table First', 
        description: 'Please select a table before adding items to cart',
        variant: 'destructive'
      });
      setShowTableMap(true);
      return;
    }
    
    const effectivePrice = getEffectiveBundlePrice(bundle.id, Number(bundle.default_price));
    
    // Create a placeholder "dish" for the bundle in cart display
    const bundleDish: Dish = {
      id: `bundle-${bundle.id}-${Date.now()}`, // Unique ID for each bundle instance
      name: bundle.name,
      category: 'Breakfast',
      selling_price: effectivePrice,
      image: bundle.image,
      cost_of_production: bundle.cost_of_production,
      created_at: new Date().toISOString(),
    };
    
    setTableCarts(prev => {
      const tableCart = prev[selectedTable] || [];
      return {
        ...prev,
        [selectedTable]: [...tableCart, { 
          dish: bundleDish, 
          quantity: 1, 
          unitPrice: effectivePrice,
          isBundle: true,
          bundleId: bundle.id,
          bundleName: bundle.name,
          selectedDishIds: selectedDishIds,
        }]
      };
    });
    
    toast({ title: `${bundle.name} added`, description: `${selectedDishIds.length} items selected` });
  };

  const handleBundleClick = (bundle: typeof bundles[0]) => {
    if (!selectedTable) {
      toast({ 
        title: 'Select Table First', 
        description: 'Please select a table before adding items to cart',
        variant: 'destructive'
      });
      setShowTableMap(true);
      return;
    }
    setSelectedBundle(bundle);
    setShowBundleSelector(true);
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (!selectedTable) return;
    
    setTableCarts(prev => {
      const tableCart = prev[selectedTable] || [];
      
      if (quantity <= 0) {
        const newTableCart = tableCart.filter(i => i.dish.id !== dishId);
        const newTableCarts = { ...prev, [selectedTable]: newTableCart };
        
        // If cart becomes empty, we could optionally clear the table selection
        if (newTableCart.length === 0) {
          // Option: Clear table selection when cart is empty
          // setSelectedTable(null);
        }
        
        return newTableCarts;
      }
      
      return {
        ...prev,
        [selectedTable]: tableCart.map(i => 
          i.dish.id === dishId ? { ...i, quantity } : i
        )
      };
    });
  };

  const clearCart = () => {
    if (!selectedTable) return;
    setTableCarts(prev => ({ ...prev, [selectedTable]: [] }));
  };

  const handleCheckout = async () => {
    if (currentCart.length === 0 || !selectedTable) {
      toast({ title: !selectedTable ? 'Select a table' : 'Cart is empty', variant: 'destructive' });
      return;
    }

    if (selectedPayment === 'credit') {
      setShowCreditModal(true);
      return;
    }

    await processCheckout();
  };

  const processCheckout = async (customerName?: string) => {
    if (!selectedTable) return;
    
    setIsProcessing(true);

    // Aggregate all ingredient deductions first to avoid stale-state overwrites
    const deductionMap = new Map<string, number>();
    for (const cartItem of currentCart) {
      if (cartItem.isBundle && cartItem.selectedDishIds) {
        for (const dishId of cartItem.selectedDishIds) {
          const dishRecipes = recipes.filter(r => r.dish_id === dishId);
          for (const recipe of dishRecipes) {
            const key = recipe.ingredient_id;
            deductionMap.set(key, (deductionMap.get(key) || 0) + Number(recipe.quantity_required) * cartItem.quantity);
          }
        }
      } else {
        const dishRecipes = recipes.filter(r => r.dish_id === cartItem.dish.id);
        for (const recipe of dishRecipes) {
          const key = recipe.ingredient_id;
          deductionMap.set(key, (deductionMap.get(key) || 0) + Number(recipe.quantity_required) * cartItem.quantity);
        }
      }
    }
    // Apply aggregated deductions
    for (const [ingredientId, totalAmount] of deductionMap) {
      await deductStock(ingredientId, totalAmount);
    }

    const transaction = await addTransaction(
      cartTotal,
      selectedPayment,
      selectedTable,
      currentCart.flatMap(item => {
        const items = [{
          dishId: (item.isBundle ? item.bundleDishId : item.dish.id) || item.dish.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }];

        // Add sub-items to transaction with 0 price for bundles
        if (item.isBundle && item.selectedDishIds) {
          item.selectedDishIds.forEach(id => {
            items.push({
              dishId: id,
              quantity: item.quantity,
              unitPrice: 0
            });
          });
        }

        return items;
      })
    );

    if (selectedPayment === 'credit' && customerName && transaction) {
      await addCredit({
        customer_name: customerName,
        sale_amount: cartTotal,
        transaction_id: transaction.id
      });
    }

    const method = paymentMethods.find(m => m.id === selectedPayment);
    toast({ 
      title: 'Sale Complete!', 
      description: `${cartTotal.toLocaleString()} MT via ${method?.name}${!method?.isRevenue ? ' (No Revenue)' : ''}${customerName ? ` - ${customerName}` : ''}` 
    });
    
    // Clear only the current table's cart
    setTableCarts(prev => ({ ...prev, [selectedTable]: [] }));
    setIsProcessing(false);
    setShowCreditModal(false);
    
    // Optionally clear table selection after checkout
    // setSelectedTable(null);
  };

  const handleCreditConfirm = (customerName: string) => {
    processCheckout(customerName);
  };

  const handleProcessSingleBill = async (bill: SplitBill, customerName?: string) => {
    if (!selectedTable) return;
    
    const billTotal = bill.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);

    // Aggregate deductions to avoid stale-state overwrites
    const billDeductionMap = new Map<string, number>();
    for (const cartItem of bill.items) {
      const dishRecipes = recipes.filter(r => r.dish_id === cartItem.dish.id);
      for (const recipe of dishRecipes) {
        const key = recipe.ingredient_id;
        billDeductionMap.set(key, (billDeductionMap.get(key) || 0) + Number(recipe.quantity_required) * cartItem.quantity);
      }
    }
    for (const [ingredientId, totalAmount] of billDeductionMap) {
      await deductStock(ingredientId, totalAmount);
    }

    const transaction = await addTransaction(
      billTotal,
      bill.paymentMethod || 'cash',
      selectedTable,
      bill.items.flatMap(item => {
        const items = [{
          dishId: (item.isBundle ? item.bundleDishId : item.dish.id) || item.dish.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        }];

        if (item.isBundle && item.selectedDishIds) {
          item.selectedDishIds.forEach(id => {
            items.push({
              dishId: id,
              quantity: item.quantity,
              unitPrice: 0
            });
          });
        }

        return items;
      })
    );

    // Record credit if payment method is credit
    if (bill.paymentMethod === 'credit' && customerName && transaction) {
      await addCredit({
        customer_name: customerName,
        sale_amount: billTotal,
        transaction_id: transaction.id
      });
    }

    // Update the table-specific cart
    setTableCarts(prev => {
      const tableCart = prev[selectedTable] || [];
      const newTableCart = [...tableCart];
      
      for (const item of bill.items) {
        const index = newTableCart.findIndex(cartItem => cartItem.dish.id === item.dish.id);
        if (index !== -1) {
          newTableCart[index].quantity -= item.quantity;
          if (newTableCart[index].quantity <= 0) {
            newTableCart.splice(index, 1);
          }
        }
      }
      
      return { ...prev, [selectedTable]: newTableCart };
    });

    const method = paymentMethods.find(m => m.id === bill.paymentMethod);
    toast({ 
      title: 'Bill paid!', 
      description: `${billTotal.toLocaleString()} MT via ${method?.name}${customerName ? ` - ${customerName}` : ''}` 
    });
  };

  const handlePrintBill = (bill: SplitBill, billNumber: number) => {
    const billTotal = bill.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
    const receipt = [
      `${currentStore?.name}`,
      `Table: ${tables.find(t => t.id === selectedTable)?.name || 'N/A'} - Bill ${billNumber}`,
      `Date: ${new Date().toLocaleString()}`,
      '─'.repeat(30),
      ...bill.items.map(item => `${item.dish.name} x${item.quantity} - ${(Number(item.unitPrice) * item.quantity).toLocaleString()} MT`),
      '─'.repeat(30),
      `TOTAL: ${billTotal.toLocaleString()} MT`
    ].join('\n');
    
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-bill${billNumber}-${Date.now()}.txt`;
    a.click();
    toast({ title: `Bill ${billNumber} receipt downloaded` });
  };

  const handlePrintReceipt = () => {
    if (currentCart.length === 0) return;
    
    const receipt = [
      `${currentStore?.name}`,
      `Table: ${tables.find(t => t.id === selectedTable)?.name || 'N/A'}`,
      `Date: ${new Date().toLocaleString()}`,
      '─'.repeat(30),
      ...currentCart.map(item => `${item.dish.name} x${item.quantity} - ${(Number(item.unitPrice) * item.quantity).toLocaleString()} MT`),
      '─'.repeat(30),
      `TOTAL: ${cartTotal.toLocaleString()} MT`
    ].join('\n');
    
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${Date.now()}.txt`;
    a.click();
    toast({ title: 'Receipt downloaded' });
  };

  return (
    <div className="h-[calc(100vh-3rem)] w-full max-w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ponto de vendas</h1>
            <p className="text-muted-foreground">Selecione os itens para adicionar a </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ManageTablesModal tables={tables} onAddTable={addTable} onDeleteTable={deleteTable} />
            <div className="flex items-center gap-2 flex-1">
              <Table className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedTable || ''} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar Mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => {
                    const isOccupied = tableCarts[table.id]?.length > 0;
                    return (
                      <SelectItem key={table.id} value={table.id}>
                        <div className="flex items-center justify-between">
                          <span>{table.name}</span>
                          {isOccupied && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {tableCarts[table.id]?.reduce((sum, item) => sum + item.quantity, 0)} items
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Breakfast Quick Access Buttons */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {showBreakfastDish && breakfastDish && (
            <Button
              variant="outline"
              size="default"
              className="gap-2 bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold shadow-sm"
              onClick={() => addToCart(breakfastDish)}
            >
              <Coffee className="w-5 h-5" />
              {breakfastDish.name}
              <Badge variant="secondary" className="text-sm ml-1 bg-amber-200 dark:bg-amber-900">
                {getEffectivePrice(breakfastDish.id, Number(breakfastDish.selling_price)).toLocaleString()} MT
              </Badge>
            </Button>
          )}
          {filteredBundles.map(bundle => {
            const bundlePrice = getEffectiveBundlePrice(bundle.id, Number(bundle.default_price));
            return (
              <Button
                key={bundle.id}
                variant="outline"
                size="default"
                className="gap-2 bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold shadow-sm"
                onClick={() => handleBundleClick(bundle)}
              >
                <Coffee className="w-5 h-5" />
                {bundle.name}
                <Badge variant="secondary" className="text-sm ml-1 bg-amber-200 dark:bg-amber-900">{bundlePrice.toLocaleString()} MT</Badge>
              </Button>
            );
          })}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Procurar prato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
          {[...categories].sort().map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
          ))}
          {isManager && (
            <div className="ml-auto">
              <CategoryManagerModal
                allCategories={allCategories}
                enabledCategories={enabledCategories}
                onSetCategories={updateEnabledCategories}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDishes.map(dish => {
              const effectivePrice = getEffectivePrice(dish.id, Number(dish.selling_price));
              const isOverridden = hasOverride(dish.id);
              const cartQty = currentCart
                .filter(i => i.dish.id === dish.id)
                .reduce((s, i) => s + i.quantity, 0);

              return (
                <Card
                  key={dish.id}
                  className="transition-all hover:shadow-lg relative overflow-hidden active:scale-[0.98] active:brightness-[0.85] duration-150"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      // ripple
                      const target = e.currentTarget;
                      const circle = document.createElement('span');
                      const rect = target.getBoundingClientRect();
                      const size = Math.max(rect.width, rect.height);
                      circle.style.width = circle.style.height = `${size}px`;
                      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
                      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
                      circle.className =
                        'absolute rounded-full bg-foreground/20 pointer-events-none animate-ping';
                      target.appendChild(circle);
                      setTimeout(() => circle.remove(), 500);
                      addToCart(dish);
                    }}
                    className="relative w-full text-left cursor-pointer"
                  >
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-sm text-left flex-1 min-w-0 truncate">
                        {dish.name}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {cartQty > 0 && (
                          <span className="text-xs font-bold text-muted-foreground">
                            x{cartQty}
                          </span>
                        )}
                        <p className="text-base font-bold text-primary text-right tabular-nums">
                          {effectivePrice.toLocaleString()} MT
                          {isOverridden && (
                            <span className="text-[10px] ml-1 text-muted-foreground">(custom)</span>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </button>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => {
                        setSelectedDish(dish);
                        setShowEditPriceModal(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-96">
        <Card className="w-full flex flex-col shrink-0">
          <CartContent
            cart={currentCart}
            updateQuantity={updateQuantity}
            setCart={clearCart}
            setShowSplitBillModal={setShowSplitBillModal}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            cartTotal={cartTotal}
            handlePrintReceipt={handlePrintReceipt}
            handleCheckout={handleCheckout}
            isProcessing={isProcessing}
            selectedTable={selectedTable}
            tables={tables}
             toast={toast} 
             dishes={dishes}
          />
        </Card>
      </div>

      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button size="lg" className="rounded-full w-36 h-16 shadow-lg" onClick={() => setShowCart(true)}>
          <ShoppingBag className="w-6 h-6 mr-2" />
          View Cart ({currentCart.reduce((acc, item) => acc + item.quantity, 0)})
        </Button>
      </div>

      <CreditCustomerModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        amount={cartTotal}
        onConfirm={handleCreditConfirm}
        existingCustomers={existingCustomerNames}
      />

      <TableMapModal
        open={showTableMap}
        onOpenChange={setShowTableMap}
        tables={tables}
        onSelectTable={setSelectedTable}
        tableOrders={tableCarts}
      />

      <CartModal open={showCart} onOpenChange={setShowCart}>
        <CartContent
          cart={currentCart}
          updateQuantity={updateQuantity}
          setCart={clearCart}
          setShowSplitBillModal={setShowSplitBillModal}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          cartTotal={cartTotal}
          handlePrintReceipt={handlePrintReceipt}
          handleCheckout={handleCheckout}
          isProcessing={isProcessing}
          selectedTable={selectedTable}
          tables={tables}
          dishes={dishes}
        />
      </CartModal>

      <SplitBillModal
        open={showSplitBillModal}
        onOpenChange={setShowSplitBillModal}
        cart={currentCart}
        paymentMethods={paymentMethods}
        onProcessSingleBill={handleProcessSingleBill}
        onPrintBill={handlePrintBill}
        storeName={currentStore?.name || ''}
        tableName={tables.find(t => t.id === selectedTable)?.name || 'Table'}
        existingCustomers={existingCustomerNames}
        stores={allStores.map(s => ({ id: s.id, name: s.name }))}
        currentStoreId={currentStore?.id}
      />

      {selectedDish && (
        <EditPriceModal
          isOpen={showEditPriceModal}
          onClose={() => setShowEditPriceModal(false)}
          dishName={selectedDish.name}
          currentPrice={getOverridePrice(selectedDish.id)}
          defaultPrice={Number(selectedDish.selling_price)}
          onSave={(newPrice) => setOverridePrice(selectedDish.id, newPrice)}
          onRemoveOverride={() => removeOverridePrice(selectedDish.id)}
        />
      )}

      {selectedBundle && (
        <BundleSelectorModal
          open={showBundleSelector}
          onOpenChange={setShowBundleSelector}
          bundle={selectedBundle}
          dishes={dishes}
          effectivePrice={getEffectiveBundlePrice(selectedBundle.id, Number(selectedBundle.default_price))}
          onConfirm={(selectedDishIds) => addBundleToCart(selectedBundle, selectedDishIds)}
        />
      )}

      {selectedDish && (
        <DishSelectionModal
          open={showBreakfastSelector}
          onOpenChange={setShowBreakfastSelector}
          title={selectedDish.name}
          dishes={dishes}
          price={getEffectivePrice(selectedDish.id, Number(selectedDish.selling_price))}
          onConfirm={(selectedDishIds) => {
            // Logic to add the custom breakfast bundle to cart
            if (!selectedTable) return;
            const effectivePrice = getEffectivePrice(selectedDish.id, Number(selectedDish.selling_price));
            const bundleDishId = `breakfast-${selectedDish.id}-${Date.now()}`;

            setTableCarts(prev => ({
              ...prev,
              [selectedTable]: [...(prev[selectedTable] || []), {
                dish: { ...selectedDish, id: bundleDishId },
                quantity: 1,
                unitPrice: effectivePrice,
                isBundle: true,
                bundleDishId: selectedDish.id,
                bundleName: selectedDish.name,
                selectedDishIds: selectedDishIds,
              }]
            }));
            toast({ title: 'Breakfast added', description: `${selectedDishIds.length} items selected` });
          }}
        />
      )}
    </div>
  );
}

export default function POS() {
  return (
    <MainLayout>
      <POSContent />
    </MainLayout>
  );
}