import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Package, Trash2, UtensilsCrossed } from 'lucide-react';
import type { Ingredient, Dish } from '@/hooks/useSupabaseData';

interface SelectedIngredient {
  ingredient: Ingredient;
  quantity: number;
}

interface CreateRecipeModalProps {
  dish: Dish;
  ingredients: Ingredient[];
  existingRecipes: { ingredient_id: string; quantity_required: number }[];
  onSave: (recipes: { ingredient_id: string; quantity_required: number }[]) => Promise<void>;
}

export function CreateRecipeModal({ dish, ingredients, existingRecipes, onSave }: CreateRecipeModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>(() => 
    existingRecipes.map(r => {
      const ingredient = ingredients.find(i => i.id === r.ingredient_id);
      return ingredient ? { ingredient, quantity: r.quantity_required } : null;
    }).filter(Boolean) as SelectedIngredient[]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FIXED_PRODUCTION_COST = 20;

  const toggleIngredient = (ingredient: Ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(s => s.ingredient.id === ingredient.id);
      if (exists) {
        return prev.filter(s => s.ingredient.id !== ingredient.id);
      }
      return [...prev, { ingredient, quantity: 1 }];
    });
  };

  const updateQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients(prev => 
      prev.map(s => s.ingredient.id === ingredientId ? { ...s, quantity: isNaN(quantity) ? 0 : Math.max(0, quantity) } : s)
    );
  };

  const totalIngredientCost = selectedIngredients.reduce(
    (sum, s) => sum + (s.quantity * Number(s.ingredient.average_cost)), 0
  );
  const totalCost = totalIngredientCost + FIXED_PRODUCTION_COST;
  const profitMargin = dish.selling_price > 0 
    ? ((Number(dish.selling_price) - totalCost) / Number(dish.selling_price) * 100).toFixed(1)
    : '0';

  const handleSave = async () => {
    setIsSubmitting(true);
    await onSave(
      selectedIngredients.map(s => ({
        ingredient_id: s.ingredient.id,
        quantity_required: s.quantity
      }))
    );
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Edit Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Create Technical Sheet: {dish.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Selling Price</Label>
              <p className="text-xl font-bold">{Number(dish.selling_price).toLocaleString()} MT</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Profit Margin</Label>
              <p className="text-xl font-bold text-primary">{profitMargin}%</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 min-h-0">
            {/* Available Ingredients */}
            <div className="flex flex-col min-h-0">
              <Label className="mb-2">Available Ingredients</Label>
              <ScrollArea className="h-[300px] border rounded-lg p-2">
                <div className="space-y-1 pr-2">
                  {ingredients.map(ingredient => {
                    const isSelected = selectedIngredients.some(s => s.ingredient.id === ingredient.id);
                    return (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => toggleIngredient(ingredient)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                          isSelected ? 'bg-primary/20 border border-primary/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ingredient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(ingredient.average_cost).toFixed(2)} MT/{ingredient.unit}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Selected Ingredients with Quantities */}
            <div className="flex flex-col min-h-0">
              <Label className="mb-2">Recipe Ingredients ({selectedIngredients.length})</Label>
              <ScrollArea className="h-[300px] border rounded-lg p-2">
            <div className="space-y-2">
            {selectedIngredients.map(({ ingredient, quantity }) => (
    
            <div key={ingredient.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border">
              <Package className="w-4 h-4 text-muted-foreground shrink-0" />
      
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate flex-1">{ingredient.name}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value))}
                    className="w-20 h-8 text-sm"
                    step="any"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground w-8">{ingredient.unit}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Cost: {(quantity * Number(ingredient.average_cost)).toFixed(2)} MT
              </p>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 text-destructive"
              onClick={() => toggleIngredient(ingredient)}
            >
            <Trash2 className="h-4 w-4" />
            </Button>
          </div>
  ))}
</div>
              </ScrollArea>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Ingredients</p>
                <p className="font-bold">{totalIngredientCost.toFixed(2)} MT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Production</p>
                <p className="font-bold">{FIXED_PRODUCTION_COST} MT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="font-bold text-amber-600">{totalCost.toFixed(2)} MT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-bold text-primary">{(Number(dish.selling_price) - totalCost).toFixed(2)} MT</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}