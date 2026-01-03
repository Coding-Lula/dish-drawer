import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cog, Package, Trash2 } from 'lucide-react';
import type { Ingredient, IngredientRecipe } from '@/hooks/useSupabaseData';

interface SelectedRawMaterial {
  raw_ingredient_id: string;
  quantity_required: number;
}

interface IngredientRecipeModalProps {
  ingredient: Ingredient;
  allIngredients: Ingredient[];
  existingRecipes: IngredientRecipe[];
  onSave: (rawMaterials: SelectedRawMaterial[]) => Promise<boolean>;
}

export function IngredientRecipeModal({ 
  ingredient, 
  allIngredients, 
  existingRecipes,
  onSave 
}: IngredientRecipeModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedRawMaterial[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Raw materials are ingredients that are NOT processed
  const rawMaterials = allIngredients.filter(i => !i.is_processed && i.id !== ingredient.id);

  // Get existing sub-recipe for this processed ingredient
  const currentRecipes = existingRecipes.filter(r => r.processed_ingredient_id === ingredient.id);

  useEffect(() => {
    if (open) {
      setSelectedMaterials(
        currentRecipes.map(r => ({
          raw_ingredient_id: r.raw_ingredient_id,
          quantity_required: r.quantity_required
        }))
      );
    }
  }, [open]);

  const toggleMaterial = (ingredientId: string) => {
    const exists = selectedMaterials.find(m => m.raw_ingredient_id === ingredientId);
    if (exists) {
      setSelectedMaterials(prev => prev.filter(m => m.raw_ingredient_id !== ingredientId));
    } else {
      setSelectedMaterials(prev => [...prev, { raw_ingredient_id: ingredientId, quantity_required: 1 }]);
    }
  };

  const updateQuantity = (ingredientId: string, quantity: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => m.raw_ingredient_id === ingredientId ? { ...m, quantity_required: quantity } : m)
    );
  };

  const removeMaterial = (ingredientId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.raw_ingredient_id !== ingredientId));
  };

  // Calculate production cost
  const totalCost = selectedMaterials.reduce((sum, m) => {
    const ing = allIngredients.find(i => i.id === m.raw_ingredient_id);
    return sum + (m.quantity_required * (ing?.average_cost || 0));
  }, 0);

  const handleSave = async () => {
    setIsSubmitting(true);
    const success = await onSave(selectedMaterials);
    setIsSubmitting(false);
    if (success) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Cog className="w-3 h-3" />
          Sub-Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Sub-Receita: {ingredient.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Defina quais matérias-primas são usadas para produzir este ingrediente
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Available Raw Materials */}
          <div>
            <h4 className="font-semibold mb-2">Matérias-Primas Disponíveis</h4>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              <div className="space-y-1">
                {rawMaterials.map(rm => {
                  const isSelected = selectedMaterials.some(m => m.raw_ingredient_id === rm.id);
                  return (
                    <button
                      key={rm.id}
                      onClick={() => toggleMaterial(rm.id)}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-colors ${
                        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{rm.name}</p>
                        <p className="text-xs text-muted-foreground">{rm.category} • {rm.average_cost.toFixed(2)} MT/{rm.unit}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Materials with Quantities */}
          <div>
            <h4 className="font-semibold mb-2">Composição (por 1 {ingredient.unit})</h4>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {selectedMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Selecione as matérias-primas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMaterials.map(m => {
                    const ing = allIngredients.find(i => i.id === m.raw_ingredient_id);
                    if (!ing) return null;
                    const cost = m.quantity_required * ing.average_cost;
                    return (
                      <div key={m.raw_ingredient_id} className="p-2 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{ing.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeMaterial(m.raw_ingredient_id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={m.quantity_required}
                            onChange={(e) => updateQuantity(m.raw_ingredient_id, parseFloat(e.target.value) || 0)}
                            className="h-8 w-20"
                          />
                          <span className="text-sm text-muted-foreground">{ing.unit}</span>
                          <span className="text-sm ml-auto">{cost.toFixed(2)} MT</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            {/* Cost Summary */}
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-medium">Custo de Produção:</span>
                <Badge variant="secondary" className="text-lg px-3">
                  {totalCost.toFixed(2)} MT / {ingredient.unit}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Sub-Receita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
