import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Factory } from 'lucide-react';
import type { Ingredient, StoreStock } from '@/hooks/useSupabaseData';

interface SubRecipeOutput {
  processed_ingredient_id: string;
  quantity_produced: number;
}

interface SubRecipeDisplay {
  id: string;
  name: string;
  outputs: SubRecipeOutput[];
  items: { raw_ingredient_id: string; quantity_required: number }[];
}

interface ProcessBatchModalProps {
  ingredients: Ingredient[];
  subRecipes: SubRecipeDisplay[];
  stocks: StoreStock[];
  onProcess: (subRecipeId: string, quantity: number) => Promise<any>;
  trigger?: React.ReactNode;
}

export function ProcessBatchModal({ ingredients, subRecipes, stocks, onProcess, trigger }: ProcessBatchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiredMaterials, setRequiredMaterials] = useState<any[]>([]);

  const recipe = subRecipes.find(r => r.id === selectedRecipe);

  useEffect(() => {
    if (recipe && ingredients.length > 0 && stocks.length > 0) {
      const materials = recipe.items.map(item => {
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
    } else {
      setRequiredMaterials([]);
    }
  }, [recipe, quantity, ingredients, stocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;

    setIsSubmitting(true);
    await onProcess(recipe.id, quantity);
    setIsSubmitting(false);
    setIsOpen(false);
    setSelectedRecipe(null);
    setQuantity(1);
  };

  // Get output names for display
  const getOutputsDisplay = (outputs: SubRecipeOutput[]) => {
    return outputs.map(o => {
      const ing = ingredients.find(i => i.id === o.processed_ingredient_id);
      return `${o.quantity_produced} ${ing?.unit || 'units'} ${ing?.name || 'Unknown'}`;
    }).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Factory className="w-4 h-4" />
            Process Batch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Recipe</Label>
              <Select value={selectedRecipe || ''} onValueChange={setSelectedRecipe}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sub-recipe" />
                </SelectTrigger>
                <SelectContent>
                  {subRecipes.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} → {getOutputsDisplay(r.outputs)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recipe && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Batches</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    step="1"
                    required
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium">This batch will produce:</p>
                    {recipe.outputs.map(o => {
                      const ing = ingredients.find(i => i.id === o.processed_ingredient_id);
                      return (
                        <p key={o.processed_ingredient_id}>
                          • {quantity * o.quantity_produced} {ing?.unit} of {ing?.name}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Required Materials</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {requiredMaterials.map(material => (
                      <li key={material.id} className={`flex justify-between ${material.sufficient ? '' : 'text-destructive'}`}>
                        <span>{material.name}</span>
                        <span>{material.required} {material.unit} (Available: {material.available})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !recipe || requiredMaterials.some(m => !m.sufficient)}>
              {isSubmitting ? 'Processing...' : 'Process'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}