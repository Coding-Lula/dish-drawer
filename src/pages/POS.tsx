import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/contexts/StoreContext';
import { dishes, paymentMethods, recipes, ingredients } from '@/data/mockData';
import type { CartItem, PaymentMethodType } from '@/types/pos';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [...new Set(dishes.map(d => d.category))];

export default function POS() {
  const { toast } = useToast();
  const { 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal,
    addTransaction,
    currentStore,
    currentStaff,
    updateStock
  } = useStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredDishes = selectedCategory 
    ? dishes.filter(d => d.category === selectedCategory)
    : dishes;

  const handleAddDish = (dish: typeof dishes[0]) => {
    addToCart({ dish, quantity: 1 });
    toast({
      title: "Added to cart",
      description: `${dish.name} added`,
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items before checkout",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));

    // Deduct stock based on recipes
    cart.forEach(cartItem => {
      const dishRecipes = recipes.filter(r => r.dishId === cartItem.dish.id);
      dishRecipes.forEach(recipe => {
        const totalRequired = recipe.quantityRequired * cartItem.quantity;
        updateStock(recipe.ingredientId, -totalRequired);
      });
    });

    // Create transaction
    const transaction = {
      id: `trans-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        unitPrice: item.dish.sellingPrice,
      })),
      totalAmount: cartTotal,
      paymentMethodId: selectedPayment,
      staffId: currentStaff.id,
      storeId: currentStore.id,
    };

    addTransaction(transaction);
    clearCart();
    setIsProcessing(false);

    const paymentMethod = paymentMethods.find(m => m.id === selectedPayment);
    toast({
      title: "Sale Complete! ✓",
      description: `${cartTotal.toLocaleString()} MT via ${paymentMethod?.name}${!paymentMethod?.isRevenue ? ' (No Revenue)' : ''}`,
    });
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-3rem)] flex gap-6">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-muted-foreground">Select items to add to cart</p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button 
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredDishes.map(dish => (
                <Card 
                  key={dish.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50"
                  onClick={() => handleAddDish(dish)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center mb-3">
                        <ShoppingBag className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{dish.name}</h3>
                      <Badge variant="secondary" className="text-xs mb-2">{dish.category}</Badge>
                      <p className="text-lg font-bold text-primary">{dish.sellingPrice} MT</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <Card className="w-96 flex flex-col shrink-0">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Cart
              </span>
              {cart.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                >
                  Clear
                </Button>
              )}
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
                {cart.map(item => (
                  <div 
                    key={item.dish.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.dish.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.dish.sellingPrice} MT × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(item.dish.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(item.dish.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item.dish.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Payment & Checkout */}
          <div className="border-t p-4 space-y-4">
            {/* Payment Methods */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(method => (
                  <Button
                    key={method.id}
                    variant={selectedPayment === method.id ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex flex-col h-auto py-2 px-2",
                      !method.isRevenue && selectedPayment === method.id && "bg-amber-600 hover:bg-amber-700"
                    )}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <span className="text-base mb-0.5">{method.icon}</span>
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
              </div>
              {!paymentMethods.find(m => m.id === selectedPayment)?.isRevenue && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  ⚠️ This payment type does not contribute to revenue
                </p>
              )}
            </div>

            {/* Total & Checkout */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Total</span>
                <span className="text-3xl font-bold text-foreground">{cartTotal.toLocaleString()} MT</span>
              </div>
              <Button 
                className="w-full h-12 text-lg"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Complete Sale
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
