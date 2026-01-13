import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCredits, type Credit } from '@/hooks/useSupabaseData';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface TransactionItem {
  id: string;
  transaction_id: string;
  quantity: number;
  unit_price: number;
  dishes: { name: string } | null;
}

interface Debtor extends Credit {
  items: TransactionItem[];
}

const DebtorsPage = () => {
  const { currentStore } = useCurrentStore();
  const { credits, loading: creditsLoading, error: creditsError } = useCredits(currentStore?.id || null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebtorDetails = async () => {
      if (creditsLoading) return;
      if (creditsError) {
        setError('Failed to load credits.');
        setLoading(false);
        return;
      }

      const unsettledCredits = credits.filter(c => c.status === 'unsettled');

      if (unsettledCredits.length === 0) {
        setDebtors([]);
        setLoading(false);
        return;
      }

      const transactionIds = unsettledCredits.map(c => c.transaction_id);

      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('id, transaction_id, quantity, unit_price, dishes(name)')
        .in('transaction_id', transactionIds);

      if (itemsError) {
        setError('Failed to load transaction details for debtors.');
        setLoading(false);
        console.error('Error fetching transaction items:', itemsError);
        return;
      }

      const itemsByTransactionId = new Map<string, TransactionItem[]>();
      items.forEach(item => {
        if (!itemsByTransactionId.has(item.transaction_id)) {
          itemsByTransactionId.set(item.transaction_id, []);
        }
        itemsByTransactionId.get(item.transaction_id)!.push(item as TransactionItem);
      });

      const debtorDetails: Debtor[] = unsettledCredits.map(credit => ({
        ...credit,
        items: itemsByTransactionId.get(credit.transaction_id) || [],
      }));

      setDebtors(debtorDetails);
      setLoading(false);
      setError(null);
    };

    fetchDebtorDetails();
  }, [credits, creditsLoading, creditsError]);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center">Debtors</h1>

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

        {!loading && !error && debtors.length === 0 && (
          <div className="text-center p-8 bg-muted/50 rounded-lg">
            <p>No outstanding debtors found.</p>
          </div>
        )}

        {!loading && !error && debtors.map((debtor) => (
          <Card key={debtor.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{debtor.customer_name}</CardTitle>
                <span className="text-lg font-bold text-destructive">
                  {Number(debtor.sale_amount).toLocaleString()} MT
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Date: {new Date(debtor.date).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mt-2 mb-2 text-muted-foreground">Itemized List:</h4>
              <ul className="space-y-1 text-sm">
                {debtor.items.map((item) => (
                  <li key={item.id} className="flex justify-between border-b pb-1">
                    <span>{item.dishes?.name || 'Unknown Item'}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} x {Number(item.unit_price).toLocaleString()} MT
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default DebtorsPage;