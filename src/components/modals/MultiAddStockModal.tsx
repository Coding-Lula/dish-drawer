import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Trash2, PlusCircle } from 'lucide-react';
import type { Ingredient } from '@/hooks/useSupabaseData';

interface MultiAddStockModalProps {
  ingredients: Ingredient[];
  onSubmit: (items: { ingredientId: string; quantity: number; totalCost: number }[]) => Promise<any>;
}

export function MultiAddStockModal({ ingredients, onSubmit }: MultiAddStockModalProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ ingredientId: '', quantity: '', totalCost: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ingredientId: '', quantity: '', totalCost: '' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(item => item.ingredientId && item.quantity && item.totalCost)
      .map(item => ({
        ingredientId: item.ingredientId,
        quantity: parseFloat(item.quantity),
        totalCost: parseFloat(item.totalCost)
      }));

    if (validItems.length === 0) return;

    setIsSubmitting(true);
    const result = await onSubmit(validItems);
    setIsSubmitting(false);

    if (result) {
      setItems([{ ingredientId: '', quantity: '', totalCost: '' }]);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Repor Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add Stock (Replenish Multiple)
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, index) => {
              const selectedIngredient = ingredients.find(i => i.id === item.ingredientId);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Select value={item.ingredientId} onValueChange={(value) => handleItemChange(index, 'ingredientId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder={`Quantity (${selectedIngredient?.unit || 'unit'})`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.totalCost}
                      onChange={(e) => handleItemChange(index, 'totalCost', e.target.value)}
                      placeholder="Total Cost (MT)"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <PlusCircle className="w-3 h-3" />
            Add Another Item
          </Button>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add All Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
