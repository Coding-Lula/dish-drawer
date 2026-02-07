import { useState, useRef, useEffect } from 'react';
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
  existingCustomers?: string[];
}

export function CreditCustomerModal({ open, onOpenChange, amount, onConfirm, existingCustomers = [] }: CreditCustomerModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = customerName.trim()
    ? existingCustomers.filter(c => c.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
            Venda a Crédito - Nome do Cliente Obrigatório
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700">
              Esta venda será registrada como um crédito. Por favor, insira o nome do cliente para o controle da dívida.
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-2">
              {amount.toLocaleString()} MT
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente</Label>
            <div className="relative" ref={wrapperRef}>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Digite o nome do cliente"
                className="pl-10"
                autoFocus
                required
                autoComplete="off"
              />
              {showSuggestions && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-auto">
                  {filtered.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => { setCustomerName(name); setShowSuggestions(false); }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!customerName.trim()}>
              Confirmar venda a crédito
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
