import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Coffee, Check, Search } from 'lucide-react';
import type { Dish } from '@/hooks/useSupabaseData';

interface DishSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  dishes: Dish[];
  price: number;
  onConfirm: (selectedDishIds: string[]) => void;
}

export function DishSelectionModal({
  open,
  onOpenChange,
  title,
  dishes,
  price,
  onConfirm,
}: DishSelectionModalProps) {
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDishes = useMemo(() => {
    return dishes
      .filter(dish =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.category && dish.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dishes, searchQuery]);

  const toggleDish = (dishId: string) => {
    setSelectedDishIds(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedDishIds);
    setSelectedDishIds([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedDishIds([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Select items to include:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {price.toLocaleString()} MT
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-2">
              {filteredDishes.map((dish) => {
                const isSelected = selectedDishIds.includes(dish.id);

                return (
                  <div
                    key={dish.id}
                    onClick={() => toggleDish(dish.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary/50' : 'bg-muted/30 border-border hover:bg-muted/50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDish(dish.id)}
                      />
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-xs text-muted-foreground">{dish.category}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                );
              })}

              {filteredDishes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No dishes found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedDishIds.length} items selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedDishIds.length === 0}>
              Add to Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
