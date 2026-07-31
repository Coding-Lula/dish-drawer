import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, endOfDay } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SalesDataCard, type SalesDataRow } from '@/components/SalesDataCard';

interface DebtorBillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  storeName: string;
  bills: any[];
  payments: any[];
  onDownload: (
    startDate: Date,
    endDate: Date,
    salesRows: SalesDataRow[],
    previousBalance: number,
    periodOwed: number,
    periodPaid: number,
    balance: number
  ) => Promise<void>;
}

export function DebtorBillingModal({
  open,
  onOpenChange,
  customerName,
  bills,
  payments,
  onDownload,
}: DebtorBillingModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [downloading, setDownloading] = useState(false);

  const stats = (() => {
    if (!startDate || !endDate) {
      return { salesRows: [], previousBalance: 0, periodOwed: 0, periodPaid: 0, cumulativeBalance: 0 };
    }

    const start = startDate;
    // Set 'end' to include the full final day of the selected period (e.g. 23:59:59.999)
    const end = endOfDay(endDate);

    // 1. Calculate overall previous balance (before start date)
    // Previous Owed: Bills before start date
    const prevOwed = bills
      .filter((b) => {
        const billDate = new Date(b.credit.date);
        return billDate < start;
      })
      .reduce((sum, b) => sum + Number(b.credit.sale_amount), 0);

    // Previous Paid: Payments before start date
    const prevPaid = payments
      .filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate < start;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const prevBalance = prevPaid - prevOwed; // positive means credit in favor, negative means debt

    // 2. Filter itemized sales and payments within the interval [start, end]
    const activeSalesRows: SalesDataRow[] = [];

    // Filter bills within interval
    const activeBills = bills.filter((b) => {
      const billDate = new Date(b.credit.date);
      return billDate >= start && billDate <= end;
    });

    activeBills.forEach((bill) => {
      const billDateStr = format(new Date(bill.credit.date), 'dd/MM/yyyy HH:mm');
      if (bill.items.length === 0) {
        activeSalesRows.push({
          id: bill.credit.id,
          date: billDateStr,
          dish_name: 'Consumo',
          quantity: null,
          unit_price: Number(bill.credit.sale_amount),
          total: Number(bill.credit.sale_amount),
        });
      } else {
        bill.items.forEach((item: any) => {
          activeSalesRows.push({
            id: item.id,
            date: billDateStr,
            dish_name: item.dishes?.name || 'Item Desconhecido',
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            total: item.quantity * Number(item.unit_price),
          });
        });
      }
    });

    // Filter payments within interval
    const activePayments = payments.filter((p) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= start && paymentDate <= end;
    });

    activePayments.forEach((p) => {
      const paymentDateStr = format(new Date(p.date), 'dd/MM/yyyy HH:mm');
      activeSalesRows.push({
        id: p.id,
        date: paymentDateStr,
        dish_name: p.note?.trim() ? `Pagamento — ${p.note}` : 'Pagamento',
        quantity: null,
        unit_price: -Number(p.amount),
        total: -Number(p.amount),
      });
    });

    // Sort combined rows by date ascending for the receipt/bill preview
    activeSalesRows.sort((a, b) => {
      // Parse dates of format 'dd/MM/yyyy HH:mm'
      const parseDateStr = (str: string) => {
        const [d, m, y, h, min] = str.split(/[\/\s:]/);
        return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)).getTime();
      };
      return parseDateStr(a.date) - parseDateStr(b.date);
    });

    const activeOwed = activeBills.reduce((sum, b) => sum + Number(b.credit.sale_amount), 0);
    const activePaid = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const curBalance = prevBalance + activePaid - activeOwed;

    return {
      salesRows: activeSalesRows,
      previousBalance: prevBalance,
      periodOwed: activeOwed,
      periodPaid: activePaid,
      cumulativeBalance: curBalance,
    };
  })();

  const handleDownloadClick = async () => {
    if (!startDate || !endDate) return;
    setDownloading(true);
    try {
      await onDownload(
        startDate,
        endDate,
        stats.salesRows,
        stats.previousBalance,
        stats.periodOwed,
        stats.periodPaid,
        stats.cumulativeBalance
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Gerar Conta Corrente — {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 items-end py-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground font-medium">Data de Início</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground font-medium">Data de Fim</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 min-h-[250px]">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">Saldo Anterior</span>
              <p className={cn("text-xl font-bold mt-1", stats.previousBalance > 0 ? "text-green-600" : stats.previousBalance < 0 ? "text-destructive" : "text-foreground")}>
                {stats.previousBalance > 0 ? '+' : ''}
                {stats.previousBalance < 0 ? '-' : ''}
                {Math.abs(stats.previousBalance).toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">Consumido</span>
              <p className="text-xl font-bold mt-1 text-foreground">
                {stats.periodOwed.toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">Pago</span>
              <p className="text-xl font-bold mt-1 text-green-600">
                {stats.periodPaid.toLocaleString('pt-PT')} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-primary block font-semibold uppercase tracking-wider">Saldo Final</span>
              <p className={cn("text-xl font-bold mt-1", stats.cumulativeBalance > 0 ? "text-green-600" : stats.cumulativeBalance < 0 ? "text-destructive" : "text-foreground")}>
                {stats.cumulativeBalance > 0 ? '+' : ''}
                {stats.cumulativeBalance < 0 ? '-' : ''}
                {Math.abs(stats.cumulativeBalance).toLocaleString('pt-PT')} MT
              </p>
            </div>
          </div>

          {/* Live Table Preview */}
          <div>
            <span className="text-sm font-semibold text-muted-foreground block mb-3 uppercase tracking-wider">Pré-visualização do Período</span>
            <SalesDataCard
              title={null as any}
              salesData={stats.salesRows}
              showTableColumn={false}
              showPaymentColumn={false}
              isManager={false}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancelar
          </Button>
          <Button onClick={handleDownloadClick} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A Gerar PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
