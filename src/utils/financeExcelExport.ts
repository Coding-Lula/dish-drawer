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
  marginThreshold?: number;
  performanceAnalytics?: {
    topCategories: { name: string; revenue: number; quantity: number }[];
    topItems: { name: string; revenue: number; quantity: number }[];
  };
  lowMarginItems?: { name: string; selling_price: number; totalCost: number; margin: number }[];
  incomeStatement?: {
    grossRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    operationalExpenses: number;
    financialExpenses?: number;
    totalExpenses?: number;
    netProfit: number;
    netMarginPercent: number;
    operationalBreakdown?: { categoryName: string; totalAmount: number }[];
    financialBreakdown?: { categoryName: string; totalAmount: number }[];
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
      ['(-) Despesas Operacionais:', formatCurrency(data.incomeStatement.operationalExpenses)],
    );

    if (data.incomeStatement.operationalBreakdown && data.incomeStatement.operationalBreakdown.length > 0) {
      data.incomeStatement.operationalBreakdown.forEach(op => {
        summaryData.push([`   • ${op.categoryName}:`, formatCurrency(op.totalAmount)]);
      });
    }

    summaryData.push(
      ['(-) Despesas Financeiras:', formatCurrency(data.incomeStatement.financialExpenses || 0)],
    );

    if (data.incomeStatement.financialBreakdown && data.incomeStatement.financialBreakdown.length > 0) {
      data.incomeStatement.financialBreakdown.forEach(fin => {
        summaryData.push([`   • ${fin.categoryName}:`, formatCurrency(fin.totalAmount)]);
      });
    }

    summaryData.push(
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
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Performance & Product Margins (Filtered by Margin Threshold)
  if (data.performanceAnalytics || data.lowMarginItems) {
    const threshold = data.marginThreshold ?? 10;
    const performanceData: any[][] = [
      ['RELATÓRIO DE DESEMPENHO E MARGENS (ITENS REGULARES)'],
      [`LIMIAR MÍNIMO DE MARGEM APLICADO: ${threshold}%`],
      [],
    ];

    if (data.performanceAnalytics) {
      performanceData.push(
        ['TOP CATEGORIAS POR RECEITA'],
        ['Categoria', 'Receita (MT)', 'Quantidade Vendida'],
        ...data.performanceAnalytics.topCategories.map(c => [c.name, Number(c.revenue), Number(c.quantity)]),
        [],
        ['TOP ITENS POR QUANTIDADE'],
        ['Item', 'Receita (MT)', 'Quantidade Vendida'],
        ...data.performanceAnalytics.topItems.map(i => [i.name, Number(i.revenue), Number(i.quantity)]),
        []
      );
    }

    if (data.lowMarginItems) {
      const minThresholdRatio = threshold / 100;
      // Filter out low margin items so only items meeting or exceeding margin threshold are exported
      const regularMarginItems = data.lowMarginItems.filter(i => i.margin >= minThresholdRatio);

      performanceData.push(
        [`ITENS COM MARGEM ADEQUADA (≥ ${threshold}%)`],
        ['Item', 'Preço de Venda (MT)', 'Custo Total (MT)', 'Margem de Lucro (%)'],
        ...regularMarginItems.map(i => [
          i.name,
          Number(i.selling_price),
          Number(i.totalCost.toFixed(2)),
          `${(i.margin * 100).toFixed(1)}%`
        ])
      );
    }

    const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
    performanceSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, performanceSheet, 'Desempenho & Margens');
  }

  // Sheet 3: Detailed Transactions
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