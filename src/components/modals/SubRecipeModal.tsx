import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubRecipes, Ingredient } from '@/hooks/useSupabaseData';
import { PlusCircle, Trash2 } from 'lucide-react';

interface SubRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: any;
  ingredients: Ingredient[];
}

export function SubRecipeModal({ isOpen, onClose, recipe, ingredients }: SubRecipeModalProps) {
  const { saveSubRecipe } = useSubRecipes();
  const [name, setName] = useState('');
  const [outputs, setOutputs] = useState<{ processed_ingredient_id: string; quantity_produced: number }[]>([
    { processed_ingredient_id: '', quantity_produced: 1 }
  ]);
  const [items, setItems] = useState([{ raw_ingredient_id: '', quantity_required: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processedIngredients = ingredients.filter(i => i.is_processed);
  const rawIngredients = ingredients.filter(i => !i.is_processed);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name || '');
      setOutputs(recipe.outputs?.length > 0 
        ? recipe.outputs.map((o: any) => ({
            processed_ingredient_id: o.processed_ingredient_id,
            quantity_produced: o.quantity_produced,
          }))
        : [{ processed_ingredient_id: '', quantity_produced: 1 }]
      );
      setItems(recipe.sub_recipe_items?.length > 0 
        ? recipe.sub_recipe_items.map((item: any) => ({
            raw_ingredient_id: item.raw_ingredient_id,
            quantity_required: item.quantity_required,
          }))
        : [{ raw_ingredient_id: '', quantity_required: 1 }]
      );
    } else {
      setName('');
      setOutputs([{ processed_ingredient_id: '', quantity_produced: 1 }]);
      setItems([{ raw_ingredient_id: '', quantity_required: 1 }]);
    }
  }, [recipe, isOpen]);

  const handleOutputChange = (index: number, field: string, value: any) => {
    const newOutputs = [...outputs];
    (newOutputs[index] as any)[field] = value;
    setOutputs(newOutputs);
  };

  const addOutput = () => {
    setOutputs([...outputs, { processed_ingredient_id: '', quantity_produced: 1 }]);
  };

  const removeOutput = (index: number) => {
    const newOutputs = outputs.filter((_, i) => i !== index);
    setOutputs(newOutputs);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { raw_ingredient_id: '', quantity_required: 1 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const recipeData = {
      id: recipe?.id,
      name,
    };

    const validOutputs = outputs.filter(o => o.processed_ingredient_id);
    const validItems = items.filter(i => i.raw_ingredient_id);

    await saveSubRecipe(recipeData, validOutputs, validItems);

    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe?.id ? 'Edit' : 'Create'} Sub-Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Sub-Recipe Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* Outputs Section */}
          <div className="space-y-2">
            <Label>Produced Items</Label>
            <p className="text-sm text-muted-foreground">What this recipe produces (can produce multiple items)</p>
            <div className="space-y-2">
              {outputs.map((output, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                  <Select
                    value={output.processed_ingredient_id}
                    onValueChange={(value) => handleOutputChange(index, 'processed_ingredient_id', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select processed ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {processedIngredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={output.quantity_produced}
                    onChange={(e) => handleOutputChange(index, 'quantity_produced', parseFloat(e.target.value) || 1)}
                    className="w-24"
                    step="0.01"
                    min="0.01"
                    placeholder="Qty"
                  />
                  {outputs.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOutput(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addOutput} className="gap-1">
              <PlusCircle className="w-3 h-3" />
              Add Output
            </Button>
          </div>

          {/* Raw Materials Section */}
          <div className="space-y-2">
            <Label>Raw Materials Required</Label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.raw_ingredient_id}
                    onValueChange={(value) => handleItemChange(index, 'raw_ingredient_id', value)}
                  >
                    <SelectTrigger className="flex-1">
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
                    onChange={(e) => handleItemChange(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                    className="w-28"
                    step="0.01"
                    min="0.01"
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