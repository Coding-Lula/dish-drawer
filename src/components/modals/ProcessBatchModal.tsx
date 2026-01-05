import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Factory, Package, AlertTriangle } from 'lucide-react';
import type { Ingredient, SubRecipe, StoreStock } from '@/hooks/useSupabaseData';

interface ProcessBatchModalProps {
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
  stocks: StoreStock[];
  onProcess: (subRecipeId: string, quantity: number) => Promise<any>;
}

export function ProcessBatchModal({ 
  ingredients, 
  subRecipes,
  stocks,
  onProcess 
}: ProcessBatchModalProps) {
  const [open, setOpen] = useState(false);
  const [subRecipeId, setSubRecipeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSubRecipe = useMemo(() => {
    return subRecipes.find(r => r.id === subRecipeId);
  }, [subRecipeId, subRecipes]);

  const selectedProcessed = useMemo(() => {
    if (!selectedSubRecipe) return null;
    return ingredients.find(i => i.id === selectedSubRecipe.processed_ingredient_id);
  }, [selectedSubRecipe, ingredients]);

  const rawMaterialsNeeded = useMemo(() => {
    if (!selectedSubRecipe) return [];
    return selectedSubRecipe.sub_recipe_items.map(item => {
      const rawIngredient = ingredients.find(i => i.id === item.raw_ingredient_id);
      const stock = stocks.find(s => s.ingredient_id === item.raw_ingredient_id);
      const requiredQty = item.quantity_required * (parseFloat(quantity) || 0);
      const available = stock?.current_quantity || 0;
      const sufficient = available >= requiredQty;
      const costPerUnit = rawIngredient?.average_cost || 0;

      return {
        ingredient: rawIngredient,
        requiredQty,
        available,
        sufficient,
        cost: requiredQty * costPerUnit
      };
    });
  }, [selectedSubRecipe, quantity, ingredients, stocks]);

  const allMaterialsSufficient = rawMaterialsNeeded.every(m => m.sufficient);
  const totalCost = rawMaterialsNeeded.reduce((sum, m) => sum + m.cost, 0);
  const unitCost = parseFloat(quantity) > 0 ? totalCost / parseFloat(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subRecipeId || !quantity) return;

    setIsSubmitting(true);
    const result = await onProcess(subRecipeId, parseFloat(quantity));
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      setSubRecipeId('');
      setQuantity('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Factory className="w-4 h-4" />
          Processar Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Processar Lote de Produção</DialogTitle>
        </DialogHeader>
        
        {subRecipes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma sub-receita configurada.</p>
            <p className="text-sm mt-2">Crie sub-receitas na página de Sub-Recipes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Sub-Receita a Produzir</Label>
              <Select value={subRecipeId} onValueChange={setSubRecipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar sub-receita" />
                </SelectTrigger>
                <SelectContent>
                  {subRecipes.map(recipe => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade a Produzir</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
                {selectedProcessed && (
                  <span className="text-muted-foreground whitespace-nowrap">{selectedProcessed.unit}</span>
                )}
              </div>
            </div>

            {subRecipeId && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                <h4 className="font-semibold text-sm">Matérias-Primas Necessárias</h4>
                <div className="space-y-2">
                  {rawMaterialsNeeded.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{material.ingredient?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={material.sufficient ? 'text-foreground' : 'text-destructive'}>
                          {material.requiredQty.toFixed(1)} / {material.available.toFixed(1)} {material.ingredient?.unit}
                        </span>
                        {!material.sufficient && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Insuficiente
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo Total:</span>
                    <span className="font-semibold">{totalCost.toFixed(2)} MT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo Unitário:</span>
                    <span className="font-semibold">{unitCost.toFixed(2)} MT/{selectedProcessed?.unit}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !allMaterialsSufficient || !quantity}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Produção'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
