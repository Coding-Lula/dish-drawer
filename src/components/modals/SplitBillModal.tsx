import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; 
import { Button } from '@/components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Badge } from '@/components/ui/badge'; 
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Split, Printer, CreditCard, Check, Plus, Minus, User, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils'; 
import type { Dish } from '@/hooks/useSupabaseData'; 

interface CartItem {
  dish: Dish;
  quantity: number; 
}

interface SplitBill {
  id: string;
  items: CartItem[];
  paymentMethod: string | null;
  isPaid: boolean;
  customerName?: string;
  storeId?: string;
}

interface StoreOption {
  id: string;
  name: string;
}

interface SplitBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  paymentMethods: { id: string; name: string; icon: string; isRevenue?: boolean }[];
  onProcessSingleBill: (bill: SplitBill, customerName?: string) => Promise<void>; 
  onPrintBill: (bill: SplitBill, billNumber: number) => void; 
  storeName: string;
  tableName: string;
  existingCustomers?: string[];
  stores?: StoreOption[];
  currentStoreId?: string;
}

export function SplitBillModal({
  open,
  onOpenChange,
  cart,
  paymentMethods,
  onProcessSingleBill,
  onPrintBill,
  storeName,
  tableName,
  existingCustomers = [],
  stores = [],
  currentStoreId
}: SplitBillModalProps) {
  const [bills, setBills] = useState<SplitBill[]>([
    { id: 'bill-1', items: [...cart], paymentMethod: null, isPaid: false, storeId: currentStoreId }
  ]); 
  const [selectedBill, setSelectedBill] = useState<string>('bill-1'); 
  const [isProcessing, setIsProcessing] = useState(false); 
  const [splitQuantities, setSplitQuantities] = useState<Record<string, Record<string, number>>>({}); 
  const [creditCustomerName, setCreditCustomerName] = useState<Record<string, string>>({}); 
  const [showCreditInput, setShowCreditInput] = useState<string | null>(null);
  const [showCreditSuggestions, setShowCreditSuggestions] = useState(false);
  const creditInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && cart.length > 0) {
      setBills([{ id: 'bill-1', items: [...cart], paymentMethod: null, isPaid: false, storeId: currentStoreId }]);
      setSelectedBill('bill-1');
      setSplitQuantities({});
      setCreditCustomerName({});
      setShowCreditInput(null);
    }
  }, [open, cart, currentStoreId]);

  const currentBill = bills.find(b => b.id === selectedBill);
  
  const addNewBill = () => {
    const newBill: SplitBill = {
      id: `bill-${bills.length + 1}`,
      items: [],
      paymentMethod: null,
      isPaid: false,
      storeId: currentStoreId
    };
    setBills(prev => [...prev, newBill]); 
    setSelectedBill(newBill.id); 
  };

  const setBillStore = (billId: string, storeId: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, storeId } : b));
  };

  const splitItemQuantity = (item: CartItem, fromBillId: string, toBillId: string, quantity: number) => {
    if (quantity <= 0 || quantity > item.quantity) return; 
    setBills(prev => prev.map(bill => {
      if (bill.id === fromBillId) {
        const remaining = item.quantity - quantity;
        if (remaining <= 0) {
          return { ...bill, items: bill.items.filter(i => i.dish.id !== item.dish.id) };
        }
        return { ...bill, items: bill.items.map(i => i.dish.id === item.dish.id ? { ...i, quantity: remaining } : i )}; 
      }
      if (bill.id === toBillId) {
        const existing = bill.items.find(i => i.dish.id === item.dish.id);
        if (existing) {
          return { ...bill, items: bill.items.map(i => i.dish.id === item.dish.id ? { ...i, quantity: i.quantity + quantity } : i )}; 
        }
        return { ...bill, items: [...bill.items, { dish: item.dish, quantity }] }; 
      }
      return bill;
    }));
    setSplitQuantities(prev => {
      const newState = { ...prev };
      if (newState[fromBillId]) { delete newState[fromBillId][item.dish.id]; }
      return newState;
    }); 
  };

  const setPaymentMethod = (billId: string, method: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, paymentMethod: method } : b)); 
    if (method === 'credit') {
      setShowCreditInput(billId); 
    } else {
      setShowCreditInput(null); 
    }
  };

  const payBill = async (billId: string) => {
    const bill = bills.find(b => b.id === billId); 
    if (!bill || !bill.paymentMethod) return; 
    
    if (bill.paymentMethod === 'credit') {
      const customerName = creditCustomerName[billId]?.trim();
      if (!customerName) return; 
      setIsProcessing(true); 
      await onProcessSingleBill(bill, customerName); 
    } else {
      setIsProcessing(true);
      await onProcessSingleBill(bill); 
    }

    const newBills = bills.filter(b => b.id !== billId); 
    if (newBills.length === 0) {
      onOpenChange(false); 
    } else {
      setBills(newBills); 
      setSelectedBill(newBills[0].id); 
    }
    setIsProcessing(false); 
    setShowCreditInput(null); 
  };

  const getBillTotal = (bill: SplitBill) => bill.items.reduce((sum, item) => sum + (Number(item.dish.selling_price) * item.quantity), 0); 
  const getSplitQty = (billId: string, dishId: string) => splitQuantities[billId]?.[dishId] ?? 1; 
  const setSplitQty = (billId: string, dishId: string, qty: number, maxQty: number) => {
    const clampedQty = Math.min(Math.max(1, qty), maxQty);
    setSplitQuantities(prev => ({ ...prev, [billId]: { ...(prev[billId] || {}), [dishId]: clampedQty } })); 
  };

  const getStoreName = (storeId?: string) => {
    if (!storeId) return storeName;
    return stores.find(s => s.id === storeId)?.name || storeName;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="w-5 h-5" /> Dividir Conta - {tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4">
          {/* Bill Tabs */}
          <div className="col-span-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Contas</span>
              <Button size="sm" variant="outline" onClick={addNewBill} className="h-7 gap-1">
                <Plus className="w-3 h-3" /> Nova Conta
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              <div className="space-y-2">
                {bills.map((bill, idx) => (
                  <button
                    key={bill.id}
                    onClick={() => setSelectedBill(bill.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedBill === bill.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Conta {idx + 1}</span>
                        {stores.length > 1 && (
                          <Popover>
                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button
                                className={cn(
                                  "inline-flex items-center justify-center rounded-md p-1 transition-colors",
                                  selectedBill === bill.id
                                    ? "hover:bg-primary-foreground/20 text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                                )}
                                title={`Loja: ${getStoreName(bill.storeId)}`}
                              >
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="start" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-0.5">
                                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Selecionar Loja</p>
                                {stores.map(store => (
                                  <button
                                    key={store.id}
                                    className={cn(
                                      "w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors",
                                      bill.storeId === store.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                    )}
                                    onClick={() => setBillStore(bill.id, store.id)}
                                  >
                                    {store.name}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      {bill.isPaid && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className={cn("text-sm", selectedBill === bill.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {bill.items.length} items • {getBillTotal(bill).toLocaleString()} MT
                    </div>
                    {stores.length > 1 && bill.storeId && bill.storeId !== currentStoreId && (
                      <div className={cn("text-[10px] mt-0.5 flex items-center gap-1", selectedBill === bill.id ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        <UtensilsCrossed className="w-2.5 h-2.5" />
                        {getStoreName(bill.storeId)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Current Bill Details */}
          <div className="col-span-2 flex flex-col overflow-hidden">
            {currentBill && (
              <>
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Itens de Conta</span>
                      <Badge variant={currentBill.isPaid ? "default" : "secondary"}>
                        {currentBill.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea className="flex-1">
                    <CardContent className="p-4 space-y-3">
                      {currentBill.items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Split className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p></p>
                        </div>
                      ) : (
                        currentBill.items.map(item => {
                          const otherBills = bills.filter(b => b.id !== currentBill.id);
                          const splitQty = getSplitQty(currentBill.id, item.dish.id);
                          return (
                            <div key={item.dish.id} className="p-3 rounded-lg bg-muted/30 border">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{item.dish.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {Number(item.dish.selling_price).toLocaleString()} MT × {item.quantity}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">Qty: {item.quantity}</Badge>
                              </div>
                              {bills.length > 1 && !currentBill.isPaid && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                  <div className="flex items-center gap-1">
                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setSplitQty(currentBill.id, item.dish.id, splitQty - 1, item.quantity)} disabled={splitQty <= 1}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Input type="number" value={splitQty} onChange={(e) => setSplitQty(currentBill.id, item.dish.id, Number(e.target.value), item.quantity)} className="w-10 h-6 text-center text-xs p-0" />
                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setSplitQty(currentBill.id, item.dish.id, splitQty + 1, item.quantity)} disabled={splitQty >= item.quantity}>
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {otherBills.map((b) => (
                                      <Button key={b.id} size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => splitItemQuantity(item, currentBill.id, b.id, splitQty)}>
                                        Para Conta {bills.indexOf(b) + 1}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>

                {/* Payment Section */}
                {!currentBill.isPaid && currentBill.items.length > 0 && (
                  <div className="mt-4 p-4 border rounded-lg bg-background shadow-sm space-y-3">
                    <div className={cn("grid gap-1.5 transition-all", showCreditInput ? "grid-cols-7" : "grid-cols-4")}>
                      {paymentMethods.slice(0, 7).map(method => (
                        <Button
                          key={method.id}
                          variant={currentBill.paymentMethod === method.id ? "default" : "outline"}
                          size="sm"
                          className={cn("flex flex-col h-auto py-1", method.id === 'credit' && currentBill.paymentMethod === method.id && "bg-amber-600 hover:bg-amber-700")}
                          onClick={() => setPaymentMethod(currentBill.id, method.id)}
                        >
                          <span className={showCreditInput ? "text-xs" : "text-sm"}>{method.icon}</span>
                          {!showCreditInput && <span className="text-[10px]">{method.name}</span>}
                        </Button>
                      ))}
                    </div>
                    
                    {showCreditInput === currentBill.id && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="customer-name" className="text-xs font-bold text-amber-700 flex items-center gap-2">
                          <User className="w-3 h-3" /> NOME DO CLIENTE (OBRIGATÓRIO)
                        </Label>
                        <div className="relative" ref={creditInputRef}>
                          <Input
                            id="customer-name"
                            value={creditCustomerName[currentBill.id] || ''}
                            onChange={(e) => { setCreditCustomerName(prev => ({ ...prev, [currentBill.id]: e.target.value })); setShowCreditSuggestions(true); }}
                            onFocus={() => setShowCreditSuggestions(true)}
                            placeholder="Insira o nome para o crédito"
                            className="h-9 border-amber-200"
                            autoFocus
                            autoComplete="off"
                          />
                          {showCreditSuggestions && (creditCustomerName[currentBill.id] || '').trim() && (() => {
                            const filtered = existingCustomers.filter(c => c.toLowerCase().includes((creditCustomerName[currentBill.id] || '').toLowerCase())).slice(0, 5);
                            return filtered.length > 0 ? (
                              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-32 overflow-auto">
                                {filtered.map((name) => (
                                  <button
                                    key={name}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    onClick={() => { setCreditCustomerName(prev => ({ ...prev, [currentBill.id]: name })); setShowCreditSuggestions(false); }}
                                  >
                                    {name}
                                  </button>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xl font-bold">{getBillTotal(currentBill).toLocaleString()} MT</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPrintBill(currentBill, bills.indexOf(currentBill) + 1)}>
                          <Printer className="w-4 h-4 mr-1" /> Imprimir
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={!currentBill.paymentMethod || isProcessing || (currentBill.paymentMethod === 'credit' && !creditCustomerName[currentBill.id]?.trim())}
                          onClick={() => payBill(currentBill.id)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" /> Pagar Conta
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-auto">
          <Button variant="outline" onClick={() => bills.forEach((b, i) => onPrintBill(b, i + 1))}>
            <Printer className="w-4 h-4 mr-2" /> Print All
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
