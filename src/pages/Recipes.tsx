import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dishes, recipes, ingredients } from '@/data/mockData';
import { UtensilsCrossed, Package } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Recipes() {
  const [selectedDish, setSelectedDish] = useState<string | null>(dishes[0]?.id || null);

  const selectedDishData = dishes.find(d => d.id === selectedDish);
  const dishRecipes = recipes.filter(r => r.dishId === selectedDish);
  
  const recipeDetails = dishRecipes.map(recipe => {
    const ingredient = ingredients.find(i => i.id === recipe.ingredientId);
    const costPerUnit = ingredient?.averageCost || 0;
    const totalCost = costPerUnit * recipe.quantityRequired;
    return {
      ...recipe,
      ingredient,
      totalCost,
    };
  });

  const totalIngredientCost = recipeDetails.reduce((sum, r) => sum + r.totalCost, 0);
  const profitMargin = selectedDishData 
    ? ((selectedDishData.sellingPrice - totalIngredientCost) / selectedDishData.sellingPrice * 100).toFixed(1)
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Technical Sheets</h1>
          <p className="text-muted-foreground">Recipe & Ingredient Mapping</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Dish List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Menu Items</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {dishes.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => setSelectedDish(dish.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all",
                      selectedDish === dish.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className={cn(
                          "text-sm",
                          selectedDish === dish.id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {dish.category}
                        </p>
                      </div>
                      <span className="font-semibold">{dish.sellingPrice} MT</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Details */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <UtensilsCrossed className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{selectedDishData?.name || 'Select a dish'}</CardTitle>
                    {selectedDishData && (
                      <p className="text-sm text-muted-foreground">
                        {selectedDishData.category} • {dishRecipes.length} ingredients
                      </p>
                    )}
                  </div>
                </div>
                {selectedDishData && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{selectedDishData.sellingPrice} MT</p>
                    <Badge variant="secondary" className="mt-1">
                      {profitMargin}% margin
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {!selectedDish ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select a dish to view its recipe</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ingredients List */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Ingredients Required
                    </h3>
                    <div className="space-y-2">
                      {recipeDetails.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-accent">
                              <Package className="w-4 h-4 text-accent-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.ingredient?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.ingredient?.category} • {item.ingredient?.averageCost} MT/{item.ingredient?.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {item.quantityRequired} {item.ingredient?.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cost: {item.totalCost.toFixed(2)} MT
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent border border-primary/20">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Cost Analysis
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Ingredient Cost</p>
                        <p className="text-xl font-bold text-foreground">{totalIngredientCost.toFixed(2)} MT</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Selling Price</p>
                        <p className="text-xl font-bold text-foreground">{selectedDishData?.sellingPrice} MT</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gross Profit</p>
                        <p className="text-xl font-bold text-primary">
                          {((selectedDishData?.sellingPrice || 0) - totalIngredientCost).toFixed(2)} MT
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
