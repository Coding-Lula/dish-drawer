import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubRecipes, useIngredients, useStoreStock } from '@/hooks/useSupabaseData';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SubRecipeModal } from '@/components/modals/SubRecipeModal';
import { ProcessBatchModal } from '@/components/modals/ProcessBatchModal';

function SubRecipesContent() {
  const { currentStore } = useCurrentStore();
  const { subRecipes, deleteSubRecipe, loading: recipesLoading } = useSubRecipes();
  const { ingredients, loading: ingredientsLoading } = useIngredients();
  const { stocks } = useStoreStock(currentStore?.id || null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddNew = () => {
    setSelectedRecipe({
      name: '',
      outputs: [],
      sub_recipe_items: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleProcessBatch = async (subRecipeId: string, quantity: number) => {
    // This is handled by the ProcessBatchModal's onProcess callback
    // The actual logic is in the Inventory page
    return null;
  };

  const loading = recipesLoading || ingredientsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sub-Recipes</h1>
          <p className="text-muted-foreground">Manage your sub-recipes for processed ingredients.</p>
        </div>
        <div className="flex gap-2">
          <ProcessBatchModal
            ingredients={ingredients}
            subRecipes={subRecipes.map(r => ({
              id: r.id,
              name: r.name,
              outputs: r.outputs.map(o => ({
                processed_ingredient_id: o.processed_ingredient_id,
                quantity_produced: o.quantity_produced
              })),
              items: r.sub_recipe_items.map(item => ({
                raw_ingredient_id: item.raw_ingredient_id,
                quantity_required: item.quantity_required
              }))
            }))}
            stocks={stocks}
            onProcess={handleProcessBatch}
          />
          <Button onClick={handleAddNew} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Add New Sub-Recipe
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subRecipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {recipe.name}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(recipe)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSubRecipe(recipe.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Produces:</span>
                  <ul className="mt-1 space-y-1">
                    {recipe.outputs.map((output) => {
                      const ing = ingredients.find(i => i.id === output.processed_ingredient_id);
                      return (
                        <li key={output.id}>• {output.quantity_produced} {ing?.unit} of {ing?.name}</li>
                      );
                    })}
                  </ul>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Requires:</span>
                  <ul className="mt-1 space-y-1">
                    {recipe.sub_recipe_items.map((item) => {
                      const ingredient = ingredients.find(i => i.id === item.raw_ingredient_id);
                      return (
                        <li key={item.id} className="text-muted-foreground">
                          • {item.quantity_required} {ingredient?.unit} of {ingredient?.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SubRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={selectedRecipe}
        ingredients={ingredients}
      />
    </div>
  );
}

export default function SubRecipes() {
  return (
    <MainLayout>
      <SubRecipesContent />
    </MainLayout>
  );
}
