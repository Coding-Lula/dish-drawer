import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard } from 'lucide-react';

interface CreditCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: (customerName: string) => void;
}

export function CreditCustomerModal({ open, onOpenChange, amount, onConfirm }: CreditCustomerModalProps) {
  const [customerName, setCustomerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      onConfirm(customerName.trim());
      setCustomerName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            Credit Sale - Customer Name Required
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700">
              This sale will be recorded as a credit. Please enter the customer's name for debt tracking.
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-2">
              {amount.toLocaleString()} MT
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Digite o nome do cliente"
                className="pl-10"
                autoFocus
                required
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!customerName.trim()}>
              Confirm Credit Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}