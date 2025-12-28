import { useState, useEffect } from 'react'; // Add useEffect import
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Split, Printer, CreditCard, Check, Plus } from 'lucide-react';
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
}

interface SplitBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  paymentMethods: { id: string; name: string; icon: string }[];
  onProcessSingleBill: (bill: SplitBill) => Promise<void>;
  onPrintBill: (bill: SplitBill, billNumber: number) => void;
  storeName: string;
  tableName: string;
}

export function SplitBillModal({
  open,
  onOpenChange,
  cart,
  paymentMethods,
  onProcessSingleBill,
  onPrintBill,
  storeName,
  tableName
}: SplitBillModalProps) {
  const [bills, setBills] = useState<SplitBill[]>([
    { id: 'bill-1', items: [...cart], paymentMethod: null, isPaid: false }
  ]);
  const [selectedBill, setSelectedBill] = useState<string>('bill-1');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset bills when modal opens with new cart
  useEffect(() => {
    if (open && cart.length > 0) {
      // Reset bills with current cart when modal opens
      setBills([
        { id: 'bill-1', items: [...cart], paymentMethod: null, isPaid: false }
      ]);
      setSelectedBill('bill-1');
    }
  }, [open, cart]);

  const currentBill = bills.find(b => b.id === selectedBill);
  const allItemsAssigned = cart.every(cartItem => 
    bills.some(bill => bill.items.some(i => i.dish.id === cartItem.dish.id))
  );
  const allBillsPaid = bills.every(b => b.isPaid);

  const addNewBill = () => {
    const newBill: SplitBill = {
      id: `bill-${bills.length + 1}`,
      items: [],
      paymentMethod: null,
      isPaid: false
    };
    setBills(prev => [...prev, newBill]);
    setSelectedBill(newBill.id);
  };

  const moveItemToBill = (item: CartItem, fromBillId: string, toBillId: string) => {
    setBills(prev => prev.map(bill => {
      if (bill.id === fromBillId) {
        return { ...bill, items: bill.items.filter(i => i.dish.id !== item.dish.id) };
      }
      if (bill.id === toBillId) {
        const existing = bill.items.find(i => i.dish.id === item.dish.id);
        if (existing) {
          return { ...bill, items: bill.items.map(i => 
            i.dish.id === item.dish.id ? { ...i, quantity: i.quantity + item.quantity } : i
          )};
        }
        return { ...bill, items: [...bill.items, item] };
      }
      return bill;
    }));
  };

  const splitItemQuantity = (item: CartItem, fromBillId: string, toBillId: string, quantity: number) => {
    setBills(prev => prev.map(bill => {
      if (bill.id === fromBillId) {
        const remaining = item.quantity - quantity;
        if (remaining <= 0) {
          return { ...bill, items: bill.items.filter(i => i.dish.id !== item.dish.id) };
        }
        return { ...bill, items: bill.items.map(i => 
          i.dish.id === item.dish.id ? { ...i, quantity: remaining } : i
        )};
      }
      if (bill.id === toBillId) {
        const existing = bill.items.find(i => i.dish.id === item.dish.id);
        if (existing) {
          return { ...bill, items: bill.items.map(i => 
            i.dish.id === item.dish.id ? { ...i, quantity: i.quantity + quantity } : i
          )};
        }
        return { ...bill, items: [...bill.items, { dish: item.dish, quantity }] };
      }
      return bill;
    }));
  };

  const setPaymentMethod = (billId: string, method: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, paymentMethod: method } : b));
  };

  const payBill = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.paymentMethod) return;

    setIsProcessing(true);
    await onProcessSingleBill(bill);

    const newBills = bills.filter(b => b.id !== billId);

    if (newBills.length === 0) {
        onOpenChange(false);
    } else {
        setBills(newBills);
        setSelectedBill(newBills[0].id);
    }

    setIsProcessing(false);
  };

  const handlePrintBill = (bill: SplitBill, index: number) => {
    onPrintBill(bill, index + 1);
  };

  const handlePrintAll = () => {
    bills.forEach((bill, idx) => onPrintBill(bill, idx + 1));
  };

  const getBillTotal = (bill: SplitBill) => 
    bill.items.reduce((sum, item) => sum + (Number(item.dish.selling_price) * item.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="w-5 h-5" />
            Split Bill - {tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4">
          {/* Bill Tabs */}
          <div className="col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bills</span>
              <Button size="sm" variant="outline" onClick={addNewBill} className="h-7 gap-1">
                <Plus className="w-3 h-3" /> New Bill
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
                      selectedBill === bill.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50",
                      bill.isPaid && "bg-green-500/10 border-green-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Bill {idx + 1}</span>
                      {bill.isPaid && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className={cn("text-sm", selectedBill === bill.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {bill.items.length} items • {getBillTotal(bill).toLocaleString()} MT
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Current Bill Details */}
          <div className="col-span-2 flex flex-col">
            {currentBill && (
              <>
                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Bill Items</span>
                      <Badge variant={currentBill.isPaid ? "default" : "secondary"}>
                        {currentBill.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto space-y-2">
                    {currentBill.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Split className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No items in this bill</p>
                        <p className="text-xs">Move items from another bill</p>
                      </div>
                    ) : (
                      currentBill.items.map(item => (
                        <div key={item.dish.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                          <div>
                            <p className="font-medium">{item.dish.name}</p>
                            <p className="text-xs text-muted-foreground">{Number(item.dish.selling_price).toLocaleString()} MT × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{(Number(item.dish.selling_price) * item.quantity).toLocaleString()} MT</span>
                            {bills.length > 1 && !currentBill.isPaid && (
                              <select 
                                className="text-sm border rounded px-3 py-2 bg-white" // Made larger
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    if (item.quantity > 1) {
                                      splitItemQuantity(item, currentBill.id, e.target.value, 1);
                                    } else {
                                      moveItemToBill(item, currentBill.id, e.target.value);
                                    }
                                  }
                                }}
                              >
                                <option value="">Move 1 to...</option>
                                {bills.filter(b => b.id !== currentBill.id).map((b, idx) => (
                                  <option key={b.id} value={b.id}>Bill {bills.indexOf(b) + 1}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Payment Section */}
                {!currentBill.isPaid && currentBill.items.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.slice(0, 6).map(method => (
                        <Button
                          key={method.id}
                          variant={currentBill.paymentMethod === method.id ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => setPaymentMethod(currentBill.id, method.id)}
                        >
                          <span>{method.icon}</span>
                          <span className="text-xs">{method.name}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">{getBillTotal(currentBill).toLocaleString()} MT</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePrintBill(currentBill, bills.indexOf(currentBill))}>
                          <Printer className="w-4 h-4 mr-1" /> Print
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={!currentBill.paymentMethod}
                          onClick={() => payBill(currentBill.id)}
                        >
                          <CreditCard className="w-4 h-4 mr-1" /> Pay This Bill
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handlePrintAll}>
            <Printer className="w-4 h-4 mr-2" /> Print All Receipts
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}