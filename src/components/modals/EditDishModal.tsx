import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UtensilsCrossed } from 'lucide-react';
import type { Dish } from '@/hooks/useSupabaseData';

interface EditDishModalProps {
  dish: Dish;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, updates: Partial<Dish>) => Promise<any>;
}

export function EditDishModal({ dish, categories, open, onOpenChange, onSubmit }: EditDishModalProps) {
  const [name, setName] = useState(dish.name);
  const [category, setCategory] = useState(dish.category || '');
  const [sellingPrice, setSellingPrice] = useState(dish.selling_price.toString());
  const [costOfProduction, setCostOfProduction] = useState(dish.cost_of_production.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(dish.name);
    setCategory(dish.category || '');
    setSellingPrice(dish.selling_price.toString());
    setCostOfProduction(dish.cost_of_production.toString());
  }, [dish]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) return;

    setIsSubmitting(true);
    const result = await onSubmit(dish.id, {
      name,
      category,
      selling_price: parseFloat(sellingPrice),
      cost_of_production: costOfProduction === '' ? 20 : parseFloat(costOfProduction)
    });
    setIsSubmitting(false);

    if (result) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Editar Prato
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Prato</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="Pizzas">Pizzas</SelectItem>
                  <SelectItem value="Dishes">Pratos</SelectItem>
                  <SelectItem value="Starter">Entradas</SelectItem>
                  <SelectItem value="Dessert">Sobremesa</SelectItem>
                  <SelectItem value="Beverage">Bebidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda (MT)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder=""
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Custo de Produção (MT)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              value={costOfProduction}
              onChange={(e) => setCostOfProduction(e.target.value)}
              placeholder=""
            />
            <p className="text-xs text-muted-foreground">
              Custo virtual adicionado a cada prato (padrão: 20 MT)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !sellingPrice}>
              {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
