import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';
import type { StoreStock, Ingredient } from '@/hooks/useSupabaseData';

interface CorrectionRow {
  ingredientName: string;
  unit: string;
  currentQty: number;
  newQty: number;
  difference: number;
  stockId: string;
  matched: boolean;
}

interface UnmatchedRow {
  ingredientName: string;
  newQty: number;
}

interface BulkStockCorrectionModalProps {
  stocks: StoreStock[];
  ingredients: Ingredient[];
  storeName: string;
  onAdjust: (stockId: string, newQuantity: number) => Promise<boolean>;
  onComplete: () => void;
  trigger?: React.ReactNode;
}

export function BulkStockCorrectionModal({ stocks, ingredients, storeName, onAdjust, onComplete, trigger }: BulkStockCorrectionModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionRow[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([]);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = stocks.map(stock => {
      const ing = ingredients.find(i => i.id === stock.ingredient_id);
      return {
        'Ingredient': ing?.name || '',
        'Unit': ing?.unit || '',
        'Current Qty': stock.current_quantity,
        'New Qty': ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, `stock-correction-${storeName.toLowerCase().replace(/\s/g, '-')}.xlsx`);
    toast({ title: 'Template baixado', description: 'Preencha a coluna "New Qty" e faça upload.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      const matched: CorrectionRow[] = [];
      const unmatchedRows: UnmatchedRow[] = [];

      for (const row of rows) {
        const name = String(row['Ingredient'] || '').trim();
        const newQtyRaw = row['New Qty'];
        
        if (!name || newQtyRaw === '' || newQtyRaw === undefined || newQtyRaw === null) continue;
        
        const newQty = Number(newQtyRaw);
        if (isNaN(newQty) || newQty < 0) continue;

        const ingredient = ingredients.find(i => i.name.toLowerCase().trim() === name.toLowerCase());
        if (!ingredient) {
          unmatchedRows.push({ ingredientName: name, newQty });
          continue;
        }

        const stock = stocks.find(s => s.ingredient_id === ingredient.id);
        if (!stock) {
          unmatchedRows.push({ ingredientName: name, newQty });
          continue;
        }

        if (newQty === stock.current_quantity) continue;

        matched.push({
          ingredientName: ingredient.name,
          unit: ingredient.unit,
          currentQty: stock.current_quantity,
          newQty,
          difference: newQty - stock.current_quantity,
          stockId: stock.id,
          matched: true,
        });
      }

      setCorrections(matched);
      setUnmatched(unmatchedRows);
      setStep('preview');
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleApplyAll = async () => {
    setApplying(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of corrections) {
      const result = await onAdjust(row.stockId, row.newQty);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    toast({
      title: 'Correção em massa concluída',
      description: `${successCount} item(s) corrigido(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    setApplying(false);
    onComplete();
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setCorrections([]);
    setUnmatched([]);
    setStep('upload');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Correcção em Massa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Correcção de Stock em Massa</DialogTitle>
          <DialogDescription>
            Baixe o template, corrija as quantidades, e faça upload para aplicar.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            {/* Step 1: Download */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">1. Baixar Template</h3>
              <p className="text-sm text-muted-foreground">
                O template inclui todos os itens do stock actual com as quantidades actuais.
              </p>
              <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 w-fit">
                <Download className="w-4 h-4" />
                Baixar Template (.xlsx)
              </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">2. Fazer Upload do Ficheiro Corrigido</h3>
              <p className="text-sm text-muted-foreground">
                Preencha a coluna "New Qty" com as quantidades correctas e faça upload.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 w-fit">
                <Upload className="w-4 h-4" />
                Escolher Ficheiro
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-2">
            {corrections.length === 0 && unmatched.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma alteração encontrada no ficheiro.
              </p>
            )}

            {corrections.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{corrections.length} alteração(ões) encontrada(s)</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead className="text-right">Qty Actual</TableHead>
                      <TableHead className="text-right">Nova Qty</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {row.ingredientName}
                          <span className="text-muted-foreground ml-1 text-xs">({row.unit})</span>
                        </TableCell>
                        <TableCell className="text-right">{row.currentQty}</TableCell>
                        <TableCell className="text-right font-medium">{row.newQty}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.difference > 0 ? 'default' : 'destructive'}>
                            {row.difference > 0 ? '+' : ''}{row.difference}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {unmatched.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600">{unmatched.length} item(s) não encontrado(s)</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {unmatched.map((row, idx) => (
                    <p key={idx}>• {row.ingredientName} (Qty: {row.newQty})</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Voltar
              </Button>
              {corrections.length > 0 && (
                <Button onClick={handleApplyAll} disabled={applying}>
                  {applying ? 'Aplicando...' : `Aplicar ${corrections.length} Correção(ões)`}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
