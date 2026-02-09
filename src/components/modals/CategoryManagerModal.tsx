import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CategoryManagerModalProps {
  allCategories: string[];
  enabledCategories: string[];
  onSetCategories: (categories: string[]) => Promise<boolean>;
}

export function CategoryManagerModal({
  allCategories,
  enabledCategories,
  onSetCategories
}: CategoryManagerModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If enabledCategories is empty, it means all are enabled by default
  const isCategoryEnabled = (category: string) => {
    if (enabledCategories.length === 0) return true;
    return enabledCategories.includes(category);
  };

  const handleToggle = async (category: string, checked: boolean) => {
    setIsLoading(true);

    let currentEnabled = enabledCategories.length === 0 ? [...allCategories] : [...enabledCategories];

    let newEnabled: string[];
    if (checked) {
      if (!currentEnabled.includes(category)) {
        newEnabled = [...currentEnabled, category];
      } else {
        newEnabled = currentEnabled;
      }
    } else {
      newEnabled = currentEnabled.filter(c => c !== category);
    }

    // If newEnabled contains all categories, we can optionally clear the table
    // to go back to "default all" state, or just save all.
    // For consistency, let's just save the selection.

    await onSetCategories(newEnabled);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9" title="Filtrar categorias da loja">
          <Filter className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Categorias Visíveis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione quais categorias de pratos devem aparecer no POS para esta loja.
          </p>

          <ScrollArea className="h-72 border rounded-lg p-4">
            <div className="space-y-4">
              {[...allCategories].sort().map(category => (
                <div key={category} className="flex items-center space-x-3">
                  <Checkbox
                    id={`cat-${category}`}
                    checked={isCategoryEnabled(category)}
                    onCheckedChange={(checked) => handleToggle(category, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`cat-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}

              {allCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma categoria encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Concluir</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
