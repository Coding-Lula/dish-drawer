import * as XLSX from 'xlsx';
import type { 
  IncomeSource, 
  ExpenseParentCategory, 
  ExpenseCategoryWithParent, 
  FinancialTransaction 
} from '@/hooks/useFinanceData';

interface ExportData {
  month: number;
  year: number;
  lockDate: string;
  totalIncome: number;
  totalExpenses: number;
  globalBalance: number;
  incomeBySource: { source: IncomeSource; amount: number }[];
  expensesByParentCategory: { parent: ExpenseParentCategory; amount: number }[];
  transactions: FinancialTransaction[];
  storeName: string;
  incomeStatement?: {
    grossRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    operationalExpenses: number;
    netProfit: number;
    netMarginPercent: number;
  };
}

export function exportFinancialReport(data: ExportData) {
  const wb = XLSX.utils.book_new();
  const monthName = getMonthName(data.month);
  
  // Sheet 1: Summary
  const summaryData = [
    ['RELATÓRIO FINANCEIRO'],
    [`MÊS: ${monthName} ${data.year}`],
    [`DATA DE BLOQUEIO: ${data.lockDate}`],
    [`LOJA: ${data.storeName}`],
    [],
    ['SUMÁRIO FINANCEIRO'],
    ['Receita Total:', formatCurrency(data.totalIncome)],
    ['Despesas Totais:', formatCurrency(data.totalExpenses)],
    ['Saldo Global:', formatCurrency(data.globalBalance)],
    [],
  ];

  if (data.incomeStatement) {
    summaryData.push(
      ['DEMONSTRAÇÃO DE RESULTADOS (DRE)'],
      ['(+) Receita Bruta de Vendas:', formatCurrency(data.incomeStatement.grossRevenue)],
      ['(-) Custo das Mercadorias Vendidas (CMV):', formatCurrency(data.incomeStatement.cogs)],
      ['(=) Lucro Bruto:', `${formatCurrency(data.incomeStatement.grossProfit)} (${data.incomeStatement.grossMarginPercent.toFixed(1)}%)`],
      ['(-) Despesas Operacionais e Financeiras:', formatCurrency(data.incomeStatement.operationalExpenses)],
      ['(=) Lucro Líquido do Período:', `${formatCurrency(data.incomeStatement.netProfit)} (${data.incomeStatement.netMarginPercent.toFixed(1)}%)`],
      []
    );
  }

  summaryData.push(
    ['RECEITA POR FONTE'],
    ...data.incomeBySource.map(item => [item.source.name, formatCurrency(item.amount)]),
    [],
    ['DESPESAS POR CATEGORIA'],
    ...data.expensesByParentCategory.map(item => [item.parent.name, formatCurrency(item.amount)])
  );
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Detailed Transactions
  const transactionsData = [
    ['Date', 'Type', 'Supplier', 'Amount (MT)', 'Category', 'Source', 'Invoice', 'Description'],
    ...data.transactions.map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.supplier || '-',
      Number(t.amount),
      t.expense_category_id || '-',
      t.source_id || '-',
      t.invoice_no || '-',
      t.description || '-'
    ])
  ];
  
  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
  transactionsSheet['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, 
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Transactions');


  // Download
  const fileName = `Financial_Report_${monthName}_${data.year}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} MT`;
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}