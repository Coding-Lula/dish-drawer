import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductionLogs, SubRecipe, Ingredient, StoreStock } from '@/hooks/useSupabaseData';
import { useCurrentStore } from '@/components/layout/MainLayout';
import { useIngredients, useStoreStock } from '@/hooks/useSupabaseData';

interface ProcessBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: SubRecipe | null;
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductionLogs, SubRecipe, Ingredient, StoreStock } from '@/hooks/useSupabaseData';
import { useCurrentStore } from '@/components/layout/MainLayout';
import { useIngredients, useStoreStock } from '@/hooks/useSupabaseData';

interface ProcessBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: SubRecipe | null;
}

export function ProcessBatchModal({ isOpen, onClose, recipe }: ProcessBatchModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { processBatch } = useProductionLogs(useCurrentStore().id);
  const { ingredients } = useIngredients();
  const { stocks } = useStoreStock(useCurrentStore().id);
  const [requiredMaterials, setRequiredMaterials] = useState([]);

  useEffect(() => {
    if (recipe && ingredients.length > 0 && stocks.length > 0) {
      const materials = recipe.sub_recipe_items.map(item => {
        const ingredient = ingredients.find(i => i.id === item.raw_ingredient_id);
        const stock = stocks.find(s => s.ingredient_id === item.raw_ingredient_id);
        const required = item.quantity_required * quantity;
        return {
          ...ingredient,
          required,
          available: stock?.current_quantity || 0,
          sufficient: (stock?.current_quantity || 0) >= required,
        };
      });
      setRequiredMaterials(materials);
    }
  }, [recipe, quantity, ingredients, stocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipe) return;

    setIsSubmitting(true);
    await processBatch(recipe.id, quantity, ingredients, stocks);
    setIsSubmitting(false);
    onClose();
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Batch: {recipe.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Number of Batches</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                min="1"
                step="1"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will produce {quantity * recipe.quantity_produced} units of {ingredients.find(i => i.id === recipe.processed_ingredient_id)?.name}.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Required Materials</h4>
              <ul className="text-sm text-muted-foreground">
                {requiredMaterials.map(material => (
                  <li key={material.id} className={`flex justify-between ${material.sufficient ? '' : 'text-destructive'}`}>
                    <span>{material.name}</span>
                    <span>{material.required} {material.unit} (Available: {material.available})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || requiredMaterials.some(m => !m.sufficient)}>
              {isSubmitting ? 'Processing...' : 'Process'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
