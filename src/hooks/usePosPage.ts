import { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useDishes,
  useRecipes,
  useTransactions,
  useStoreStock,
  useCredits,
  useDebtorPayments,
  useRestaurantTablesManagement,
  useStores,
  Dish,
} from '@/hooks/useSupabaseData';
import { useStoreDishPrices } from '@/hooks/useStoreDishPrices';
import { useStoreCategories } from '@/hooks/useStoreCategories';
import { useBundles, useStoreBundlePrices } from '@/hooks/useBundles';
import { useAuth } from '@/hooks/useAuth';
import { getNextOrderNumber } from '@/hooks/useOrderNumber';
import { buildReceiptBytes, sendToPrinter, printViaSystem, ReceiptOrder } from '@/utils/escposReceipt';
import logoAsset from '@/assets/360-logo.bmp.asset.json';
import {
  PosCartItem,
  calculateCartIngredientDeductions,
  formatTransactionItemsForCheckout,
  calculateCartTotal,
} from '@/services/posService';

export interface SplitBill {
  id: string;
  items: PosCartItem[];
  paymentMethod: string | null;
  isPaid: boolean;
}

export function usePosPage(currentStore: any) {
  const { toast } = useToast();
  const { dishes } = useDishes();
  const { recipes } = useRecipes();
  const { tables, addTable, deleteTable, initializeTables } = useRestaurantTablesManagement(
    currentStore?.id || null
  );
  const { addTransaction } = useTransactions(currentStore?.id || null);
  const { deductStock } = useStoreStock(currentStore?.id || null);
  const { addCredit, credits } = useCredits(currentStore?.id || null);
  const { payments } = useDebtorPayments(currentStore?.id || null);
  const { getEffectivePrice, hasOverride, setOverridePrice, removeOverridePrice, getOverridePrice } =
    useStoreDishPrices(currentStore?.id || null);
  const { enabledCategories, setCategories: updateEnabledCategories } = useStoreCategories(
    currentStore?.id || null
  );
  const { bundles } = useBundles();
  const { getEffectiveBundlePrice } = useStoreBundlePrices(currentStore?.id || null);
  const { isManager, user } = useAuth();
  const { stores: allStores } = useStores();

  const [tableCarts, setTableCarts] = useState<Record<string, PosCartItem[]>>({});
  const [tableDiscounts, setTableDiscounts] = useState<Record<string, boolean>>({});

  const cartStorageKey =
    user?.id && currentStore?.id ? `pos_cart::${user.id}::${currentStore.id}` : null;
  const hasHydratedCartRef = useRef(false);

  const discountStorageKey =
    user?.id && currentStore?.id ? `pos_discount::${user.id}::${currentStore.id}` : null;
  const hasHydratedDiscountRef = useRef(false);

  // Hydrate cart on mount / key change
  useEffect(() => {
    hasHydratedCartRef.current = false;
    if (!cartStorageKey) return;
    try {
      const raw = localStorage.getItem(cartStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setTableCarts(parsed as Record<string, PosCartItem[]>);
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

  // Hydrate discounts on mount / key change
  useEffect(() => {
    hasHydratedDiscountRef.current = false;
    if (!discountStorageKey) return;
    try {
      const raw = localStorage.getItem(discountStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setTableDiscounts(parsed as Record<string, boolean>);
        } else {
          setTableDiscounts({});
        }
      } else {
        setTableDiscounts({});
      }
    } catch {
      localStorage.removeItem(discountStorageKey);
      setTableDiscounts({});
    }
    hasHydratedDiscountRef.current = true;
  }, [discountStorageKey]);

  // Persist carts
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
      // Ignore errors
    }
  }, [tableCarts, cartStorageKey]);

  // Persist discounts
  useEffect(() => {
    if (!discountStorageKey || !hasHydratedDiscountRef.current) return;
    try {
      const hasAnyDiscounts = Object.values(tableDiscounts).some(val => val === true);
      if (hasAnyDiscounts) {
        localStorage.setItem(discountStorageKey, JSON.stringify(tableDiscounts));
      } else {
        localStorage.removeItem(discountStorageKey);
      }
    } catch {
      // Ignore errors
    }
  }, [tableDiscounts, discountStorageKey]);

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
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
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

  const existingCustomerNames = useMemo(() => {
    const set = new Set<string>();
    credits.forEach(c => set.add(c.customer_name.trim()));
    payments.forEach(p => set.add(p.customer_name.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [credits, payments]);

  const currentCart = selectedTable ? tableCarts[selectedTable] || [] : [];
  const breakfastDish = dishes.find(d => d.name.toLowerCase() === 'breakfast');

  const allCategories = [...new Set(dishes.map(d => d.category).filter(Boolean))] as string[];
  const displayCategories =
    enabledCategories.length > 0
      ? allCategories.filter(cat => enabledCategories.includes(cat))
      : allCategories;

  const categories = displayCategories;

  const dishesInEnabledCategories = dishes.filter(
    d => !d.category || displayCategories.includes(d.category)
  );

  const filteredDishes = dishesInEnabledCategories.filter(d => {
    const matchesCategory = !selectedCategory || d.category === selectedCategory;
    const matchesSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isDiscountEnabled = currentStore?.id === '85cb8967-fcad-49f5-b0bb-dc84bf0448d9';
  const discountApplied = selectedTable && isDiscountEnabled ? !!tableDiscounts[selectedTable] : false;
  const isSelfConsumption = selectedPayment === 'self_consumption';

  const rawCartTotal = currentCart.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  const cartTotal = calculateCartTotal(rawCartTotal, discountApplied, isSelfConsumption);

  const showBreakfastDish =
    breakfastDish && (!breakfastDish.category || displayCategories.includes(breakfastDish.category));
  const filteredBundles = bundles.filter(b => !b.category || displayCategories.includes(b.category));

  const addToCart = (dish: Dish) => {
    if (!selectedTable) {
      toast({
        title: 'Select Table First',
        description: 'Please select a table before adding items to cart',
        variant: 'destructive',
      });
      setShowTableMap(true);
      return;
    }

    if (dish.name.toLowerCase() === 'breakfast') {
      setSelectedDish(dish);
      setShowBreakfastSelector(true);
      return;
    }

    const effectivePrice = getEffectivePrice(dish.id, Number(dish.selling_price));

    setTableCarts(prev => {
      const tableCart = prev[selectedTable] || [];
      const existing = tableCart.find(i => i.dish.id === dish.id);

      if (existing) {
        return {
          ...prev,
          [selectedTable]: tableCart.map(i =>
            i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      return {
        ...prev,
        [selectedTable]: [...tableCart, { dish, quantity: 1, unitPrice: effectivePrice }],
      };
    });
  };

  const addBundleToCart = (bundle: any, selectedDishIds: string[]) => {
    if (!selectedTable) {
      toast({
        title: 'Select Table First',
        description: 'Please select a table before adding items to cart',
        variant: 'destructive',
      });
      setShowTableMap(true);
      return;
    }

    const effectivePrice = getEffectiveBundlePrice(bundle.id, Number(bundle.default_price));

    const bundleDish: Dish = {
      id: `bundle-${bundle.id}-${Date.now()}`,
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
        [selectedTable]: [
          ...tableCart,
          {
            dish: bundleDish,
            quantity: 1,
            unitPrice: effectivePrice,
            isBundle: true,
            bundleId: bundle.id,
            bundleName: bundle.name,
            selectedDishIds: selectedDishIds,
          },
        ],
      };
    });

    toast({ title: `${bundle.name} added`, description: `${selectedDishIds.length} items selected` });
  };

  const handleBundleClick = (bundle: any) => {
    if (!selectedTable) {
      toast({
        title: 'Select Table First',
        description: 'Please select a table before adding items to cart',
        variant: 'destructive',
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
        return { ...prev, [selectedTable]: newTableCart };
      }

      return {
        ...prev,
        [selectedTable]: tableCart.map(i => (i.dish.id === dishId ? { ...i, quantity } : i)),
      };
    });
  };

  const clearCart = () => {
    if (!selectedTable) return;
    setTableCarts(prev => ({ ...prev, [selectedTable]: [] }));
    setTableDiscounts(prev => {
      const newState = { ...prev };
      delete newState[selectedTable];
      return newState;
    });
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

    try {
      // 1. Stock deductions (always executed regardless of self_consumption)
      const deductionMap = calculateCartIngredientDeductions(currentCart, recipes);
      for (const [ingredientId, totalAmount] of deductionMap) {
        await deductStock(ingredientId, totalAmount);
      }

      // 2. Prepare transaction total & items formatted for self_consumption
      const finalTotalAmount = isSelfConsumption ? 0 : cartTotal;
      const formattedItems = formatTransactionItemsForCheckout(currentCart, isSelfConsumption);

      const transaction = await addTransaction(
        finalTotalAmount,
        selectedPayment,
        selectedTable,
        formattedItems
      );

      if (selectedPayment === 'credit' && customerName && transaction) {
        await addCredit({
          customer_name: customerName,
          sale_amount: finalTotalAmount,
          transaction_id: transaction.id,
        });
      }

      toast({
        title: 'Sale Complete!',
        description: `${finalTotalAmount.toLocaleString()} MT via ${selectedPayment}${
          isSelfConsumption ? ' (Self Consumption - recorded as 0)' : ''
        }${customerName ? ` - ${customerName}` : ''}`,
      });

      // Clear current table cart
      setTableCarts(prev => ({ ...prev, [selectedTable]: [] }));
      setTableDiscounts(prev => {
        const newState = { ...prev };
        delete newState[selectedTable];
        return newState;
      });
    } finally {
      setIsProcessing(false);
      setShowCreditModal(false);
    }
  };

  const handleCreditConfirm = (customerName: string) => {
    processCheckout(customerName);
  };

  const handleProcessSingleBill = async (bill: SplitBill, customerName?: string) => {
    if (!selectedTable) return;

    const isBillSelfConsumption = bill.paymentMethod === 'self_consumption';
    const rawBillTotal = bill.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );
    const finalBillTotal = isBillSelfConsumption ? 0 : rawBillTotal;

    const billDeductionMap = calculateCartIngredientDeductions(bill.items, recipes);
    for (const [ingredientId, totalAmount] of billDeductionMap) {
      await deductStock(ingredientId, totalAmount);
    }

    const formattedItems = formatTransactionItemsForCheckout(bill.items, isBillSelfConsumption);

    const transaction = await addTransaction(
      finalBillTotal,
      bill.paymentMethod || 'cash',
      selectedTable,
      formattedItems
    );

    if (bill.paymentMethod === 'credit' && customerName && transaction) {
      await addCredit({
        customer_name: customerName,
        sale_amount: finalBillTotal,
        transaction_id: transaction.id,
      });
    }

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

    toast({
      title: 'Bill paid!',
      description: `${finalBillTotal.toLocaleString()} MT via ${bill.paymentMethod}${
        customerName ? ` - ${customerName}` : ''
      }`,
    });
  };

  const printOrder = async (
    items: { dish: Dish; quantity: number; unitPrice: number }[],
    tableLabel: string
  ) => {
    if (items.length === 0 || !currentStore?.id) return;
    try {
      const orderNumber = await getNextOrderNumber(currentStore.id);
      const total = items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
      const order: ReceiptOrder = {
        orderNumber,
        dateTime: new Date(),
        items: items.map(i => ({ name: i.dish.name, qty: i.quantity, price: Number(i.unitPrice) })),
        total,
        storeName: currentStore?.name,
        tableName: tableLabel,
      };
      const bytes = await buildReceiptBytes(order);
      const result = await sendToPrinter(bytes, `pedido-${orderNumber}.bin`);
      if (result.mode === 'usb') {
        toast({ title: `Pedido Nº ${orderNumber}`, description: 'Enviado para a impressora' });
      } else if (result.error && /access denied|open/i.test(result.error)) {
        const opened = printViaSystem(order, new URL(logoAsset.url, window.location.origin).href);
        toast({
          title: `Pedido Nº ${orderNumber}`,
          description: opened
            ? 'A abrir a janela de impressão do sistema — selecione a Xprinter'
            : 'Pop-up bloqueado. Permita pop-ups para imprimir via sistema.',
          variant: opened ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: `Pedido Nº ${orderNumber} - impressora não usada`,
          description: result.error ? `Recibo descarregado. Motivo: ${result.error}` : 'Recibo descarregado',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      console.error('[POS] print error:', e);
      toast({ title: 'Erro ao imprimir', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  const handlePrintBill = (bill: SplitBill, billNumber: number) => {
    const tableLabel = `${tables.find(t => t.id === selectedTable)?.name || 'N/A'} - Conta ${billNumber}`;
    void printOrder(bill.items, tableLabel);
  };

  const handlePrintReceipt = () => {
    void printOrder(currentCart, tables.find(t => t.id === selectedTable)?.name || '');
  };

  const setDiscountApplied = (applied: boolean) => {
    if (selectedTable) {
      setTableDiscounts(prev => ({ ...prev, [selectedTable]: applied }));
    }
  };

  return {
    toast,
    dishes,
    tables,
    addTable,
    deleteTable,
    isManager,
    allStores,
    tableCarts,
    setTableCarts,
    tableDiscounts,
    selectedCategory,
    setSelectedCategory,
    selectedPayment,
    setSelectedPayment,
    selectedTable,
    setSelectedTable,
    isProcessing,
    showCreditModal,
    setShowCreditModal,
    showSplitBillModal,
    setShowSplitBillModal,
    showTableMap,
    setShowTableMap,
    showCart,
    setShowCart,
    showEditPriceModal,
    setShowEditPriceModal,
    selectedDish,
    setSelectedDish,
    showBundleSelector,
    setShowBundleSelector,
    selectedBundle,
    showBreakfastSelector,
    setShowBreakfastSelector,
    searchQuery,
    setSearchQuery,
    existingCustomerNames,
    currentCart,
    breakfastDish,
    categories,
    allCategories,
    enabledCategories,
    updateEnabledCategories,
    filteredDishes,
    isDiscountEnabled,
    discountApplied,
    setDiscountApplied,
    cartTotal,
    showBreakfastDish,
    filteredBundles,
    getEffectivePrice,
    hasOverride,
    setOverridePrice,
    removeOverridePrice,
    getOverridePrice,
    getEffectiveBundlePrice,
    addToCart,
    addBundleToCart,
    handleBundleClick,
    updateQuantity,
    clearCart,
    handleCheckout,
    handleCreditConfirm,
    handleProcessSingleBill,
    handlePrintBill,
    handlePrintReceipt,
  };
}
