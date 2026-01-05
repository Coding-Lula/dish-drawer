import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubRecipes, useIngredients } from '@/hooks/useSupabaseData';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SubRecipeModal } from '@/components/modals/SubRecipeModal';

function SubRecipesContent() {
  const { subRecipes, deleteSubRecipe, loading: recipesLoading } = useSubRecipes();
  const { ingredients, loading: ingredientsLoading } = useIngredients();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddNew = () => {
    setSelectedRecipe(null);
    setIsModalOpen(true);
  };

  const handleEdit = (recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const loading = recipesLoading || ingredientsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sub-Recipes</h1>
          <p className="text-muted-foreground">Manage your sub-recipes for processed ingredients.</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Add New Sub-Recipe
        </Button>
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
                <p className="text-sm text-muted-foreground">
                  Produces: {ingredients.find(i => i.id === recipe.processed_ingredient_id)?.name}
                </p>
                <ul>
                  {recipe.sub_recipe_items.map((item) => {
                    const ingredient = ingredients.find(i => i.id === item.raw_ingredient_id);
                    return (
                      <li key={item.id} className="text-sm">
                        {item.quantity_required} {ingredient?.unit} of {ingredient?.name}
                      </li>
                    );
                  })}
                </ul>
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
