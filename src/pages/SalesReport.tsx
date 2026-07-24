import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CalendarIcon, Download, DollarSign, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useExpenses } from '@/hooks/useSupabaseData';
import { useFinancialTransactions } from '@/hooks/useFinanceData';
import { ItemizedSalesSummary } from '@/components/ItemizedSalesSummary';
import { useAuth } from '@/hooks/useAuth';
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

const NON_REVENUE_METHODS = ['credit', 'self'];

interface SalesItem {
  id: string;
  date: string;
  table_name: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: string;
  transaction_id: string;
  creditor_name?: string;
}

function SalesReportContent() {
  const { currentStore } = useCurrentStore();
  const { toast } = useToast();
  const { isManager } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(false);

  const startStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
  const endStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
  const { expenses: rawExpenses } = useExpenses(currentStore?.id || null, startStr, endStr);
  const { transactions: financialTransactions } = useFinancialTransactions(currentStore?.id || null, startStr, endStr);

  const fetchSalesData = async () => {
    if (!currentStore?.id || !startDate || !endDate) return;

    setLoading(true);
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, date, payment_method, table_id,
        restaurant_tables(name),
        transaction_items(id, quantity, unit_price, dish_id, dishes(name)),
        credits(customer_name)
      `)
      .eq('store_id', currentStore.id)
      .gte('date', `${start}T00:00:00`)
      .lte('date', `${end}T23:59:59`)
      .order('date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching sales', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const items: SalesItem[] = [];
    (transactions || []).forEach((tx: any) => {
      const creditorName = tx.credits?.[0]?.customer_name || tx.credits?.customer_name || undefined;
      (tx.transaction_items || []).forEach((item: any) => {
        items.push({
          id: item.id,
          date: format(new Date(tx.date), 'dd/MM/yyyy HH:mm'),
          table_name: tx.restaurant_tables?.name || 'N/A',
          dish_name: item.dishes?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total: Number(item.unit_price) * item.quantity,
          payment_method: tx.payment_method,
          transaction_id: tx.id,
          creditor_name: creditorName,
        });
      });
    });

    setSalesData(items);
    setLoading(false);
  };

  const deleteSale = async (transactionId: string) => {
    setLoading(true);
    try {
      // 1. Fetch transaction items
      const { data: items, error: itemsErr } = await supabase
        .from('transaction_items')
        .select('dish_id, quantity')
        .eq('transaction_id', transactionId);

      if (itemsErr) {
        toast({ title: 'Erro ao buscar itens da venda', description: itemsErr.message, variant: 'destructive' });
        return;
      }

      // 2. Fetch transaction store_id
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .select('store_id')
        .eq('id', transactionId)
        .single();

      if (txErr) {
        toast({ title: 'Erro ao buscar detalhes da transação', description: txErr.message, variant: 'destructive' });
        return;
      }

      // 3. Restore stock of ingredients
      if (items && items.length > 0) {
        const dishIds = items.map(item => item.dish_id).filter(Boolean);
        if (dishIds.length > 0) {
          const { data: recipes, error: recipesErr } = await supabase
            .from('recipes')
            .select('dish_id, ingredient_id, quantity_required')
            .in('dish_id', dishIds);

          if (recipesErr) {
            toast({ title: 'Erro ao buscar receitas dos pratos', description: recipesErr.message, variant: 'destructive' });
            return;
          }

          const restoreMap = new Map<string, number>();
          for (const item of items) {
            if (!item.dish_id) continue;
            const dishRecipes = (recipes || []).filter(r => r.dish_id === item.dish_id);
            for (const recipe of dishRecipes) {
              const qtyToRestore = Number(recipe.quantity_required) * item.quantity;
              restoreMap.set(recipe.ingredient_id, (restoreMap.get(recipe.ingredient_id) || 0) + qtyToRestore);
            }
          }

          const ingredientIds = Array.from(restoreMap.keys());
          if (ingredientIds.length > 0) {
            const { data: stocks, error: stocksErr } = await supabase
              .from('store_stock')
              .select('id, ingredient_id, current_quantity')
              .eq('store_id', tx.store_id)
              .in('ingredient_id', ingredientIds);

            if (stocksErr) {
              toast({ title: 'Erro ao buscar stock da loja', description: stocksErr.message, variant: 'destructive' });
              return;
            }

            for (const ingredientId of ingredientIds) {
              const qtyToRestore = restoreMap.get(ingredientId) || 0;
              const stockRecord = stocks?.find(s => s.ingredient_id === ingredientId);
              if (stockRecord) {
                const newQty = stockRecord.current_quantity + qtyToRestore;
                const { error: updateErr } = await supabase
                  .from('store_stock')
                  .update({ current_quantity: newQty })
                  .eq('id', stockRecord.id);

                if (updateErr) {
                  toast({ title: 'Erro ao atualizar stock', description: updateErr.message, variant: 'destructive' });
                  return;
                }
              }
            }
          }
        }
      }

      // 4. Delete associated credits (if any)
      const { error: cErr } = await supabase.from('credits').delete().eq('transaction_id', transactionId);
      if (cErr) {
        toast({ title: 'Erro ao apagar registo de crédito', description: cErr.message, variant: 'destructive' });
        return;
      }

      // 5. Delete transaction items
      const { error: iErr } = await supabase.from('transaction_items').delete().eq('transaction_id', transactionId);
      if (iErr) {
        toast({ title: 'Erro ao apagar itens da transação', description: iErr.message, variant: 'destructive' });
        return;
      }

      // 6. Delete the main transaction
      const { error: tErr } = await supabase.from('transactions').delete().eq('id', transactionId);
      if (tErr) {
        toast({ title: 'Erro ao apagar transação', description: tErr.message, variant: 'destructive' });
        return;
      }

      setSalesData(prev => prev.filter(s => s.transaction_id !== transactionId));
      toast({ title: 'Venda eliminada com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro inesperado', description: err.message || err, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (salesData.length === 0) return;
    
    const headers = ['Date', 'Table', 'Item', 'Qty', 'Price', 'Total', 'Payment'];
    const rows = salesData.map(s => [s.date, s.table_name, s.dish_name, s.quantity, s.unit_price, s.total, s.payment_method]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(startDate!, 'yyyy-MM-dd')}-to-${format(endDate!, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Exclude self-consumption from Total Sales entirely (it's not a sale)
  const selfConsumptionTotal = salesData
    .filter(s => s.payment_method === 'self')
    .reduce((sum, s) => sum + s.total, 0);
  const grandTotal = salesData
    .filter(s => s.payment_method !== 'self')
    .reduce((sum, s) => sum + s.total, 0);
  const nonRevenueTotal = salesData
    .filter(s => s.payment_method === 'credit')
    .reduce((sum, s) => sum + s.total, 0);
  const operationalExpensesTotal = (rawExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
  const financialExpensesTotal = (financialTransactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const expensesTotal = operationalExpensesTotal + financialExpensesTotal;
  const netRevenue = grandTotal - nonRevenueTotal - expensesTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Report</h1>
          <p className="text-muted-foreground">View detailed sales by date range</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm text-muted-foreground">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
            </Popover>
          </div>
          <Button onClick={fetchSalesData} disabled={loading}>{loading ? 'Loading...' : 'Generate Report'}</Button>
          {salesData.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          )}
        </CardContent>
      </Card>

      {salesData.length > 0 && (
        <ItemizedSalesSummary salesData={salesData} />
      )}

      {salesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <span className="text-lg font-bold text-foreground">{grandTotal.toLocaleString()} MT</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-orange-600">Less: Non-Revenue</span>
              <span className="text-sm font-medium text-destructive">- {nonRevenueTotal.toLocaleString()} MT</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-orange-600">Less: Expenses</span>
              <span className="text-sm font-medium text-destructive">- {expensesTotal.toLocaleString()} MT</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-base font-semibold text-primary">Net Revenue</span>
              <span className="text-xl font-bold text-primary">{netRevenue.toLocaleString()} MT</span>
            </div>
          </CardContent>
        </Card>
      )}

      {salesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Data ({salesData.length} items) - Total: {grandTotal.toLocaleString()} MT</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  {isManager && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.date}
                      {isManager && sale.payment_method === 'credit' && sale.creditor_name && (
                        <span className="text-xs text-muted-foreground mt-0.5 block font-normal">
                          {sale.creditor_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{sale.table_name}</TableCell>
                    <TableCell>{sale.dish_name}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">{sale.unit_price.toLocaleString()} MT</TableCell>
                    <TableCell className="text-right">{sale.total.toLocaleString()} MT</TableCell>
                    <TableCell>{sale.payment_method}</TableCell>
                    {isManager && (
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
                              <AlertDialogTitle>Eliminar venda?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isto irá remover toda a transação ({sale.table_name}) e os seus registos associados (incluindo dívidas, se houver). Esta ação não pode ser desfeita e o stock de ingredientes será reposto.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSale(sale.transaction_id)}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SalesReport() {
  return <MainLayout><SalesReportContent /></MainLayout>;
}
