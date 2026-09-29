import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, endOfDay } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface TransactionItem {
  id: string;
  transaction_id: string;
  quantity: number;
  unit_price: number;
  dishes: { name: string } | null;
}

interface DebtorBill {
  credit: {
    id: string;
    date: string;
    sale_amount: number;
    customer_name: string;
  };
  items: TransactionItem[];
}

interface DebtorPayment {
  id: string;
  date: string;
  amount: number;
  customer_name: string;
  note?: string;
}

interface GroupedDebtor {
  customer_name: string;
  total_owed: number;
  total_paid: number;
  balance: number;
  bills: DebtorBill[];
  payments: DebtorPayment[];
}

interface GlobalDebtorReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedDebtors: GroupedDebtor[];
}

export function GlobalDebtorReportModal({
  open,
  onOpenChange,
  groupedDebtors,
}: GlobalDebtorReportModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [downloading, setDownloading] = useState(false);

  // Compute filtered data and statistics based on selected date window
  const reportData = (() => {
    if (!startDate || !endDate) {
      return { debtors: [], totalPrevBalance: 0, totalOwed: 0, totalPaid: 0, totalFinalBalance: 0 };
    }

    const start = startDate;
    const end = endOfDay(endDate);

    let totalPrevBalance = 0;
    let totalOwed = 0;
    let totalPaid = 0;
    let totalFinalBalance = 0;

    const filteredDebtors = groupedDebtors
      .map((debtor) => {
        // Previous balance before start date
        const prevOwed = debtor.bills
          .filter((b) => new Date(b.credit.date) < start)
          .reduce((sum, b) => sum + Number(b.credit.sale_amount), 0);

        const prevPaid = debtor.payments
          .filter((p) => new Date(p.date) < start)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const prevBalance = prevPaid - prevOwed;

        // Bills within interval
        const activeBills = debtor.bills.filter((b) => {
          const billDate = new Date(b.credit.date);
          return billDate >= start && billDate <= end;
        });

        // Payments within interval
        const activePayments = debtor.payments.filter((p) => {
          const paymentDate = new Date(p.date);
          return paymentDate >= start && paymentDate <= end;
        });

        const activeOwed = activeBills.reduce((sum, b) => sum + Number(b.credit.sale_amount), 0);
        const activePaid = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);

        const finalBalance = prevBalance + activePaid - activeOwed;

        const hasActivity = activeBills.length > 0 || activePayments.length > 0;
        const nonZeroBalance = finalBalance !== 0 || prevBalance !== 0;

        return {
          customer_name: debtor.customer_name,
          prevBalance,
          activeOwed,
          activePaid,
          finalBalance,
          activeBills,
          activePayments,
          hasActivityOrBalance: hasActivity || nonZeroBalance,
        };
      })
      // Exclude debtors with no activity and zero balance within the selected date window
      .filter((d) => d.hasActivityOrBalance);

    filteredDebtors.forEach((d) => {
      totalPrevBalance += d.prevBalance;
      totalOwed += d.activeOwed;
      totalPaid += d.activePaid;
      totalFinalBalance += d.finalBalance;
    });

    return {
      debtors: filteredDebtors,
      totalPrevBalance,
      totalOwed,
      totalPaid,
      totalFinalBalance,
    };
  })();

  const handleDownloadExcel = async () => {
    if (!startDate || !endDate) return;
    setDownloading(true);

    try {
      // Sheet 1: Summary (Resumo)
      const summaryData = reportData.debtors.map((debtor) => ({
        'Nome do Devedor': debtor.customer_name,
        'Saldo Anterior (MT)': debtor.prevBalance,
        'Consumido (MT)': debtor.activeOwed,
        'Pago (MT)': debtor.activePaid,
        'Saldo Final (MT)': debtor.finalBalance,
      }));

      // Sheet 2: Detailed breakdown (Detalhes) within date window
      const detailData = reportData.debtors.flatMap((debtor) => {
        const billRows = debtor.activeBills.flatMap((bill) => {
          if (bill.items.length === 0) {
            return [
              {
                Data: new Date(bill.credit.date).toLocaleDateString(),
                Devedor: debtor.customer_name,
                Tipo: 'Consumo',
                Item: 'Sem detalhes de itens',
                Quantidade: 0,
                'Preço Unitário (MT)': 0,
                'Total (MT)': Number(bill.credit.sale_amount),
              },
            ];
          }
          return bill.items.map((item) => ({
            Data: new Date(bill.credit.date).toLocaleDateString(),
            Devedor: debtor.customer_name,
            Tipo: 'Consumo',
            Item: item.dishes?.name || 'Item Desconhecido',
            Quantidade: item.quantity,
            'Preço Unitário (MT)': item.unit_price,
            'Total (MT)': item.quantity * item.unit_price,
          }));
        });

        const paymentRows = debtor.activePayments.map((p) => ({
          Data: new Date(p.date).toLocaleDateString(),
          Devedor: debtor.customer_name,
          Tipo: 'Pagamento',
          Item: p.note?.trim() ? `Pagamento — ${p.note}` : 'Pagamento',
          Quantidade: 1,
          'Preço Unitário (MT)': -Number(p.amount),
          'Total (MT)': -Number(p.amount),
        }));

        return [...billRows, ...paymentRows];
      });

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      const ws2 = XLSX.utils.json_to_sheet(detailData);

      ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
      ws2['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
      XLSX.utils.book_append_sheet(wb, ws2, 'Detalhes');

      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      XLSX.writeFile(wb, `Relatorio_Geral_Devedores_${startStr}_a_${endStr}.xlsx`);
    } catch (err) {
      console.error('Error generating global Excel report:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Relatório Geral de Devedores
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 items-end py-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground font-medium">Data de Início</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground font-medium">Data de Fim</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Total Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                Saldo Anterior Total
              </span>
              <p
                className={cn(
                  "text-xl font-bold mt-1",
                  reportData.totalPrevBalance > 0
                    ? "text-green-600"
                    : reportData.totalPrevBalance < 0
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {reportData.totalPrevBalance > 0 ? '+' : ''}
                {reportData.totalPrevBalance < 0 ? '-' : ''}
                {Math.abs(reportData.totalPrevBalance).toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                Consumido no Período
              </span>
              <p className="text-xl font-bold mt-1 text-foreground">
                {reportData.totalOwed.toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                Pago no Período
              </span>
              <p className="text-xl font-bold mt-1 text-green-600">
                {reportData.totalPaid.toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-primary block font-semibold uppercase tracking-wider">
                Saldo Final Total
              </span>
              <p
                className={cn(
                  "text-xl font-bold mt-1",
                  reportData.totalFinalBalance > 0
                    ? "text-green-600"
                    : reportData.totalFinalBalance < 0
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {reportData.totalFinalBalance > 0 ? '+' : ''}
                {reportData.totalFinalBalance < 0 ? '-' : ''}
                {Math.abs(reportData.totalFinalBalance).toLocaleString('pt-PT')} MT
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {reportData.debtors.length}{' '}
            {reportData.debtors.length === 1 ? 'cliente incluído' : 'clientes incluídos'} no relatório para o período selecionado.
          </p>
        </div>

        <DialogFooter className="border-t border-border pt-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancelar
          </Button>
          <Button onClick={handleDownloadExcel} disabled={downloading || reportData.debtors.length === 0}>
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A Gerar Excel...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descarregar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
