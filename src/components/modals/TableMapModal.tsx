import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RestaurantTable, Dish } from '@/hooks/useSupabaseData';

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

// ============ TableMapModal Component ============
interface TableMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: RestaurantTable[];
  onSelectTable: (tableId: string) => void;
  tableOrders: Record<string, CartItem[]>; // Added
}

interface TableMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: RestaurantTable[];
  onSelectTable: (tableId: string) => void;
}

export function TableMapModal({ open, onOpenChange, tables, onSelectTable, tableOrders }: TableMapModalProps) {
  const getTableStatus = (tableId: string) => {
    const orders = tableOrders[tableId];
    return orders && orders.length > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Table</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4">
          {tables.map(table => {
            const isOccupied = getTableStatus(table.id);
            const orderCount = tableOrders[table.id]?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            
            return (
              <Button
                key={table.id}
                variant={isOccupied ? "default" : "outline"}
                className={`h-20 flex flex-col ${isOccupied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => {
                  onSelectTable(table.id);
                  onOpenChange(false);
                }}
              >
                <span className="font-medium">{table.name}</span>
                {isOccupied && (
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full mb-1">
                      Occupied
                    </span>
                    <span className="text-xs">
                      {orderCount} items
                    </span>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}