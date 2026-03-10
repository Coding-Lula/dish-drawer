import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Trash2, UtensilsCrossed, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRecipeModal({ dish, ingredients, existingRecipes, onSave, open, onOpenChange }: CreateRecipeModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>(() => 
    existingRecipes.map(r => {
      const ingredient = ingredients.find(i => i.id === r.ingredient_id);
      return ingredient ? { ingredient, quantity: r.quantity_required } : null;
    }).filter(Boolean) as SelectedIngredient[]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FIXED_PRODUCTION_COST = dish.cost_of_production ?? 20;

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <UtensilsCrossed className="w-5 h-5 text-slate-500" />
            Ficha Técnica: {dish.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-6">
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço de Venda</p>
              <p className="text-2xl font-black text-slate-900">{Number(dish.selling_price).toLocaleString()} <span className="text-sm font-bold text-slate-400">MT</span></p>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margem de Lucro</p>
              <p className="text-2xl font-black text-emerald-500">{profitMargin}%</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-6 min-h-0">
            {/* Available Ingredients */}
            <div className="flex flex-col min-h-0">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Ingredientes Disponíveis</Label>
              <ScrollArea className="flex-1 border-none bg-slate-50/50 rounded-lg p-2">
                <div className="space-y-2 pr-2">
                  {ingredients.map(ingredient => {
                    const isSelected = selectedIngredients.some(s => s.ingredient.id === ingredient.id);
                    return (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => toggleIngredient(ingredient)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border",
                          isSelected
                            ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100"
                            : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          isSelected ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{ingredient.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {Number(ingredient.average_cost).toFixed(0)} MT / {ingredient.unit}
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
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Ingredientes da Receita ({selectedIngredients.length})</Label>
              <ScrollArea className="flex-1 border-none bg-slate-50/50 rounded-lg p-2">
                <div className="space-y-2 pr-2">
                  {selectedIngredients.map(({ ingredient, quantity }) => (
                    <div key={ingredient.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{ingredient.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {(quantity * Number(ingredient.average_cost)).toFixed(2)} MT
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            type="number"
                            value={quantity || ''}
                            onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value))}
                            className="w-20 h-9 text-sm font-bold text-center bg-slate-50 border-none rounded-md pr-7 focus-visible:ring-1 focus-visible:ring-slate-200"
                            step="any"
                            min="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                            {ingredient.unit}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          onClick={() => toggleIngredient(ingredient)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="p-6 rounded-lg bg-slate-900 text-white shadow-lg">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ingredientes</p>
                <p className="text-sm font-bold">{totalIngredientCost.toFixed(2)} <span className="text-[10px] text-slate-500">MT</span></p>
              </div>
              <div className="space-y-1 border-l border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produção</p>
                <p className="text-sm font-bold">{FIXED_PRODUCTION_COST} <span className="text-[10px] text-slate-500">MT</span></p>
              </div>
              <div className="space-y-1 border-l border-slate-800">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Custo Total</p>
                <p className="text-sm font-black text-amber-400">{totalCost.toFixed(2)} <span className="text-[10px]">MT</span></p>
              </div>
              <div className="space-y-1 border-l border-slate-800">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Lucro</p>
                <p className="text-sm font-black text-emerald-400">{(Number(dish.selling_price) - totalCost).toFixed(2)} <span className="text-[10px]">MT</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg font-bold text-slate-500 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg px-8 shadow-sm transition-all">
            {isSubmitting ? 'A guardar...' : 'Guardar Receita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
