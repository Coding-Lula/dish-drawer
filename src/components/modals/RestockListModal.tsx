import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Package, ClipboardList } from 'lucide-react';
import { useState } from 'react';

interface RestockItem {
  ingredient_id: string;
  ingredientName: string;
  unit: string;
  currentQuantity: number;
  targetStock: number;
  amountToBuy: number;
  lastUnitCost: number | null;
  estimatedCost: number | null;
}

interface RestockListModalProps {
  storeName: string;
  restockItems: RestockItem[];
}

export function RestockListModal({ storeName, restockItems }: RestockListModalProps) {
  const [open, setOpen] = useState(false);

  const totalEstimatedCost = restockItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  const handleExport = () => {
    const lines = [
      `RESTOCK LIST - ${storeName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `${'Item'.padEnd(25)} | ${'Required'.padEnd(12)} | ${'Unit Cost'.padEnd(12)} | Est. Cost`,
      '─'.repeat(70),
      ...restockItems.map(item => {
        const name = item.ingredientName.substring(0, 24).padEnd(25);
        const required = `${item.amountToBuy} ${item.unit}`.padEnd(12);
        const unitCost = item.lastUnitCost ? `${item.lastUnitCost.toFixed(2)} MT`.padEnd(12) : 'N/A'.padEnd(12);
        const estCost = item.estimatedCost ? `${item.estimatedCost.toFixed(2)} MT` : 'N/A';
        return `${name} | ${required} | ${unitCost} | ${estCost}`;
      }),
      '─'.repeat(70),
      `${'TOTAL ESTIMATED COST:'.padEnd(54)} ${totalEstimatedCost.toLocaleString()} MT`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-list-${storeName?.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Export Restock List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Restock List - {storeName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No items need restocking
                  </TableCell>
                </TableRow>
              ) : (
                restockItems.map(item => (
                  <TableRow key={item.ingredient_id}>
                    <TableCell className="font-medium">{item.ingredientName}</TableCell>
                    <TableCell className="text-right">{item.currentQuantity} {item.unit}</TableCell>
                    <TableCell className="text-right">{item.targetStock} {item.unit}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">+{item.amountToBuy} {item.unit}</TableCell>
                    <TableCell className="text-right">
                      {item.lastUnitCost ? `${item.lastUnitCost.toFixed(2)} MT` : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.estimatedCost ? `${item.estimatedCost.toFixed(2)} MT` : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-lg font-semibold">
            Total Estimated Cost: <span className="text-primary">{totalEstimatedCost.toLocaleString()} MT</span>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <FileDown className="w-4 h-4" />
            Download List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
