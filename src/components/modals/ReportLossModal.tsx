import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Ingredient, StoreStock } from '@/hooks/useSupabaseData';

interface ReportLossModalProps {
  ingredients: Ingredient[];
  stocks: StoreStock[];
  onReportLoss: (ingredientId: string, quantity: number) => Promise<boolean>;
}

export function ReportLossModal({ ingredients, stocks, onReportLoss }: ReportLossModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show ingredients that exist in store_stock
  const availableItems = stocks.map(stock => {
    const ingredient = ingredients.find(i => i.id === stock.ingredient_id);
    return ingredient ? { ...ingredient, currentStock: stock.current_quantity } : null;
  }).filter(Boolean) as (Ingredient & { currentStock: number })[];

  const selectedItem = availableItems.find(i => i.id === selectedIngredientId);
  const maxQuantity = selectedItem?.currentStock || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const isValid = selectedIngredientId && quantityNum > 0 && quantityNum <= maxQuantity;

  const handleSubmitClick = () => {
    if (!isValid) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    const success = await onReportLoss(selectedIngredientId, quantityNum);
    setSubmitting(false);
    setConfirmOpen(false);
    
    if (success) {
      setOpen(false);
      setSelectedIngredientId('');
      setQuantity('');
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedIngredientId('');
    setQuantity('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
            Reportar Perda
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reportar Perda/Quebra</DialogTitle>
            <DialogDescription>
              Selecione o item e a quantidade perdida. O stock será reduzido automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Item</Label>
              <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um item..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.currentStock} {item.unit} disponível)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade Perdida</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Máx: ${maxQuantity}`}
              />
              {quantityNum > maxQuantity && (
                <p className="text-xs text-destructive">
                  Quantidade excede o stock disponível ({maxQuantity})
                </p>
              )}
            </div>

            {selectedItem && quantityNum > 0 && quantityNum <= maxQuantity && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm">
                  <span className="font-medium">{selectedItem.name}</span>: {selectedItem.currentStock} → {selectedItem.currentStock - quantityNum} {selectedItem.unit}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmitClick}
              disabled={!isValid}
            >
              Reportar Perda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Perda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reportar a perda de <strong>{quantityNum} {selectedItem?.unit}</strong> de <strong>{selectedItem?.name}</strong>?
              Esta ação irá reduzir o stock permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? 'Processando...' : 'Confirmar Perda'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
