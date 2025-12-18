import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UtensilsCrossed } from 'lucide-react';

interface AddDishModalProps {
  categories: string[];
  onSubmit: (dish: { name: string; category: string; selling_price: number; cost_of_production: number }) => Promise<any>;
}

export function AddDishModal({ categories, onSubmit }: AddDishModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Main');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costOfProduction, setCostOfProduction] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) return;
    
    setIsSubmitting(true);
    const result = await onSubmit({
      name,
      category,
      selling_price: parseFloat(sellingPrice),
      cost_of_production: parseFloat(costOfProduction) || 20
    });
    setIsSubmitting(false);
    
    if (result) {
      setName('');
      setSellingPrice('');
      setCostOfProduction('20');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Add New Menu Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Dish Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grilled Chicken"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Beverage">Beverage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Selling Price (MT)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="250"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cost of Production (MT)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={costOfProduction}
              onChange={(e) => setCostOfProduction(e.target.value)}
              placeholder="20"
            />
            <p className="text-xs text-muted-foreground">
              Virtual cost added to every dish (default: 20 MT)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !sellingPrice}>
              {isSubmitting ? 'Creating...' : 'Create Dish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
