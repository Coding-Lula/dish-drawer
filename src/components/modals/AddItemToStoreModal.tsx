import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Check } from 'lucide-react';
import { Ingredient } from '@/hooks/useSupabaseData';

interface AddItemToStoreModalProps {
  ingredients: Ingredient[];
  existingIngredientIds: string[];
  onAddItem: (ingredientId: string) => Promise<any>;
}

export function AddItemToStoreModal({ ingredients, existingIngredientIds, onAddItem }: AddItemToStoreModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  // Filter to show only items NOT already in store
  const availableItems = ingredients.filter(
    ing => !existingIngredientIds.includes(ing.id) &&
           ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (ingredientId: string) => {
    setAdding(ingredientId);
    await onAddItem(ingredientId);
    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Item à Loja
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Item ao Inventário da Loja</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar ingredientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {availableItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? 'Nenhum item encontrado' : 'Todos os itens já estão na loja'}
            </p>
          ) : (
            <div className="space-y-2">
              {availableItems.map(ingredient => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{ingredient.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{ingredient.category}</Badge>
                      <span className="text-xs text-muted-foreground">{ingredient.unit}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(ingredient.id)}
                    disabled={adding === ingredient.id}
                  >
                    {adding === ingredient.id ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
