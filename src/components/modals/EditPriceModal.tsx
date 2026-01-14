import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  currentPrice: number | null;
  defaultPrice: number;
  onSave: (newPrice: number) => Promise<boolean>;
  onRemoveOverride: () => Promise<boolean>;
}

export function EditPriceModal({
  isOpen,
  onClose,
  dishName,
  currentPrice,
  defaultPrice,
  onSave,
  onRemoveOverride,
}: EditPriceModalProps) {
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNewPrice(currentPrice !== null ? String(currentPrice) : '');
    }
  }, [isOpen, currentPrice]);

  const handleSave = async () => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid positive number.', variant: 'destructive' });
      return;
    }

    const success = await onSave(priceValue);
    if (success) {
      onClose();
    }
  };

  const handleRemoveOverride = async () => {
    const success = await onRemoveOverride();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Price for {dishName}</DialogTitle>
          <DialogDescription>
            Set a custom price for this dish for the current store. The default price is {defaultPrice.toFixed(2)} MT.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Custom Price
            </Label>
            <Input
              id="price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter custom price"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <div>
            {currentPrice !== null && (
              <Button variant="destructive" onClick={handleRemoveOverride}>
                Remove Override
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Price</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
