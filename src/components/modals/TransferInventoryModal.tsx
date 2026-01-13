import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, PlusCircle, Trash2 } from 'lucide-react';
import type { Store, Ingredient, StoreStock } from '@/hooks/useSupabaseData';

interface TransferInventoryModalProps {
  stores: Store[];
  ingredients: Ingredient[];
  currentStoreId: string;
  stocks: StoreStock[];
  onTransfer: (fromStoreId: string, toStoreId: string, items: { ingredientId: string; quantity: number }[], notes?: string) => Promise<any>;
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
  const [items, setItems] = useState([{ ingredientId: '', quantity: '' }]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('TransferInventoryModal - currentStoreId:', currentStoreId);

  useEffect(() => {
    if (open) {
       console.log('Modal opened - currentStoreId:', currentStoreId, 'fromStoreId:', fromStoreId);
      setFromStoreId(currentStoreId);
      setToStoreId('');
      setItems([{ ingredientId: '', quantity: '' }]);
      setNotes('');
    }
  }, [open, currentStoreId]);

  const otherStores = stores.filter(s => s.id !== fromStoreId);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ingredientId: '', quantity: '' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => item.ingredientId && item.quantity)
      .map(item => ({
        ingredientId: item.ingredientId,
        quantity: parseFloat(item.quantity)
      }));

    if (!fromStoreId || !toStoreId || validItems.length === 0) return;
    //Delete
      console.log('TRANSFER DATA:', {
      fromStoreId,
      toStoreId,
      items: validItems,
      notes,
      currentStoreId // Also log the prop for comparison
    });
    //Stop delete
    setIsSubmitting(true);
    const result = await onTransfer(fromStoreId, toStoreId, validItems, notes);
    setIsSubmitting(false);

    if (result) {
      setOpen(false);
    }
  };

  const isFormValid = fromStoreId && toStoreId && items.every(item => item.ingredientId && item.quantity);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Transferir Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
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

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <Label>Itens a Transferir</Label>
            {items.map((item, index) => {
              const selectedIngredient = ingredients.find(i => i.id === item.ingredientId);
              const availableStock = stocks.find(s => s.ingredient_id === item.ingredientId && s.store_id === fromStoreId);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <Select value={item.ingredientId} onValueChange={(value) => handleItemChange(index, 'ingredientId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max={availableStock?.current_quantity || 999999}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder={`Quantidade (${selectedIngredient?.unit || 'un'})`}
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {availableStock && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Disp: {availableStock.current_quantity}
                      </span>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <PlusCircle className="w-3 h-3" />
            Adicionar Item
          </Button>

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
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
