import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RestaurantTable } from '@/hooks/useSupabaseData';

interface TableMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: RestaurantTable[];
  onSelectTable: (tableId: string) => void;
}

export function TableMapModal({ open, onOpenChange, tables, onSelectTable }: TableMapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Table</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4">
          {tables.map(table => (
            <Button
              key={table.id}
              variant="outline"
              className="h-20"
              onClick={() => {
                onSelectTable(table.id);
                onOpenChange(false);
              }}
            >
              {table.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
