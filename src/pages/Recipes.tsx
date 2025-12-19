import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDishes, useRecipes, useIngredients } from '@/hooks/useSupabaseData';
import { AddDishModal } from '@/components/modals/AddDishModal';
import { UtensilsCrossed, Package, Cog } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function RecipesContent() {
  const { dishes, addDish } = useDishes();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();
  const [selectedDish, setSelectedDish] = useState<string | null>(dishes[0]?.id || null);

  const categories = [...new Set(dishes.map(d => d.category).filter(Boolean))];
  const selectedDishData = dishes.find(d => d.id === selectedDish);
  const dishRecipes = recipes.filter(r => r.dish_id === selectedDish);
  
  const recipeDetails = dishRecipes.map(recipe => {
    const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
    const costPerUnit = Number(ingredient?.average_cost) || 0;
    const totalCost = costPerUnit * Number(recipe.quantity_required);
    return { ...recipe, ingredient, totalCost };
  });

  const costOfProduction = Number(selectedDishData?.cost_of_production) || 20;
  const totalIngredientCost = recipeDetails.reduce((sum, r) => sum + r.totalCost, 0) + costOfProduction;
  const profitMargin = selectedDishData 
    ? ((Number(selectedDishData.selling_price) - totalIngredientCost) / Number(selectedDishData.selling_price) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Technical Sheets</h1>
          <p className="text-muted-foreground">Recipe & Ingredient Mapping</p>
        </div>
        <AddDishModal categories={categories as string[]} onSubmit={addDish} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Menu Items</CardTitle></CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {dishes.map(dish => (
                <button key={dish.id} onClick={() => setSelectedDish(dish.id)} className={cn("w-full text-left p-3 rounded-lg transition-all", selectedDish === dish.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dish.name}</p>
                      <p className={cn("text-sm", selectedDish === dish.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{dish.category}</p>
                    </div>
                    <span className="font-semibold">{Number(dish.selling_price).toLocaleString()} MT</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/20"><UtensilsCrossed className="w-6 h-6 text-primary" /></div>
                <div>
                  <CardTitle>{selectedDishData?.name || 'Select a dish'}</CardTitle>
                  {selectedDishData && <p className="text-sm text-muted-foreground">{selectedDishData.category} • {dishRecipes.length} ingredients</p>}
                </div>
              </div>
              {selectedDishData && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{Number(selectedDishData.selling_price).toLocaleString()} MT</p>
                  <Badge variant="secondary" className="mt-1">{profitMargin}% margin</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {!selectedDish ? (
              <div className="text-center py-12 text-muted-foreground"><UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Select a dish to view its recipe</p></div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ingredients Required</h3>
                  <div className="space-y-2">
                    {recipeDetails.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-accent"><Package className="w-4 h-4 text-accent-foreground" /></div>
                          <div>
                            <p className="font-medium">{item.ingredient?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.ingredient?.category} • {Number(item.ingredient?.average_cost).toFixed(2)} MT/{item.ingredient?.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.quantity_required} {item.ingredient?.unit}</p>
                          <p className="text-xs text-muted-foreground">Cost: {item.totalCost.toFixed(2)} MT</p>
                        </div>
                      </div>
                    ))}
                    {/* Virtual Cost of Production */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-amber-500/20"><Cog className="w-4 h-4 text-amber-600" /></div>
                        <div>
                          <p className="font-medium text-amber-700">Cost of Production</p>
                          <p className="text-xs text-amber-600">Virtual ingredient (no inventory)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-700">{costOfProduction.toFixed(2)} MT</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent border border-primary/20">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-xl font-bold">{totalIngredientCost.toFixed(2)} MT</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Selling Price</p>
                      <p className="text-xl font-bold">{Number(selectedDishData?.selling_price).toLocaleString()} MT</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gross Profit</p>
                      <p className="text-xl font-bold text-primary">{((Number(selectedDishData?.selling_price) || 0) - totalIngredientCost).toFixed(2)} MT</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Recipes() {
  return (
    <MainLayout>
      <RecipesContent />
    </MainLayout>
  );
}
