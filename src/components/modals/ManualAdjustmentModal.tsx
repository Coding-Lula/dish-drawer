import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Edit2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ingredient, StoreStock } from '@/hooks/useSupabaseData';

interface ManualAdjustmentModalProps {
  ingredients: Ingredient[];
  stocks: StoreStock[];
  onAdjust: (stockId: string, newQuantity: number) => Promise<boolean>;
}

export function ManualAdjustmentModal({ ingredients, stocks, onAdjust }: ManualAdjustmentModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Map stocks with ingredient info
  const stockItems = stocks.map(stock => {
    const ingredient = ingredients.find(i => i.id === stock.ingredient_id);
    return ingredient ? { ...stock, ingredient } : null;
  }).filter(Boolean) as (StoreStock & { ingredient: Ingredient })[];

  const selectedStock = stockItems.find(s => s.id === selectedStockId);
  const quantityNum = parseFloat(newQuantity);
  const isValid = selectedStockId && !isNaN(quantityNum) && quantityNum >= 0;

  const handleSubmitClick = () => {
    if (!isValid) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    const success = await onAdjust(selectedStockId, quantityNum);
    setSubmitting(false);
    setConfirmOpen(false);
    
    if (success) {
      setOpen(false);
      setSelectedStockId('');
      setNewQuantity('');
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedStockId('');
    setNewQuantity('');
  };

  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    const stock = stockItems.find(s => s.id === stockId);
    if (stock) {
      setNewQuantity(stock.current_quantity.toString());
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Ajuste Manual
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Stock</DialogTitle>
            <DialogDescription>
              Corrigir manualmente a quantidade de stock de um item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Item</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedStockId
                      ? stockItems.find(item => item.id === selectedStockId)?.ingredient.name
                      : "Pesquisar item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar item..." />
                    <CommandList>
                      <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                      <CommandGroup>
                        {stockItems.map(item => (
                          <CommandItem
                            key={item.id}
                            value={item.ingredient.name}
                            onSelect={() => {
                              handleStockSelect(item.id);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStockId === item.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.ingredient.name} (atual: {item.current_quantity} {item.ingredient.unit})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Nova Quantidade</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Digite a nova quantidade"
              />
              {quantityNum < 0 && (
                <p className="text-xs text-destructive">
                  A quantidade não pode ser negativa
                </p>
              )}
            </div>

            {selectedStock && !isNaN(quantityNum) && quantityNum >= 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm">
                  <span className="font-medium">{selectedStock.ingredient.name}</span>: {selectedStock.current_quantity} → {quantityNum} {selectedStock.ingredient.unit}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Diferença: {quantityNum - selectedStock.current_quantity > 0 ? '+' : ''}{(quantityNum - selectedStock.current_quantity).toFixed(2)} {selectedStock.ingredient.unit}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitClick}
              disabled={!isValid}
            >
              Aplicar Ajuste
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ajuste Manual</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o stock de <strong>{selectedStock?.ingredient.name}</strong> de <strong>{selectedStock?.current_quantity}</strong> para <strong>{quantityNum}</strong> {selectedStock?.ingredient.unit}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Processando...' : 'Confirmar Ajuste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
