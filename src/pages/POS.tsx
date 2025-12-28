import { useState, useEffect } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDishes, useRecipes, useTransactions, useStoreStock, useCredits, useRestaurantTablesManagement } from '@/hooks/useSupabaseData';
import type { Dish } from '@/hooks/useSupabaseData';
import { ManageTablesModal } from '@/components/modals/ManageTablesModal';
import { CreditCustomerModal } from '@/components/modals/CreditCustomerModal';
import { SplitBillModal } from '@/components/modals/SplitBillModal';
import { TableMapModal } from '@/components/modals/TableMapModal';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Printer, Table, Split } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartModal } from '@/components/modals/CartModal';

interface CartItem {
  dish: Dish;
  quantity: number;
}

interface SplitBill {
  id: string;
  items: CartItem[];
  paymentMethod: string | null;
  isPaid: boolean;
}

const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: '💵', isRevenue: true, isCash: true },
  { id: 'mpesa', name: 'M-Pesa', icon: '📱', isRevenue: true, isCash: true },
  { id: 'mkesh', name: 'M-Kesh', icon: '💳', isRevenue: true, isCash: true },
  { id: 'paga_facil', name: 'Paga Fácil', icon: '🏦', isRevenue: true, isCash: true },
  { id: 'credit', name: 'Credito', icon: '📝', isRevenue: false, isCash: false },
  { id: 'self_consumption', name: 'Mesa 0', icon: '🍽️', isRevenue: false, isCash: false },
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

function CartContent({ cart, updateQuantity, setCart, setShowSplitBillModal, selectedPayment, setSelectedPayment, cartTotal, handlePrintReceipt, handleCheckout, isProcessing, selectedTable }: any) {
  return (
    <>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" />Cart</span>
          <div className="flex gap-1">
            {cart.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setShowSplitBillModal(true)} className="gap-1">
                <Split className="w-4 h-4" /> Split
              </Button>
            )}
            {cart.length > 0 && <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-destructive">Clear</Button>}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto py-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
            <p>Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item: CartItem) => (
              <div key={item.dish.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.dish.name}</p>
                  <p className="text-sm text-muted-foreground">{Number(item.dish.selling_price).toLocaleString()} MT × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => updateQuantity(item.dish.id, 0)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <div className="border-t p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(method => (
              <Button key={method.id} variant={selectedPayment === method.id ? "default" : "outline"} size="sm" className={cn("flex flex-col h-auto py-2", !method.isRevenue && selectedPayment === method.id && "bg-amber-600 hover:bg-amber-700")} onClick={() => setSelectedPayment(method.id)}>
                <span className="text-base">{method.icon}</span>
                <span className="text-xs">{method.name}</span>
              </Button>
            ))}
          </div>
          {!paymentMethods.find(m => m.id === selectedPayment)?.isRevenue && (
            <p className="text-xs text-amber-600 mt-2 text-center">⚠️ This payment type does not contribute to revenue</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">Total</span>
            <span className="text-3xl font-bold">{cartTotal.toLocaleString()} MT</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintReceipt} disabled={cart.length === 0} className="gap-2">
              <Printer className="w-4 h-4" />
            </Button>
            <Button className="flex-1 h-12 text-lg" onClick={handleCheckout} disabled={cart.length === 0 || isProcessing || !selectedTable}>
              {isProcessing ? 'Processing...' : <><CreditCard className="w-5 h-5 mr-2" />Complete Sale</>}
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
  const { addCredit } = useCredits(currentStore?.id || null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showTableMap, setShowTableMap] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (currentStore?.id && tables.length < 15) {
      initializeTables(15);
    }
  }, [currentStore?.id, tables.length, initializeTables]);

  useEffect(() => {
    if (!selectedTable) {
      setShowTableMap(true);
    }
  }, [selectedTable]);

  const categories = [...new Set(dishes.map(d => d.category).filter(Boolean))];
  const filteredDishes = selectedCategory ? dishes.filter(d => d.category === selectedCategory) : dishes;
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.dish.selling_price) * item.quantity), 0);

  const addToCart = (dish: Dish) => {
    if (!selectedTable) {
        setShowTableMap(true);
        return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.dish.id === dish.id);
      if (existing) {
        return prev.map(i => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.dish.id !== dishId));
    } else {
      setCart(prev => prev.map(i => i.dish.id === dishId ? { ...i, quantity } : i));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedTable) {
      toast({ title: !selectedTable ? 'Selecione uma tabela' : 'Cart is empty', variant: 'destructive' });
      return;
    }

    if (selectedPayment === 'credit') {
      setShowCreditModal(true);
      return;
    }

    await processCheckout();
  };

  const processCheckout = async (customerName?: string) => {
    setIsProcessing(true);

    for (const cartItem of cart) {
      const dishRecipes = recipes.filter(r => r.dish_id === cartItem.dish.id);
      for (const recipe of dishRecipes) {
        await deductStock(recipe.ingredient_id, Number(recipe.quantity_required) * cartItem.quantity);
      }
    }

    const transaction = await addTransaction(
      cartTotal,
      selectedPayment,
      selectedTable,
      cart.map(item => ({ dishId: item.dish.id, quantity: item.quantity, unitPrice: Number(item.dish.selling_price) }))
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
    
    setCart([]);
    setIsProcessing(false);
    setShowCreditModal(false);
  };

  const handleCreditConfirm = (customerName: string) => {
    processCheckout(customerName);
  };

  const handleProcessSingleBill = async (bill: SplitBill) => {
    const billTotal = bill.items.reduce((sum, item) => sum + (Number(item.dish.selling_price) * item.quantity), 0);

    for (const cartItem of bill.items) {
      const dishRecipes = recipes.filter(r => r.dish_id === cartItem.dish.id);
      for (const recipe of dishRecipes) {
        await deductStock(recipe.ingredient_id, Number(recipe.quantity_required) * cartItem.quantity);
      }
    }

    await addTransaction(
      billTotal,
      bill.paymentMethod || 'cash',
      selectedTable,
      bill.items.map(item => ({ dishId: item.dish.id, quantity: item.quantity, unitPrice: Number(item.dish.selling_price) }))
    );

    setCart(prevCart => {
        const newCart = [...prevCart];
        for (const item of bill.items) {
            const index = newCart.findIndex(cartItem => cartItem.dish.id === item.dish.id);
            if (index !== -1) {
                newCart[index].quantity -= item.quantity;
                if (newCart[index].quantity <= 0) {
                    newCart.splice(index, 1);
                }
            }
        }
        return newCart;
    });

    toast({ title: 'Bill paid!', description: `Paid ${billTotal.toLocaleString()} MT` });
  };

  const handlePrintBill = (bill: SplitBill, billNumber: number) => {
    const billTotal = bill.items.reduce((sum, item) => sum + (Number(item.dish.selling_price) * item.quantity), 0);
    const receipt = [
      `${currentStore?.name}`,
      `Table: ${tables.find(t => t.id === selectedTable)?.name || 'N/A'} - Bill ${billNumber}`,
      `Date: ${new Date().toLocaleString()}`,
      '─'.repeat(30),
      ...bill.items.map(item => `${item.dish.name} x${item.quantity} - ${(Number(item.dish.selling_price) * item.quantity).toLocaleString()} MT`),
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
    const receipt = [
      `${currentStore?.name}`,
      `Table: ${tables.find(t => t.id === selectedTable)?.name || 'N/A'}`,
      `Date: ${new Date().toLocaleString()}`,
      '─'.repeat(30),
      ...cart.map(item => `${item.dish.name} x${item.quantity} - ${(Number(item.dish.selling_price) * item.quantity).toLocaleString()} MT`),
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
    <div className="h-[calc(100vh-3rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ponto de vendas</h1>
            <p className="text-muted-foreground">Selecione os itens para adicionar ao carrinho</p>
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
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
          {categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDishes.map(dish => (
              <Card key={dish.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]" onClick={() => addToCart(dish)}>
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{dish.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">{dish.category}</Badge>
                  <p className="text-lg font-bold text-primary mt-2">{Number(dish.selling_price).toLocaleString()} MT</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-96">
        <Card className="w-full flex flex-col shrink-0">
          <CartContent
            cart={cart}
            updateQuantity={updateQuantity}
            setCart={setCart}
            setShowSplitBillModal={setShowSplitBillModal}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            cartTotal={cartTotal}
            handlePrintReceipt={handlePrintReceipt}
            handleCheckout={handleCheckout}
            isProcessing={isProcessing}
            selectedTable={selectedTable}
          />
        </Card>
      </div>

      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button size="lg" className="rounded-full w-36 h-16 shadow-lg" onClick={() => setShowCart(true)}>
          <ShoppingBag className="w-6 h-6 mr-2" />
          View Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
        </Button>
      </div>

      <CreditCustomerModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        amount={cartTotal}
        onConfirm={handleCreditConfirm}
      />

      <TableMapModal
        open={showTableMap}
        onOpenChange={setShowTableMap}
        tables={tables}
        onSelectTable={setSelectedTable}
      />

      <CartModal open={showCart} onOpenChange={setShowCart}>
        <CartContent
          cart={cart}
          updateQuantity={updateQuantity}
          setCart={setCart}
          setShowSplitBillModal={setShowSplitBillModal}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          cartTotal={cartTotal}
          handlePrintReceipt={handlePrintReceipt}
          handleCheckout={handleCheckout}
          isProcessing={isProcessing}
          selectedTable={selectedTable}
        />
      </CartModal>

      <SplitBillModal
        open={showSplitBillModal}
        onOpenChange={setShowSplitBillModal}
        cart={cart}
        paymentMethods={paymentMethods}
        onProcessSingleBill={handleProcessSingleBill}
        onPrintBill={handlePrintBill}
        storeName={currentStore?.name || ''}
        tableName={tables.find(t => t.id === selectedTable)?.name || 'Table'}
      />
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
