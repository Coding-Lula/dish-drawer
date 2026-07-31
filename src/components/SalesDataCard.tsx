import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface SalesDataRow {
  id: string;
  date: string;
  table_name?: string;
  dish_name: string;
  quantity: number | null;
  unit_price: number;
  total: number;
  payment_method?: string;
  transaction_id?: string;
  creditor_name?: string;
}

interface SalesDataCardProps {
  title?: string;
  salesData: SalesDataRow[];
  showTableColumn?: boolean;
  showPaymentColumn?: boolean;
  isManager?: boolean;
  onDeleteItem?: (itemId: string, transactionId: string) => void;
}

export function SalesDataCard({
  title,
  salesData,
  showTableColumn = true,
  showPaymentColumn = true,
  isManager = false,
  onDeleteItem,
}: SalesDataCardProps) {
  const displayTitle = title || `Dados de Vendas (${salesData.length} itens)`;

  return (
    <Card>
      {title !== null && (
        <CardHeader>
          <CardTitle>{displayTitle}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {salesData.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Sem movimentos para apresentar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  {showTableColumn && <TableHead>Mesa</TableHead>}
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {showPaymentColumn && <TableHead>Pagamento</TableHead>}
                  {isManager && onDeleteItem && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.date}
                      {isManager && sale.payment_method === 'credit' && sale.creditor_name && (
                        <span className="text-xs text-muted-foreground mt-0.5 block font-normal">
                          {sale.creditor_name}
                        </span>
                      )}
                    </TableCell>
                    {showTableColumn && <TableCell>{sale.table_name || 'N/A'}</TableCell>}
                    <TableCell>{sale.dish_name}</TableCell>
                    <TableCell className="text-right">{sale.quantity ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {sale.unit_price < 0 ? '-' : ''}
                      {Math.abs(sale.unit_price).toLocaleString('pt-PT')} MT
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.total < 0 ? '-' : ''}
                      {Math.abs(sale.total).toLocaleString('pt-PT')} MT
                    </TableCell>
                    {showPaymentColumn && <TableCell>{sale.payment_method}</TableCell>}
                    {isManager && onDeleteItem && sale.transaction_id && (
                      <TableCell className="w-10 p-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              aria-label="Eliminar venda"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isto irá remover o item "{sale.dish_name}" ({sale.quantity}x) desta transação. Se este for o único item, a transação e seus registos associados (incluindo dívidas) serão eliminados. O stock de ingredientes correspondente a este item será reposto. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteItem(sale.id, sale.transaction_id!)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
