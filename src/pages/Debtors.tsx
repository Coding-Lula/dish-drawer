import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCredits, type Credit } from '@/hooks/useSupabaseData';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, User } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TransactionItem {
  id: string;
  transaction_id: string;
  quantity: number;
  unit_price: number;
  dishes: { name: string } | null;
}

interface DebtorBill {
  credit: Credit;
  items: TransactionItem[];
}

interface GroupedDebtor {
  customer_name: string;
  total_owed: number;
  bills: DebtorBill[];
}

function DebtorsContent() {
  const { currentStore } = useCurrentStore();
  const { credits, loading: creditsLoading } = useCredits(currentStore?.id || null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transaction items for all credits
  useEffect(() => {
    const fetchTransactionItems = async () => {
      if (creditsLoading) return;
      
      const unsettledCredits = credits.filter(c => c.status === 'unsettled');
      
      if (unsettledCredits.length === 0) {
        setTransactionItems([]);
        setItemsLoading(false);
        return;
      }

      const transactionIds = unsettledCredits
        .map(c => c.transaction_id)
        .filter(Boolean) as string[];

      if (transactionIds.length === 0) {
        setTransactionItems([]);
        setItemsLoading(false);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('id, transaction_id, quantity, unit_price, dishes(name)')
        .in('transaction_id', transactionIds);

      if (itemsError) {
        setError('Failed to load transaction details for debtors.');
        console.error('Error fetching transaction items:', itemsError);
      } else {
        setTransactionItems(items as TransactionItem[]);
      }
      
      setItemsLoading(false);
    };

    fetchTransactionItems();
  }, [credits, creditsLoading]);

  // Group credits by customer name
  const groupedDebtors = useMemo((): GroupedDebtor[] => {
    const unsettledCredits = credits.filter(c => c.status === 'unsettled');
    
    const grouped = new Map<string, DebtorBill[]>();
    
    unsettledCredits.forEach(credit => {
      const name = credit.customer_name.trim().toLowerCase();
      const items = transactionItems.filter(item => item.transaction_id === credit.transaction_id);
      
      if (!grouped.has(name)) {
        grouped.set(name, []);
      }
      grouped.get(name)!.push({ credit, items });
    });

    return Array.from(grouped.entries()).map(([_, bills]) => ({
      customer_name: bills[0].credit.customer_name,
      total_owed: bills.reduce((sum, bill) => sum + Number(bill.credit.sale_amount), 0),
      bills: bills.sort((a, b) => new Date(b.credit.date).getTime() - new Date(a.credit.date).getTime())
    })).sort((a, b) => b.total_owed - a.total_owed);
  }, [credits, transactionItems]);

  const loading = creditsLoading || itemsLoading;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Debtors</h1>
        <p className="text-muted-foreground mt-1">
          {groupedDebtors.length} customer{groupedDebtors.length !== 1 ? 's' : ''} with outstanding balance
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="ml-2">Loading debtors...</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="ml-2 text-destructive font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && groupedDebtors.length === 0 && (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <p>No outstanding debtors found.</p>
        </div>
      )}

      {!loading && !error && groupedDebtors.map((debtor) => (
        <Card key={debtor.customer_name}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{debtor.customer_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {debtor.bills.length} outstanding bill{debtor.bills.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-destructive">
                  {debtor.total_owed.toLocaleString()} MT
                </p>
                <p className="text-xs text-muted-foreground">Total Owed</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {debtor.bills.map((bill, index) => (
                <AccordionItem key={bill.credit.id} value={bill.credit.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(bill.credit.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-semibold text-destructive">
                        {Number(bill.credit.sale_amount).toLocaleString()} MT
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-4 border-l-2 border-muted ml-2">
                      {bill.items.length > 0 ? (
                        <ul className="space-y-2">
                          {bill.items.map((item) => (
                            <li key={item.id} className="flex justify-between text-sm">
                              <span className="text-foreground">
                                {item.dishes?.name || 'Unknown Item'}
                              </span>
                              <span className="text-muted-foreground">
                                {item.quantity} × {Number(item.unit_price).toLocaleString()} MT
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No item details available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const DebtorsPage = () => {
  return (
    <MainLayout>
      <DebtorsContent />
    </MainLayout>
  );
};

export default DebtorsPage;