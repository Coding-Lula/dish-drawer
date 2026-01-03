import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft } from 'lucide-react';
import type { Store, Ingredient, StoreStock } from '@/hooks/useSupabaseData';

interface TransferInventoryModalProps {
  stores: Store[];
  ingredients: Ingredient[];
  currentStoreId: string;
  stocks: StoreStock[];
  onTransfer: (fromStoreId: string, toStoreId: string, ingredientId: string, quantity: number, notes?: string) => Promise<any>;
}

export function TransferInventoryModal({ 
  stores, 
  ingredients, 
  currentStoreId, 
  stocks,
  onTransfer 
}: TransferInventoryModalProps) {
  const [open, setOpen] = useState(false);
  const [fromStoreId, setFromStoreId] = useState(currentStoreId);
  const [toStoreId, setToStoreId] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIngredient = ingredients.find(i => i.id === ingredientId);
  const availableStock = stocks.find(s => s.ingredient_id === ingredientId && s.store_id === fromStoreId);
  const otherStores = stores.filter(s => s.id !== fromStoreId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStoreId || !toStoreId || !ingredientId || !quantity) return;

    setIsSubmitting(true);
    const result = await onTransfer(fromStoreId, toStoreId, ingredientId, parseFloat(quantity), notes || undefined);
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
      setIngredientId('');
      setQuantity('');
      setNotes('');
      setToStoreId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Transferir Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Inventário Entre Lojas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loja de Origem</Label>
              <Select value={fromStoreId} onValueChange={setFromStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Loja de Destino</Label>
              <Select value={toStoreId} onValueChange={setToStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent>
                  {otherStores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ingrediente</Label>
            <Select value={ingredientId} onValueChange={setIngredientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar ingrediente" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map(ing => (
                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIngredient && availableStock && (
              <p className="text-xs text-muted-foreground">
                Disponível: {availableStock.current_quantity} {selectedIngredient.unit}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max={availableStock?.current_quantity || 999999}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
              {selectedIngredient && (
                <span className="text-muted-foreground whitespace-nowrap">{selectedIngredient.unit}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da transferência..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !toStoreId || !ingredientId || !quantity}>
              {isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
