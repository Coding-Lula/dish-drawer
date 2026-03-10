import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDishes, useRecipes, useIngredients } from '@/hooks/useSupabaseData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddDishModal } from '@/components/modals/AddDishModal';
import { EditDishModal } from '@/components/modals/EditDishModal';
import { CreateRecipeModal } from '@/components/modals/CreateRecipeModal';
import { UtensilsCrossed, Package, Cog, ChevronDown, Pencil, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RecipesContent() {
  const { toast } = useToast();
  const { dishes, addDish, updateDish, deleteDish } = useDishes();
  const { recipes, refetch: refetchRecipes } = useRecipes();
  const { ingredients } = useIngredients();
  const [selectedDish, setSelectedDish] = useState<string | null>(dishes[0]?.id || null);

  const [isEditDishOpen, setIsEditDishOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  const categories = [...new Set(dishes.map(d => d.category).filter(Boolean))];
  const selectedDishData = dishes.find(d => d.id === selectedDish);
  const dishRecipes = recipes.filter(r => r.dish_id === selectedDish);
  
  const recipeDetails = dishRecipes.map(recipe => {
    const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
    const costPerUnit = Number(ingredient?.average_cost) || 0;
    const totalCost = costPerUnit * Number(recipe.quantity_required);
    return { ...recipe, ingredient, totalCost };
  });

  const FIXED_PRODUCTION_COST = selectedDishData?.cost_of_production ?? 20;
  const totalIngredientCost = recipeDetails.reduce((sum, r) => sum + r.totalCost, 0) + FIXED_PRODUCTION_COST;
  const profitMargin = selectedDishData 
    ? ((Number(selectedDishData.selling_price) - totalIngredientCost) / Number(selectedDishData.selling_price) * 100).toFixed(1)
    : 0;

  const handleSaveRecipe = async (dishId: string, recipeItems: { ingredient_id: string; quantity_required: number }[]) => {
    // Delete existing recipes for this dish
    await supabase.from('recipes').delete().eq('dish_id', dishId);
    
    // Insert new recipes
    if (recipeItems.length > 0) {
      const { error } = await supabase.from('recipes').insert(
        recipeItems.map(item => ({
          dish_id: dishId,
          ingredient_id: item.ingredient_id,
          quantity_required: item.quantity_required
        }))
      );
      
      if (error) {
        toast({ title: 'Error saving recipe', description: error.message, variant: 'destructive' });
        return;
      }
    }
    
    refetchRecipes();
    toast({ title: 'Receita guardada com sucesso' });
  };

  const handleDeleteDish = async () => {
    if (!selectedDish) return;
    const success = await deleteDish(selectedDish);
    if (success) {
      setSelectedDish(dishes[0]?.id || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ficha Técnica</h1>
          <p className="text-muted-foreground">Mapeamento de Receitas e Ingredientes</p>
        </div>
        <AddDishModal categories={categories as string[]} onSubmit={addDish} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 flex flex-col max-h-[calc(100vh-200px)]">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Items do Menu</CardTitle></CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 pr-2">
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
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/20"><UtensilsCrossed className="w-6 h-6 text-primary" /></div>
                <div>
                  <CardTitle>{selectedDishData?.name || 'Selecione um prato'}</CardTitle>
                  {selectedDishData && <p className="text-sm text-muted-foreground">{selectedDishData.category} • {dishRecipes.length} ingredientes</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedDishData && (
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      className="rounded-r-none border-r-0"
                      onClick={() => setIsRecipeModalOpen(true)}
                    >
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-l-none px-2">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsRecipeModalOpen(true)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Editar Receita
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditDishOpen(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Prato
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Prato
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                {selectedDishData && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">{Number(selectedDishData.selling_price).toLocaleString()} MT</p>
                    <Badge variant="secondary" className="mt-1">{profitMargin}% margem</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {!selectedDish ? (
              <div className="text-center py-12 text-muted-foreground"><UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Selecione um prato para ver a sua receita</p></div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ingredientes Necessários</h3>
                  <div className="space-y-2">
                    {recipeDetails.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum ingrediente configurado. Clique em "Editar" para adicionar ingredientes.</p>
                      </div>
                    ) : (
                      <>
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
                              <p className="text-xs text-muted-foreground">Custo: {item.totalCost.toFixed(2)} MT</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {/* Virtual Cost of Production */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-amber-500/20"><Cog className="w-4 h-4 text-amber-600" /></div>
                        <div>
                          <p className="font-medium text-amber-700">Custo de Produção</p>
                          <p className="text-xs text-amber-600">Custo fixo (gás, eletricidade, mão-de-obra)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-700">{FIXED_PRODUCTION_COST.toFixed(2)} MT</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent border border-primary/20">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Análise de Custos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Custo Total</p>
                      <p className="text-xl font-bold">{totalIngredientCost.toFixed(2)} MT</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Preço de Venda</p>
                      <p className="text-xl font-bold">{Number(selectedDishData?.selling_price).toLocaleString()} MT</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Bruto</p>
                      <p className="text-xl font-bold text-primary">{((Number(selectedDishData?.selling_price) || 0) - totalIngredientCost).toFixed(2)} MT</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedDishData && (
        <>
          <EditDishModal
            dish={selectedDishData}
            categories={categories as string[]}
            open={isEditDishOpen}
            onOpenChange={setIsEditDishOpen}
            onSubmit={updateDish}
          />

          <CreateRecipeModal
            dish={selectedDishData}
            ingredients={ingredients}
            existingRecipes={dishRecipes.map(r => ({ ingredient_id: r.ingredient_id, quantity_required: Number(r.quantity_required) }))}
            onSave={(items) => handleSaveRecipe(selectedDishData.id, items)}
            open={isRecipeModalOpen}
            onOpenChange={setIsRecipeModalOpen}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isto irá eliminar permanentemente o prato
                  "{selectedDishData.name}" e todas as suas receitas associadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDish} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
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
