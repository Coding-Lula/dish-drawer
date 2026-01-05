import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubRecipes, Ingredient } from '@/hooks/useSupabaseData';
import { PlusCircle, Trash2 } from 'lucide-react';

export function SubRecipeModal({ isOpen, onClose, recipe, ingredients }) {
  const { saveSubRecipe } = useSubRecipes();
  const [name, setName] = useState('');
  const [processedIngredientId, setProcessedIngredientId] = useState('');
  const [items, setItems] = useState([{ raw_ingredient_id: '', quantity_required: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processedIngredients = ingredients.filter(i => i.is_processed);
  const rawIngredients = ingredients.filter(i => !i.is_processed);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setProcessedIngredientId(recipe.processed_ingredient_id);
      setItems(recipe.sub_recipe_items.map(item => ({
        raw_ingredient_id: item.raw_ingredient_id,
        quantity_required: item.quantity_required,
      })));
    } else {
      setName('');
      setProcessedIngredientId('');
      setItems([{ raw_ingredient_id: '', quantity_required: 1 }]);
    }
  }, [recipe, isOpen]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { raw_ingredient_id: '', quantity_required: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const recipeData = {
      id: recipe?.id,
      name,
      processed_ingredient_id: processedIngredientId,
    };

    await saveSubRecipe(recipeData, items);

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Edit' : 'Create'} Sub-Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Sub-Recipe Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Produced Ingredient</Label>
            <Select value={processedIngredientId} onValueChange={setProcessedIngredientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an ingredient" />
              </SelectTrigger>
              <SelectContent>
                {processedIngredients.map(ing => (
                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Raw Materials</Label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.raw_ingredient_id}
                    onValueChange={(value) => handleItemChange(index, 'raw_ingredient_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawIngredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={item.quantity_required}
                    onChange={(e) => handleItemChange(index, 'quantity_required', parseFloat(e.target.value))}
                    className="w-28"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 gap-1">
              <PlusCircle className="w-3 h-3" />
              Add Material
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
