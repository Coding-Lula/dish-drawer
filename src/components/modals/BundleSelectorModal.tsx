import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coffee, Check } from 'lucide-react';
import type { BundleWithComponents } from '@/hooks/useBundles';
import type { Dish } from '@/hooks/useSupabaseData';

interface BundleSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: BundleWithComponents;
  dishes: Dish[];
  effectivePrice: number;
  onConfirm: (selectedDishIds: string[]) => void;
}

export function BundleSelectorModal({
  open,
  onOpenChange,
  bundle,
  dishes,
  effectivePrice,
  onConfirm,
}: BundleSelectorModalProps) {
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  // Get dishes that are components of this bundle
  const availableDishes = useMemo(() => {
    return bundle.components.map(comp => {
      const dish = dishes.find(d => d.id === comp.dish_id);
      return {
        ...comp,
        dish,
      };
    }).filter(c => c.dish);
  }, [bundle.components, dishes]);

  // Required dishes (auto-selected)
  const requiredDishIds = useMemo(() => {
    return bundle.components
      .filter(c => c.is_required)
      .map(c => c.dish_id);
  }, [bundle.components]);

  // Initialize with required dishes when modal opens
  useState(() => {
    setSelectedDishIds(requiredDishIds);
  });

  const toggleDish = (dishId: string, isRequired: boolean) => {
    if (isRequired) return; // Can't toggle required dishes
    
    setSelectedDishIds(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleConfirm = () => {
    const allSelected = [...new Set([...requiredDishIds, ...selectedDishIds])];
    onConfirm(allSelected);
    setSelectedDishIds([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedDishIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-primary" />
            {bundle.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{bundle.description}</p>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Personalize o seu {bundle.name}:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {effectivePrice.toLocaleString()} MT
            </Badge>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {availableDishes.map(({ dish, is_required, id }) => {
                if (!dish) return null;
                const isSelected = selectedDishIds.includes(dish.id) || is_required;
                
                return (
                  <div
                    key={id}
                    onClick={() => toggleDish(dish.id, is_required)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary/50' : 'bg-muted/30 border-border hover:bg-muted/50'}
                      ${is_required ? 'cursor-default' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={is_required}
                        onCheckedChange={() => toggleDish(dish.id, is_required)}
                      />
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-xs text-muted-foreground">{dish.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {is_required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {availableDishes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No items configured for this bundle</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedDishIds.length === 0 && requiredDishIds.length === 0}>
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
