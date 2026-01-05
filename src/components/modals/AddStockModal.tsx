import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package } from 'lucide-react';
import type { Ingredient } from '@/hooks/useSupabaseData';

interface AddStockModalProps {
  ingredients: Ingredient[];
  onSubmit: (ingredientId: string, quantity: number, totalCost: number) => Promise<any>;
}

export function AddStockModal({ ingredients, onSubmit }: AddStockModalProps) {
  const [open, setOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIngredient = ingredients.find(i => i.id === ingredientId);
  const unitCost = quantity && totalCost && parseFloat(quantity) > 0 
    ? (parseFloat(totalCost) / parseFloat(quantity)).toFixed(2) 
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientId || !quantity || !totalCost) return;
    
    setIsSubmitting(true);
    const result = await onSubmit(ingredientId, parseFloat(quantity), parseFloat(totalCost));
    setIsSubmitting(false);
    
    if (result) {
      setIngredientId('');
      setQuantity('');
      setTotalCost('');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add Stock (Replenish)
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Item</Label>
            <Select value={ingredientId} onValueChange={setIngredientId}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity {selectedIngredient && `(${selectedIngredient.unit})`}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>Total Cost (MT)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
          
          {quantity && totalCost && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Calculated Unit Cost</p>
              <p className="text-xl font-bold text-primary">{unitCost} MT / {selectedIngredient?.unit || 'unit'}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !ingredientId || !quantity || !totalCost}>
              {isSubmitting ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
