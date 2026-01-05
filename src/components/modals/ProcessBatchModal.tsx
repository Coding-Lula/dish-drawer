import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Factory, Package, AlertTriangle } from 'lucide-react';
import type { Ingredient, IngredientRecipe, StoreStock } from '@/hooks/useSupabaseData';

interface ProcessBatchModalProps {
  ingredients: Ingredient[];
  ingredientRecipes: IngredientRecipe[];
  stocks: StoreStock[];
  onProcess: (processedIngredientId: string, quantity: number) => Promise<any>;
}

export function ProcessBatchModal({ 
  ingredients, 
  ingredientRecipes,
  stocks,
  onProcess 
}: ProcessBatchModalProps) {
  const [open, setOpen] = useState(false);
  const [processedIngredientId, setProcessedIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get processed ingredients (those marked as is_processed)
  const processedIngredients = ingredients.filter(i => i.is_processed);
  const selectedProcessed = ingredients.find(i => i.id === processedIngredientId);
  
  // Get sub-recipe for selected processed ingredient
  const subRecipe = ingredientRecipes.filter(r => r.processed_ingredient_id === processedIngredientId);
  
  // Calculate required raw materials and check availability
  const rawMaterialsNeeded = subRecipe.map(recipe => {
    const rawIngredient = ingredients.find(i => i.id === recipe.raw_ingredient_id);
    const stock = stocks.find(s => s.ingredient_id === recipe.raw_ingredient_id);
    const requiredQty = recipe.quantity_required * (parseFloat(quantity) || 0);
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

  const allMaterialsSufficient = rawMaterialsNeeded.every(m => m.sufficient);
  const totalCost = rawMaterialsNeeded.reduce((sum, m) => sum + m.cost, 0);
  const unitCost = parseFloat(quantity) > 0 ? totalCost / parseFloat(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processedIngredientId || !quantity) return;

    setIsSubmitting(true);
    const result = await onProcess(processedIngredientId, parseFloat(quantity));
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      setProcessedIngredientId('');
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
        
        {processedIngredients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum ingrediente processado configurado.</p>
            <p className="text-sm mt-2">Primeiro, marque ingredientes como "Processado" e defina suas sub-receitas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ingrediente a Produzir</Label>
              <Select value={processedIngredientId} onValueChange={setProcessedIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar ingrediente processado" />
                </SelectTrigger>
                <SelectContent>
                  {processedIngredients.map(ing => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name}
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

            {processedIngredientId && subRecipe.length > 0 && (
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

            {processedIngredientId && subRecipe.length === 0 && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-amber-700 font-medium">Sub-receita não configurada</p>
                <p className="text-sm text-amber-600">Defina a sub-receita na página de Fichas Técnicas.</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !allMaterialsSufficient || subRecipe.length === 0 || !quantity}
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
