import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCredits, useDebtorPayments, type Credit, type DebtorPayment } from '@/hooks/useSupabaseData';
import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Download, Loader2, User, UserPlus, X, CreditCard } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  total_paid: number;
  balance: number; // positive => credit in favor of customer
  bills: DebtorBill[];
  payments: DebtorPayment[];
}

function DebtorsContent() {
  const { currentStore } = useCurrentStore();
  const { credits, loading: creditsLoading } = useCredits(currentStore?.id || null);
  const { payments, loading: paymentsLoading, addPayment } = useDebtorPayments(currentStore?.id || null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

      // Chunk to avoid exceeding URL length limits when many IDs are in play
      const CHUNK = 100;
      const all: TransactionItem[] = [];
      let failed = false;
      for (let i = 0; i < transactionIds.length; i += CHUNK) {
        const slice = transactionIds.slice(i, i + CHUNK);
        const { data: items, error: itemsError } = await supabase
          .from('transaction_items')
          .select('id, transaction_id, quantity, unit_price, dishes(name)')
          .in('transaction_id', slice);
        if (itemsError) {
          console.error('Error fetching transaction items:', itemsError);
          failed = true;
          break;
        }
        all.push(...(items as TransactionItem[]));
      }
      if (failed) {
        setError('Failed to load transaction details for debtors.');
      } else {
        setTransactionItems(all);
      }
      
      setItemsLoading(false);
    };

    fetchTransactionItems();
  }, [credits, creditsLoading]);

  // Group credits + payments by customer name
  const groupedDebtors = useMemo((): GroupedDebtor[] => {
    const unsettledCredits = credits.filter(c => c.status === 'unsettled');

    const grouped = new Map<string, { display: string; bills: DebtorBill[]; payments: DebtorPayment[] }>();

    const ensure = (rawName: string) => {
      const key = rawName.trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, { display: rawName.trim(), bills: [], payments: [] });
      }
      return grouped.get(key)!;
    };

    unsettledCredits.forEach(credit => {
      const items = transactionItems.filter(item => item.transaction_id === credit.transaction_id);
      ensure(credit.customer_name).bills.push({ credit, items });
    });

    payments.forEach(p => {
      ensure(p.customer_name).payments.push(p);
    });

    return Array.from(grouped.values()).map(({ display, bills, payments: pays }) => {
      const total_owed = bills.reduce((s, b) => s + Number(b.credit.sale_amount), 0);
      const total_paid = pays.reduce((s, p) => s + Number(p.amount), 0);
      return {
        customer_name: display,
        total_owed,
        total_paid,
        balance: total_paid - total_owed,
        bills: bills.sort((a, b) => new Date(b.credit.date).getTime() - new Date(a.credit.date).getTime()),
        payments: pays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    })
    // Hide entries fully settled with zero balance
    .filter(d => d.bills.length > 0 || d.payments.length > 0)
    .sort((a, b) => (b.total_owed - b.total_paid) - (a.total_owed - a.total_paid));
  }, [credits, transactionItems, payments]);

  const existingNames = useMemo(() => {
    const set = new Set<string>();
    credits.forEach(c => set.add(c.customer_name.trim()));
    payments.forEach(p => set.add(p.customer_name.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [credits, payments]);

  const filteredNameSuggestions = formName.trim()
    ? existingNames.filter(n => n.toLowerCase().includes(formName.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const amount = parseFloat(formAmount);
    if (!name || !amount || amount <= 0) return;
    setSubmitting(true);
    const res = await addPayment({ customer_name: name, amount, note: formNote.trim() || undefined });
    setSubmitting(false);
    if (res) {
      setFormName('');
      setFormAmount('');
      setFormNote('');
      setShowAddCard(false);
    }
  };

  const loading = creditsLoading || itemsLoading || paymentsLoading;

  const handleDownload = () => {
    // Sheet 1: Summary (one row per debtor)
    const summaryData = groupedDebtors.map(debtor => ({
      'Nome do Devedor': debtor.customer_name,
      'Total em Dívida (MT)': debtor.total_owed
    }));

    // Sheet 2: Detailed breakdown
    const detailData = groupedDebtors.flatMap(debtor =>
      debtor.bills.flatMap(bill => {
        if (bill.items.length === 0) {
          return [{
            'Data': new Date(bill.credit.date).toLocaleDateString(),
            'Devedor': debtor.customer_name,
            'Item': 'Sem detalhes de itens',
            'Quantidade': 0,
            'Preço Unitário (MT)': 0,
            'Total (MT)': Number(bill.credit.sale_amount)
          }];
        }
        return bill.items.map(item => ({
          'Data': new Date(bill.credit.date).toLocaleDateString(),
          'Devedor': debtor.customer_name,
          'Item': item.dishes?.name || 'Item Desconhecido',
          'Quantidade': item.quantity,
          'Preço Unitário (MT)': item.unit_price,
          'Total (MT)': item.quantity * item.unit_price
        }));
      })
    );

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(detailData);

    // Set column widths
    ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
    ws2['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalhes');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Relatorio_Devedores_${date}.xlsx`);
  };

  const handleDownloadDebtor = (debtor: GroupedDebtor) => {
    const wb = XLSX.utils.book_new();

    const summary = [
      { Campo: 'Cliente', Valor: debtor.customer_name },
      { Campo: 'Total Faturado (MT)', Valor: debtor.total_owed },
      { Campo: 'Total Pago (MT)', Valor: debtor.total_paid },
      { Campo: 'Saldo (MT)', Valor: debtor.balance },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    const items = debtor.bills.flatMap(bill =>
      bill.items.length > 0
        ? bill.items.map(item => ({
            Data: new Date(bill.credit.date).toLocaleDateString(),
            Item: item.dishes?.name || 'Item Desconhecido',
            Quantidade: item.quantity,
            'Preço Unitário (MT)': item.unit_price,
            'Total (MT)': item.quantity * item.unit_price,
          }))
        : [{
            Data: new Date(bill.credit.date).toLocaleDateString(),
            Item: 'Sem detalhes de itens',
            Quantidade: 0,
            'Preço Unitário (MT)': 0,
            'Total (MT)': Number(bill.credit.sale_amount),
          }]
    );
    const wsItems = XLSX.utils.json_to_sheet(items);
    wsItems['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Faturas');

    const pays = debtor.payments.map(p => ({
      Data: new Date(p.date).toLocaleDateString(),
      'Valor (MT)': Number(p.amount),
      Nota: p.note || '',
    }));
    if (pays.length > 0) {
      const wsPay = XLSX.utils.json_to_sheet(pays);
      wsPay['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsPay, 'Pagamentos');
    }

    const safe = debtor.customer_name.replace(/[^a-zA-Z0-9]+/g, '_');
    XLSX.writeFile(wb, `Devedor_${safe}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <div className="text-center">
        <div className="absolute right-0 top-0 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddCard(v => !v)}
            title="Adicionar Crédito ao Devedor"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={groupedDebtors.length === 0}
            title="Descarregar Lista"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Devedores</h1>
        <p className="text-muted-foreground mt-1">
          {groupedDebtors.length} {groupedDebtors.length === 1 ? 'cliente' : 'clientes'} com saldo devedor
        </p>
      </div>

      {showAddCard && (
        <Card className="border-primary/40">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Adicionar Crédito ao Devedor
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowAddCard(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="debtor-name">Nome do Cliente</Label>
                <div className="relative" ref={suggestionsRef}>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="debtor-name"
                    value={formName}
                    onChange={e => { setFormName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Existente ou novo"
                    className="pl-10"
                    autoComplete="off"
                    maxLength={200}
                    required
                  />
                  {showSuggestions && filteredNameSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-auto">
                      {filteredNameSuggestions.map(name => (
                        <button
                          key={name}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => { setFormName(name); setShowSuggestions(false); }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="debtor-amount">Valor (MT)</Label>
                <Input
                  id="debtor-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting || !formName.trim() || !formAmount}>
                {submitting ? 'A guardar...' : 'Adicionar'}
              </Button>
              <div className="md:col-span-3 space-y-1.5">
                <Label htmlFor="debtor-note" className="text-xs text-muted-foreground">Nota (opcional)</Label>
                <Input
                  id="debtor-note"
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="Ex: pagamento parcial"
                />
              </div>
            </form>
            {formName.trim() && (() => {
              const match = groupedDebtors.find(d => d.customer_name.toLowerCase() === formName.trim().toLowerCase());
              if (!match) return null;
              const bal = match.balance;
              return (
                <div className="mt-3 text-sm flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Saldo actual de {match.customer_name}:</span>
                  <span className={`font-semibold ${bal > 0 ? 'text-green-600' : bal < 0 ? 'text-destructive' : ''}`}>
                    {bal > 0 ? '+' : ''}{bal.toLocaleString()} MT
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="ml-2">A carregar devedores...</p>
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
          <p>Nenhum devedor encontrado.</p>
        </div>
      )}

      {!loading && !error && groupedDebtors.map((debtor) => (
        <Card key={debtor.customer_name}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-xl truncate">{debtor.customer_name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDownloadDebtor(debtor)}
                      title="Descarregar itens deste devedor"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {debtor.bills.length} {debtor.bills.length === 1 ? 'fatura pendente' : 'faturas pendentes'}
                    {debtor.payments.length > 0 && ` · ${debtor.payments.length} pagamento(s)`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${debtor.balance > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {debtor.balance > 0 ? '+' : ''}{debtor.balance.toLocaleString()} MT
                </p>
                <p className="text-xs text-muted-foreground">
                  {debtor.balance > 0 ? 'Saldo a Favor' : 'Saldo em Dívida'}
                </p>
                {debtor.total_paid > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Fact. {debtor.total_owed.toLocaleString()} − Pago {debtor.total_paid.toLocaleString()}
                  </p>
                )}
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
                                {item.dishes?.name || 'Item Desconhecido'}
                              </span>
                              <span className="text-muted-foreground">
                                {item.quantity} × {Number(item.unit_price).toLocaleString()} MT
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Detalhes de itens indisponíveis</p>
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